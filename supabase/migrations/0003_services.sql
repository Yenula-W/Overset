-- Durable server jobs, authoritative usage, billing and an email outbox.
create table public.plan_limits (id text primary key, seats integer not null check(seats > 0));
insert into public.plan_limits values ('free',1),('creator',1),('pro',1),('team',5),('publisher',20);
alter table public.plan_limits enable row level security;
create policy plan_limits_read on public.plan_limits for select to authenticated using (true);
create table public.workspace_billing (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique, subscription_id text unique,
 credits integer not null default 0 check (credits >= 0),
 period text, resets_at timestamptz, last_event bigint not null default 0
);
create table public.billing_events (id text primary key, created_at timestamptz not null default now());
create table public.processing_tasks (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 page_id text not null, action text not null, state text not null default 'running',
 lease text not null, expires_at timestamptz not null, result jsonb,
 input_tokens integer not null default 0, output_tokens integer not null default 0,
 model text, updated_at timestamptz not null default now()
);
create table public.page_charges (
 page_id text primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 period text not null, credit boolean not null default false, original_sha text not null,
 created_at timestamptz not null default now()
);
create table public.email_outbox (
 id text primary key, owner_id uuid references auth.users(id) on delete cascade,
 payload jsonb not null, state text not null default 'pending', attempts integer not null default 0,
 created_at timestamptz not null default now(), delivered_at timestamptz
);
alter table public.workspace_billing enable row level security;
alter table public.billing_events enable row level security;
alter table public.processing_tasks enable row level security;
alter table public.page_charges enable row level security;
alter table public.email_outbox enable row level security;
create policy billing_read on public.workspace_billing for select to authenticated using (private.workspace_role(owner_id::text) is not null);
create policy tasks_read on public.processing_tasks for select to authenticated using (private.workspace_role(owner_id::text) is not null);
-- Browser-authored counters are not trustworthy, even for owners.
create or replace function private.guard_services() returns trigger language plpgsql set search_path = '' as $$
declare seats integer; plan text; email text;
begin
 if coalesce(auth.role(), '') = 'service_role' then return coalesce(new, old); end if;
 if coalesce(new.store, old.store) = 'usage' then raise exception 'Usage is recorded by the server.'; end if;
 if tg_op = 'INSERT' and new.store = 'team' then
   select data ->> 'plan' into plan from public.records where store = 'users' and id = new.owner_id::text for update;
   select coalesce((select p.seats from public.plan_limits p where p.id = plan),1) into seats;
   if (select count(*) from public.records where store = 'team' and owner_id = new.owner_id) >= seats - 1 then raise exception 'Your plan has no available team seats.'; end if;
   if new.data ->> 'role' not in ('translator','proofreader','typesetter','viewer') then raise exception 'Invalid team role.'; end if;
   email := lower(trim(new.data ->> 'email'));
   if exists(select 1 from public.records where store = 'team' and owner_id = new.owner_id and lower(data ->> 'email') = email) then raise exception 'That person is already on your team.'; end if;
 end if;
 return coalesce(new, old);
end $$;
create trigger guard_services before insert or update or delete on public.records for each row execute function private.guard_services();
-- A row lock on the owner serializes all quota reservations and credit purchases.
create function public.reserve_page(task text, workspace uuid, page text, operation text, fingerprint text, token text, allowance integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job public.processing_tasks; billing public.workspace_billing; period_key text; used integer; credit_used boolean := false;
begin
 perform 1 from public.records where store = 'users' and id = workspace::text for update;
 if not found then raise exception 'Workspace profile missing.'; end if;
 select * into job from public.processing_tasks where id = task for update;
 if found and job.owner_id <> workspace then raise exception 'Wrong workspace.'; end if;
 if job.state = 'complete' then return jsonb_build_object('cached', true, 'result', job.result); end if;
 if job.state = 'running' and job.expires_at > now() then return jsonb_build_object('busy', true); end if;
 insert into public.workspace_billing(owner_id) values(workspace) on conflict do nothing;
 select * into billing from public.workspace_billing where owner_id = workspace for update;
 period_key := case when billing.period is not null and billing.resets_at > now() then billing.period else to_char(now() at time zone 'UTC','YYYY-MM') end;
 if not exists(select 1 from public.page_charges where page_id = page) then
   select coalesce((data ->> 'pagesProcessed')::integer,0) into used from public.records where store = 'usage' and id = workspace::text || ':' || period_key;
   if coalesce(used,0) >= allowance then
     if billing.credits <= 0 then return jsonb_build_object('limit', true); end if;
     credit_used := true;
     update public.workspace_billing set credits = credits - 1 where owner_id = workspace;
   end if;
   insert into public.page_charges(page_id,owner_id,period,credit,original_sha) values(page,workspace,period_key,credit_used,fingerprint);
   insert into public.records(store,id,owner_id,data) values('usage',workspace::text || ':' || period_key,workspace,jsonb_build_object('id',workspace::text || ':' || period_key,'ownerId',workspace::text,'period',period_key,'pagesProcessed',1,'pagesExported',0))
   on conflict(store,id) do update set data = public.records.data || jsonb_build_object('pagesProcessed',coalesce((public.records.data ->> 'pagesProcessed')::integer,0)+1);
 elsif exists(select 1 from public.page_charges where page_id = page and (owner_id <> workspace or original_sha <> fingerprint)) then
   raise exception 'The original page changed; upload it as a new page.';
 end if;
 insert into public.processing_tasks(id,owner_id,page_id,action,lease,expires_at) values(task,workspace,page,operation,token,now()+interval '5 minutes')
 on conflict(id) do update set state='running', lease=token, expires_at=excluded.expires_at, updated_at=now();
 return jsonb_build_object('started',true);
end $$;
create function public.finish_page(task text, token text, page text, expected jsonb, regions jsonb, result_data jsonb, model_name text, tokens_in integer, tokens_out integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare job public.processing_tasks;
begin
 select * into job from public.processing_tasks where id=task and lease=token and state='running' for update;
 if not found then return false; end if;
 perform 1 from public.records where store='pages' and id=page and owner_id=job.owner_id and data -> 'regions' = expected for update;
 if not found then
   update public.processing_tasks set state='failed',updated_at=now() where id=task;
   return false;
 end if;
 -- Preserve a full region snapshot for restore/audit before machine edits.
 insert into public.records(store,id,owner_id,data) values('versions','ver_'||token,job.owner_id,jsonb_build_object('id','ver_'||token,'ownerId',job.owner_id::text,'pageId',page,'chapterId',(select data ->> 'chapterId' from public.records where store='pages' and id=page),'kind','translation','actor','AI','summary',job.action||' generated','createdAt',now(),'regionSnapshot',expected));
 update public.records set data=jsonb_set(data,'{regions}',regions) where store='pages' and id=page and owner_id=job.owner_id;
 update public.processing_tasks set state='complete',result=result_data,model=model_name,input_tokens=tokens_in,output_tokens=tokens_out,updated_at=now() where id=task;
 return true;
end $$;
create function public.apply_billing(event_id text, workspace uuid, event_time bigint, customer text, subscription text, plan_id text, period_key text, reset_date timestamptz, credit_pages integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare prior bigint; prior_customer text;
begin
 perform 1 from public.records where store='users' and id=workspace::text for update;
 if not found then raise exception 'Workspace profile missing.'; end if;
 insert into public.billing_events(id) values(event_id) on conflict do nothing;
 if not found then return false; end if;
 insert into public.workspace_billing(owner_id) values(workspace) on conflict do nothing;
 select last_event,customer_id into prior,prior_customer from public.workspace_billing where owner_id=workspace for update;
 if prior_customer is not null and prior_customer <> customer then raise exception 'Billing customer mismatch.'; end if;
 update public.workspace_billing set customer_id=customer,credits=credits+greatest(credit_pages,0) where owner_id=workspace;
 if plan_id is not null and event_time >= prior then
   if plan_id not in ('free','creator','pro','team','publisher') then raise exception 'Invalid plan.'; end if;
   update public.workspace_billing set subscription_id=subscription,period=period_key,resets_at=reset_date,last_event=event_time where owner_id=workspace;
   update public.records set data=jsonb_set(data,'{plan}',to_jsonb(plan_id)) where store='users' and id=workspace::text;
 end if;
 return true;
end $$;
revoke all on function public.reserve_page(text,uuid,text,text,text,text,integer) from public,anon,authenticated;
revoke all on function public.finish_page(text,text,text,jsonb,jsonb,jsonb,text,integer,integer) from public,anon,authenticated;
revoke all on function public.apply_billing(text,uuid,bigint,text,text,text,text,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.reserve_page(text,uuid,text,text,text,text,integer) to service_role;
grant execute on function public.finish_page(text,text,text,jsonb,jsonb,jsonb,text,integer,integer) to service_role;
grant execute on function public.apply_billing(text,uuid,bigint,text,text,text,text,timestamptz,integer) to service_role;

grant select on public.plan_limits, public.workspace_billing, public.processing_tasks to authenticated;
grant all on public.plan_limits, public.workspace_billing, public.billing_events, public.processing_tasks, public.page_charges, public.email_outbox to service_role;

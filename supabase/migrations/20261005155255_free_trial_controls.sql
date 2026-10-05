-- Lifetime counters and browser claims intentionally survive account deletion.
-- No emails, raw IPs, or device fingerprints are stored here.
create table public.free_trial_accounts (
 owner_id uuid primary key,
 pages_used integer not null default 0 check (pages_used >= 0)
);
create table public.free_trial_devices (
 device_hash text primary key,
 owner_id uuid not null,
 network_hash text,
 claimed_at timestamptz not null default now()
);
create index free_trial_network_claims on public.free_trial_devices(network_hash, claimed_at);
alter table public.free_trial_accounts enable row level security;
alter table public.free_trial_devices enable row level security;
revoke all on public.free_trial_accounts, public.free_trial_devices from public, anon, authenticated;
grant all on public.free_trial_accounts, public.free_trial_devices to service_role;
-- Previously consumed free pages do not turn into a fresh trial.
insert into public.free_trial_accounts(owner_id,pages_used)
select c.owner_id, count(*)::integer from public.page_charges c
join public.records r on r.store='users' and r.id=c.owner_id::text
where r.data->>'plan'='free' and not c.credit group by c.owner_id;

alter function public.reserve_page(text,uuid,text,text,text,text,integer) rename to reserve_page_internal;
create function public.reserve_page(task text, workspace uuid, page text, operation text, fingerprint text, token text, allowance integer, device_key text default null, network_key text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare plan text; used integer; claimed_by uuid; is_new boolean; result_data jsonb; trial_page boolean := false;
begin
 select data->>'plan' into plan from public.records where store='users' and id=workspace::text for update;
 if not found then raise exception 'Workspace profile missing.'; end if;
 if plan <> 'free' then
   return public.reserve_page_internal(task,workspace,page,operation,fingerprint,token,allowance);
 end if;
 is_new := not exists(select 1 from public.page_charges where page_id=page);
 insert into public.free_trial_accounts(owner_id) values(workspace) on conflict do nothing;
 select pages_used into used from public.free_trial_accounts where owner_id=workspace for update;
 if is_new and used < 10 then
   -- Paid credits remain usable even on a shared or trial-ineligible browser.
   if coalesce((select credits from public.workspace_billing where owner_id=workspace),0) > 0 then
     allowance := 0;
   else
     if not exists(select 1 from auth.users where id=workspace and email_confirmed_at is not null) then
       return jsonb_build_object('trial_error','email');
     end if;
     if device_key is null or device_key !~ '^[a-f0-9]{64}$' then return jsonb_build_object('trial_error','identity'); end if;
     -- Serialize shared identities across different accounts, not just one workspace.
     perform pg_advisory_xact_lock(hashtextextended(device_key,0));
     select owner_id into claimed_by from public.free_trial_devices where device_hash=device_key;
     if claimed_by is not null and claimed_by <> workspace then return jsonb_build_object('trial_error','device'); end if;
     if claimed_by is null then
       if network_key is not null then
         if network_key !~ '^[a-f0-9]{64}$' then return jsonb_build_object('trial_error','identity'); end if;
         perform pg_advisory_xact_lock(hashtextextended(network_key,1));
         update public.free_trial_devices set network_hash=null where network_hash is not null and claimed_at < now()-interval '30 days';
         if (select count(*) from public.free_trial_devices where network_hash=network_key and claimed_at > now()-interval '24 hours') >= 3 then
           return jsonb_build_object('trial_error','network');
         end if;
       end if;
       insert into public.free_trial_devices(device_hash,owner_id,network_hash) values(device_key,workspace,network_key);
     end if;
     trial_page := true;
     -- Lifetime quota is enforced above; the legacy monthly counter is not an entitlement.
     allowance := 2147483647;
   end if;
 else
   allowance := 0;
 end if;
 result_data := public.reserve_page_internal(task,workspace,page,operation,fingerprint,token,allowance);
 if is_new and trial_page and result_data->>'started'='true' then
   update public.free_trial_accounts set pages_used=pages_used+1 where owner_id=workspace;
 end if;
 return result_data;
end $$;
revoke all on function public.reserve_page(text,uuid,text,text,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.reserve_page(text,uuid,text,text,text,text,integer,text,text) to service_role;

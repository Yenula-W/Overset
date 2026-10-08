-- Ten free pages per UTC calendar month, counted from durable server charges.
-- Retain persistent device/network eligibility claims and lifetime analytics.
create index if not exists page_charges_owner_created on public.page_charges(owner_id,created_at) where not credit;

create or replace function public.reserve_page(task text, workspace uuid, page text, operation text, fingerprint text, token text, allowance integer, device_key text default null, network_key text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare plan text; used integer; claimed_by uuid; network_owner uuid; is_new boolean; result_data jsonb; trial_page boolean := false;
begin
 select data->>'plan' into plan from public.records where store='users' and id=workspace::text for update;
 if not found then raise exception 'Workspace profile missing.'; end if;
 if plan <> 'free' then
   return public.reserve_page_internal(task,workspace,page,operation,fingerprint,token,allowance);
 end if;
 is_new := not exists(select 1 from public.page_charges where page_id=page);
 insert into public.free_trial_accounts(owner_id) values(workspace) on conflict do nothing;
 select count(*) into used from public.page_charges where owner_id=workspace and not credit
   and created_at >= date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'
   and created_at < (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC';
 if is_new and used < 10 then
   -- Paid credits remain usable even on a shared or trial-ineligible browser.
   if coalesce((select credits from public.workspace_billing where owner_id=workspace),0) > 0 then
     allowance := 0;
   else
     if not exists(select 1 from auth.users where id=workspace and email_confirmed_at is not null) then
       return jsonb_build_object('trial_error','email');
     end if;
     if device_key is null or device_key !~ '^[a-f0-9]{64}$' then return jsonb_build_object('trial_error','identity'); end if;
     if network_key is null or network_key !~ '^[a-f0-9]{64}$' then return jsonb_build_object('trial_error','identity'); end if;
     -- One network claim across browsers, cookies, emails, and account deletion.
     -- Lock network before browser consistently to prevent claim races.
     perform pg_advisory_xact_lock(hashtextextended(network_key,1));
     select owner_id into network_owner from public.free_trial_networks where network_hash=network_key;
     if network_owner is not null and network_owner <> workspace then return jsonb_build_object('trial_error','network'); end if;
     perform pg_advisory_xact_lock(hashtextextended(device_key,0));
     select owner_id into claimed_by from public.free_trial_devices where device_hash=device_key;
     if claimed_by is not null and claimed_by <> workspace then return jsonb_build_object('trial_error','device'); end if;
     if network_owner is null then
       insert into public.free_trial_networks(network_hash,owner_id) values(network_key,workspace);
     end if;
     if claimed_by is null then
       insert into public.free_trial_devices(device_hash,owner_id,network_hash) values(device_key,workspace,network_key);
     end if;
     trial_page := true;
     -- The durable charge count above enforces the monthly quota, even if usage records are removed.
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

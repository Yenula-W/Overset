-- Access helpers move to a schema the API doesn't expose, so they can only be
-- used by policies, not called directly over /rest/v1/rpc. Policies evaluate
-- auth.uid() once per statement instead of once per row.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.confirmed_email()
returns text
language sql stable security definer set search_path = ''
as $$
  select lower(u.email) from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null
$$;

create or replace function private.workspace_role(workspace text)
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when auth.uid() is null then null
    when workspace = auth.uid()::text then 'owner'
    else (
      select r.data ->> 'role' from public.records r
      where r.store = 'team'
        and r.owner_id::text = workspace
        and lower(r.data ->> 'email') = private.confirmed_email()
      limit 1
    )
  end
$$;

create or replace function private.can_edit_workspace(workspace text)
returns boolean
language sql stable set search_path = ''
as $$
  select coalesce(private.workspace_role(workspace) in ('owner', 'translator', 'proofreader', 'typesetter'), false)
$$;

revoke all on function private.confirmed_email() from public, anon;
revoke all on function private.workspace_role(text) from public, anon;
revoke all on function private.can_edit_workspace(text) from public, anon;
grant execute on function private.confirmed_email() to authenticated;
grant execute on function private.workspace_role(text) to authenticated;
grant execute on function private.can_edit_workspace(text) to authenticated;

drop policy if exists records_select on public.records;
create policy records_select on public.records for select to authenticated
  using (private.workspace_role(owner_id::text) is not null);

drop policy if exists records_insert on public.records;
create policy records_insert on public.records for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    or (store not in ('users', 'team') and private.can_edit_workspace(owner_id::text))
  );

drop policy if exists records_update on public.records;
create policy records_update on public.records for update to authenticated
  using (owner_id = (select auth.uid()) or (store not in ('users', 'team') and private.can_edit_workspace(owner_id::text)))
  with check (owner_id = (select auth.uid()) or (store not in ('users', 'team') and private.can_edit_workspace(owner_id::text)));

drop policy if exists records_delete on public.records;
create policy records_delete on public.records for delete to authenticated
  using (owner_id = (select auth.uid()) or (store not in ('users', 'team') and private.can_edit_workspace(owner_id::text)));

drop policy if exists pages_select on storage.objects;
create policy pages_select on storage.objects for select to authenticated
  using (bucket_id = 'pages' and private.workspace_role((storage.foldername(name))[1]) is not null);

drop policy if exists pages_insert on storage.objects;
create policy pages_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'pages' and private.can_edit_workspace((storage.foldername(name))[1]));

drop policy if exists pages_update on storage.objects;
create policy pages_update on storage.objects for update to authenticated
  using (bucket_id = 'pages' and private.can_edit_workspace((storage.foldername(name))[1]));

drop policy if exists pages_delete on storage.objects;
create policy pages_delete on storage.objects for delete to authenticated
  using (bucket_id = 'pages' and private.can_edit_workspace((storage.foldername(name))[1]));

create or replace function public.accept_invites()
returns setof text
language plpgsql security definer set search_path = ''
as $$
declare
  email text := private.confirmed_email();
begin
  if email is null then
    return;
  end if;
  return query
    update public.records r
       set data = r.data || jsonb_build_object('status', 'active', 'userId', auth.uid()::text, 'lastActive', to_jsonb(now()))
     where r.store = 'team' and lower(r.data ->> 'email') = email
    returning r.owner_id::text;
end
$$;

create or replace function public.my_workspaces()
returns table (owner_id text, owner_name text, role text)
language sql stable security definer set search_path = ''
as $$
  select t.owner_id::text, coalesce(p.data ->> 'name', 'Workspace'), t.data ->> 'role'
  from public.records t
  left join public.records p on p.store = 'users' and p.owner_id = t.owner_id
  where t.store = 'team' and lower(t.data ->> 'email') = private.confirmed_email()
$$;

drop function if exists public.can_edit_workspace(text);
drop function if exists public.workspace_role(text);
drop function if exists public.confirmed_email();

-- Covers the cascade from auth.users when an account is deleted.
create index if not exists records_owner_fk_idx on public.records (owner_id);

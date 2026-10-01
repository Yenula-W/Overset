-- Overset cloud schema.
--
-- Every record the app stores lives in one table, keyed by (store, id), with
-- the record itself in `data`. This mirrors the browser database one-to-one,
-- so the app's repository layer runs unchanged against either backend.
--
-- Access is decided entirely by row-level security: a record is visible to
-- its workspace owner and to people the owner has invited to their team.
-- Page images live in the private `pages` storage bucket under
-- `<owner id>/<blob id>` and follow the same rules.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.records (
  store text not null check (store in (
    'users', 'projects', 'chapters', 'pages', 'blobs', 'characters', 'glossary',
    'memory', 'comments', 'versions', 'team', 'usage'
  )),
  id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (store, id),
  -- A profile is its own owner; everything else must name its owner in the
  -- record too, so the app and the database can never disagree about it.
  constraint records_owner_matches check (
    case when store = 'users' then data ->> 'id' = owner_id::text and id = owner_id::text
         else data ->> 'ownerId' = owner_id::text end
  ),
  constraint records_id_matches check (data ->> 'id' = id)
);

create index if not exists records_owner_idx on public.records (store, owner_id);
create index if not exists records_project_idx on public.records (store, (data ->> 'projectId'));
create index if not exists records_chapter_idx on public.records (store, (data ->> 'chapterId'));
create index if not exists records_team_email_idx on public.records (lower(data ->> 'email')) where store = 'team';

-- Email of the caller, only once they have proven they own it. Invitations
-- are matched by email, so an unconfirmed address must never count.
create or replace function public.confirmed_email()
returns text
language sql stable security definer set search_path = ''
as $$
  select lower(u.email) from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null
$$;

-- The caller's role in a workspace: 'owner', a team role, or null for none.
-- Security definer so it can read team rows without recursing through RLS.
create or replace function public.workspace_role(workspace text)
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
        and lower(r.data ->> 'email') = public.confirmed_email()
      limit 1
    )
  end
$$;

create or replace function public.can_edit_workspace(workspace text)
returns boolean
language sql stable
as $$
  select coalesce(public.workspace_role(workspace) in ('owner', 'translator', 'proofreader', 'typesetter'), false)
$$;

alter table public.records enable row level security;

drop policy if exists records_select on public.records;
create policy records_select on public.records for select to authenticated
  using (public.workspace_role(owner_id::text) is not null);

-- Members edit the work; only the owner manages the team and their profile.
drop policy if exists records_insert on public.records;
create policy records_insert on public.records for insert to authenticated
  with check (
    owner_id = auth.uid()
    or (store not in ('users', 'team') and public.can_edit_workspace(owner_id::text))
  );

drop policy if exists records_update on public.records;
create policy records_update on public.records for update to authenticated
  using (owner_id = auth.uid() or (store not in ('users', 'team') and public.can_edit_workspace(owner_id::text)))
  with check (owner_id = auth.uid() or (store not in ('users', 'team') and public.can_edit_workspace(owner_id::text)));

drop policy if exists records_delete on public.records;
create policy records_delete on public.records for delete to authenticated
  using (owner_id = auth.uid() or (store not in ('users', 'team') and public.can_edit_workspace(owner_id::text)));

-- The plan decides what a customer is billed, so the browser can't change it.
-- Only the server (service role, e.g. a billing webhook) may.
create or replace function public.records_guard()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.owner_id <> old.owner_id then
    raise exception 'A record cannot move to another workspace.';
  end if;
  if new.store = 'users' and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.data := jsonb_set(new.data, '{plan}', '"free"');
    else
      new.data := jsonb_set(new.data, '{plan}', coalesce(old.data -> 'plan', '"free"'));
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists records_guard on public.records;
create trigger records_guard before insert or update on public.records
  for each row execute function public.records_guard();

-- Called after sign-in: marks the caller's pending invitations as accepted.
create or replace function public.accept_invites()
returns setof text
language plpgsql security definer set search_path = ''
as $$
declare
  email text := public.confirmed_email();
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

-- Workspaces the caller belongs to, with the owner's display name.
create or replace function public.my_workspaces()
returns table (owner_id text, owner_name text, role text)
language sql stable security definer set search_path = ''
as $$
  select t.owner_id::text, coalesce(p.data ->> 'name', 'Workspace'), t.data ->> 'role'
  from public.records t
  left join public.records p on p.store = 'users' and p.owner_id = t.owner_id
  where t.store = 'team' and lower(t.data ->> 'email') = public.confirmed_email()
$$;

revoke all on function public.accept_invites() from public, anon;
revoke all on function public.my_workspaces() from public, anon;
grant execute on function public.accept_invites() to authenticated;
grant execute on function public.my_workspaces() to authenticated;

/* ------------------------------------------------------------- rate limits */

-- Fixed-window limiter shared by every server instance. Only the server's
-- service role may call it, so nobody can drain someone else's allowance.
create table if not exists public.rate_limits (
  key text primary key,
  tokens integer not null,
  window_started timestamptz not null
);
alter table public.rate_limits enable row level security;

create or replace function public.take_rate_token(bucket text, max_tokens integer, window_ms integer)
returns table (ok boolean, retry_after_ms integer)
language plpgsql security definer set search_path = ''
as $$
declare
  bucket_row public.rate_limits;
  window_len interval := make_interval(secs => window_ms / 1000.0);
begin
  insert into public.rate_limits as rl (key, tokens, window_started)
  values (bucket, max_tokens, now())
  on conflict (key) do update
    set tokens = case when rl.window_started + window_len <= now() then max_tokens else rl.tokens end,
        window_started = case when rl.window_started + window_len <= now() then now() else rl.window_started end
  returning * into bucket_row;

  if bucket_row.tokens <= 0 then
    return query select false, greatest(0, (extract(epoch from (bucket_row.window_started + window_len - now())) * 1000)::integer);
    return;
  end if;
  update public.rate_limits set tokens = tokens - 1 where key = bucket;
  return query select true, 0;
end
$$;

revoke all on function public.take_rate_token(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_rate_token(text, integer, integer) to service_role;

/* --------------------------------------------------------------- realtime */

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'records') then
    alter publication supabase_realtime add table public.records;
  end if;
end
$$;

/* ---------------------------------------------------------------- storage */

insert into storage.buckets (id, name, public)
values ('pages', 'pages', false)
on conflict (id) do nothing;

drop policy if exists pages_select on storage.objects;
create policy pages_select on storage.objects for select to authenticated
  using (bucket_id = 'pages' and public.workspace_role((storage.foldername(name))[1]) is not null);

drop policy if exists pages_insert on storage.objects;
create policy pages_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'pages' and public.can_edit_workspace((storage.foldername(name))[1]));

drop policy if exists pages_update on storage.objects;
create policy pages_update on storage.objects for update to authenticated
  using (bucket_id = 'pages' and public.can_edit_workspace((storage.foldername(name))[1]));

drop policy if exists pages_delete on storage.objects;
create policy pages_delete on storage.objects for delete to authenticated
  using (bucket_id = 'pages' and public.can_edit_workspace((storage.foldername(name))[1]));

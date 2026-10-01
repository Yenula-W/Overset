import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Minimal stand-ins for the parts of Supabase the migration depends on.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id serial primary key, bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema storage to anon, authenticated, service_role;
`;

const OWNER = '11111111-1111-1111-1111-111111111111';
const MEMBER = '22222222-2222-2222-2222-222222222222';
const STRANGER = '33333333-3333-3333-3333-333333333333';
const VIEWER = '44444444-4444-4444-4444-444444444444';

async function setup() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.exec(readFileSync(new URL('../supabase/migrations/0001_overset.sql', import.meta.url), 'utf8'));
  await db.exec(`
    grant select, insert, update, delete on public.records to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
    grant usage on all sequences in schema storage to authenticated;
    insert into auth.users values
      ('${OWNER}', 'owner@example.com', now()),
      ('${MEMBER}', 'member@example.com', now()),
      ('${STRANGER}', 'stranger@example.com', now()),
      ('${VIEWER}', 'viewer@example.com', now());
  `);
  return db;
}

/** Runs `sql` as a signed-in user, the way PostgREST would. */
async function as(db, userId, sql, params = []) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false); select set_config('request.jwt.claim.role', 'authenticated', false);`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claim.role', '', false);`);
  }
}

const rec = (store, id, owner, extra = {}) => JSON.stringify({ id, ownerId: owner, ...extra });

test('owners see their records and strangers see nothing', async () => {
  const db = await setup();
  await as(db, OWNER, `insert into records (store, id, owner_id, data) values ('projects', 'prj_1', $1, $2)`, [OWNER, rec('projects', 'prj_1', OWNER, { name: 'Mine' })]);
  const mine = await as(db, OWNER, `select id from records where store = 'projects'`);
  assert.equal(mine.rows.length, 1);
  const theirs = await as(db, STRANGER, `select id from records where store = 'projects'`);
  assert.equal(theirs.rows.length, 0);
  await assert.rejects(
    as(db, STRANGER, `insert into records (store, id, owner_id, data) values ('projects', 'prj_x', $1, $2)`, [OWNER, rec('projects', 'prj_x', OWNER)]),
    /row-level security/,
  );
});

test('a record must name the same owner as its row', async () => {
  const db = await setup();
  await assert.rejects(
    as(db, OWNER, `insert into records (store, id, owner_id, data) values ('projects', 'prj_1', $1, $2)`, [OWNER, rec('projects', 'prj_1', STRANGER)]),
    /records_owner_matches/,
  );
});

test('invited members can work in the owner workspace; viewers only read', async () => {
  const db = await setup();
  await as(db, OWNER, `insert into records (store, id, owner_id, data) values
    ('team', 'tm_1', $1, $2), ('team', 'tm_2', $1, $3), ('projects', 'prj_1', $1, $4)`, [
    OWNER,
    rec('team', 'tm_1', OWNER, { email: 'Member@Example.com', role: 'translator', status: 'invited' }),
    rec('team', 'tm_2', OWNER, { email: 'viewer@example.com', role: 'viewer', status: 'invited' }),
    rec('projects', 'prj_1', OWNER, { name: 'Shared' }),
  ]);

  const seen = await as(db, MEMBER, `select id from records where store = 'projects'`);
  assert.deepEqual(seen.rows.map((r) => r.id), ['prj_1']);
  await as(db, MEMBER, `insert into records (store, id, owner_id, data) values ('chapters', 'chp_1', $1, $2)`, [OWNER, rec('chapters', 'chp_1', OWNER, { projectId: 'prj_1' })]);

  // Members can't manage the team or touch the owner's profile.
  await assert.rejects(
    as(db, MEMBER, `insert into records (store, id, owner_id, data) values ('team', 'tm_9', $1, $2)`, [OWNER, rec('team', 'tm_9', OWNER, { email: 'x@example.com', role: 'translator' })]),
    /row-level security/,
  );

  const viewerSees = await as(db, VIEWER, `select id from records where store = 'chapters'`);
  assert.equal(viewerSees.rows.length, 1);
  await assert.rejects(
    as(db, VIEWER, `insert into records (store, id, owner_id, data) values ('chapters', 'chp_2', $1, $2)`, [OWNER, rec('chapters', 'chp_2', OWNER, { projectId: 'prj_1' })]),
    /row-level security/,
  );
  const removed = await as(db, VIEWER, `delete from records where store = 'chapters' returning id`);
  assert.equal(removed.rows.length, 0);

  const accepted = await as(db, MEMBER, `select * from accept_invites()`);
  assert.deepEqual(accepted.rows.map((r) => r.accept_invites), [OWNER]);
  const team = await as(db, OWNER, `select data from records where id = 'tm_1'`);
  assert.equal(team.rows[0].data.status, 'active');

  const workspaces = await as(db, MEMBER, `select * from my_workspaces()`);
  assert.equal(workspaces.rows[0].owner_id, OWNER);
  assert.equal(workspaces.rows[0].role, 'translator');
});

test('an unconfirmed email does not unlock an invitation', async () => {
  const db = await setup();
  await db.exec(`update auth.users set email_confirmed_at = null where id = '${MEMBER}'`);
  await as(db, OWNER, `insert into records (store, id, owner_id, data) values ('team', 'tm_1', $1, $2), ('projects', 'prj_1', $1, $3)`, [
    OWNER,
    rec('team', 'tm_1', OWNER, { email: 'member@example.com', role: 'translator' }),
    rec('projects', 'prj_1', OWNER),
  ]);
  const seen = await as(db, MEMBER, `select id from records where store = 'projects'`);
  assert.equal(seen.rows.length, 0);
});

test('records cannot be moved to another workspace', async () => {
  const db = await setup();
  await as(db, OWNER, `insert into records (store, id, owner_id, data) values ('team', 'tm_1', $1, $2), ('projects', 'prj_1', $1, $3)`, [
    OWNER,
    rec('team', 'tm_1', OWNER, { email: 'member@example.com', role: 'translator' }),
    rec('projects', 'prj_1', OWNER),
  ]);
  await assert.rejects(
    as(db, MEMBER, `update records set owner_id = $1, data = $2 where store = 'projects' and id = 'prj_1'`, [MEMBER, rec('projects', 'prj_1', MEMBER)]),
    /cannot move/,
  );
});

test('the browser cannot change its own plan', async () => {
  const db = await setup();
  const profile = (plan) => JSON.stringify({ id: OWNER, name: 'O', email: 'owner@example.com', plan });
  await as(db, OWNER, `insert into records (store, id, owner_id, data) values ('users', $1::text, $1::uuid, $2)`, [OWNER, profile('studio')]);
  let row = await as(db, OWNER, `select data ->> 'plan' as plan from records where store = 'users'`);
  assert.equal(row.rows[0].plan, 'free');
  await as(db, OWNER, `update records set data = $2 where store = 'users' and id = $1::text`, [OWNER, profile('studio')]);
  row = await as(db, OWNER, `select data ->> 'plan' as plan from records where store = 'users'`);
  assert.equal(row.rows[0].plan, 'free');
});

test('page images follow workspace access', async () => {
  const db = await setup();
  await as(db, OWNER, `insert into storage.objects (bucket_id, name) values ('pages', '${OWNER}/blb_1')`);
  await assert.rejects(as(db, STRANGER, `insert into storage.objects (bucket_id, name) values ('pages', '${OWNER}/blb_2')`), /row-level security/);
  const strangerSees = await as(db, STRANGER, `select name from storage.objects`);
  assert.equal(strangerSees.rows.length, 0);
  const ownerSees = await as(db, OWNER, `select name from storage.objects`);
  assert.equal(ownerSees.rows.length, 1);
});

test('rate limits persist and are server-only', async () => {
  const db = await setup();
  await db.exec(`set role service_role`);
  const take = () => db.query(`select * from take_rate_token('contact:1.2.3.4', 2, 60000)`).then((r) => r.rows[0]);
  assert.equal((await take()).ok, true);
  assert.equal((await take()).ok, true);
  const third = await take();
  assert.equal(third.ok, false);
  assert.ok(third.retry_after_ms > 0 && third.retry_after_ms <= 60000);
  await db.exec(`reset role`);
  await assert.rejects(as(db, STRANGER, `select * from take_rate_token('translate:${OWNER}', 1, 1000)`), /permission denied/);
});

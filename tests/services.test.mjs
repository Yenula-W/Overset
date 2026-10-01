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
  for (const file of ['0001_overset.sql', '0002_private_helpers.sql', '0003_services.sql', '0004_record_identity.sql']) {
    await db.exec(readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
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


async function service(db, sql, params = []) {
 await db.exec(`select set_config('request.jwt.claim.role', 'service_role', false)`);
 try { return await db.query(sql,params); }
 finally { await db.exec(`select set_config('request.jwt.claim.role', '', false)`); }
}
async function profile(db, plan = 'free') {
 await service(db, `insert into records(store,id,owner_id,data) values('users',$1::text,$1::uuid,$2)`, [OWNER,JSON.stringify({id:OWNER,plan})]);
}
async function reserve(db,page,task=page) {
 return (await service(db, `select reserve_page($1,$2::uuid,$3,'ocr','hash',$4,1) as result`,[task,OWNER,page,`lease-${task}`])).rows[0].result;
}
test('server quota reservations are idempotent and cannot exceed allowance',async()=>{
 const db=await setup();await profile(db);
 assert.equal((await reserve(db,'page-1')).started,true);
 assert.equal((await reserve(db,'page-1')).busy,true);
 assert.equal((await reserve(db,'page-2')).limit,true);
 const usage=await db.query(`select data->>'pagesProcessed' as count from records where store='usage'`);
 assert.equal(usage.rows[0].count,'1');
 await assert.rejects(as(db,OWNER,`update records set data=jsonb_set(data,'{pagesProcessed}','0') where store='usage'`),/server/);
 await assert.rejects(as(db,OWNER,`delete from records where store='usage'`),/server/);
 await assert.rejects(as(db,OWNER,`select reserve_page('x',$1::uuid,'p','ocr','h','t',999)`,[OWNER]),/permission/);
 await db.close();
});
test('credit fulfillment is atomic and duplicate Stripe deliveries do not add credits twice',async()=>{
 const db=await setup();await profile(db);
 const params=['evt-1',OWNER,1,'cus-1',null,null,null,null,100];
 const sql=`select apply_billing($1,$2::uuid,$3,$4,$5,$6,$7,$8::timestamptz,$9) as applied`;
 assert.equal((await service(db,sql,params)).rows[0].applied,true);
 assert.equal((await service(db,sql,params)).rows[0].applied,false);
 await reserve(db,'page-1');await reserve(db,'page-2');
 assert.equal((await db.query('select credits from workspace_billing')).rows[0].credits,99);
 await assert.rejects(as(db,OWNER,`select apply_billing('fake',$1::uuid,2,'cus-1',null,'pro',null,null,999)`,[OWNER]),/permission/);
 await db.close();
});
test('human edits made during an AI request survive completion',async()=>{
 const db=await setup();await profile(db);await reserve(db,'p','task');
 const original=[{id:'r',sourceText:'source',status:'untranslated'}];
 await as(db,OWNER,`insert into records(store,id,owner_id,data) values('pages','p',$1,$2)`,[OWNER,rec('pages','p',OWNER,{chapterId:'chapter',regions:original})]);
 const human=[{id:'r',sourceText:'source',finalTranslation:'Human version',status:'approved'}];
 await as(db,OWNER,`update records set data=jsonb_set(data,'{regions}',$1::jsonb) where store='pages' and id='p'`,[JSON.stringify(human)]);
 const result=await service(db,`select finish_page('task','lease-task','p',$1::jsonb,$2::jsonb,'{}','model',10,20) as saved`,[JSON.stringify(original),JSON.stringify([{id:'r',finalTranslation:'AI draft'}])]);
 assert.equal(result.rows[0].saved,false);
 assert.deepEqual((await db.query(`select data->'regions' as regions from records where store='pages' and id='p'`)).rows[0].regions,human);
 await db.close();
});
test('free accounts cannot bypass seat limits by inserting an invitation directly',async()=>{
 const db=await setup();await profile(db);
 await assert.rejects(as(db,OWNER,`insert into records(store,id,owner_id,data) values('team','t',$1,$2)`,[OWNER,rec('team','t',OWNER,{email:'member@example.com',role:'translator'})]),/seats/);
 await service(db,`update records set data=jsonb_set(data,'{plan}','"team"') where store='users' and id=$1`,[OWNER]);
 for(let i=0;i<4;i++) await as(db,OWNER,`insert into records(store,id,owner_id,data) values('team',$1,$2,$3)`,[`t${i}`,OWNER,rec('team',`t${i}`,OWNER,{email:`member${i}@example.com`,role:'viewer'})]);
 await assert.rejects(as(db,OWNER,`insert into records(store,id,owner_id,data) values('team','extra',$1,$2)`,[OWNER,rec('team','extra',OWNER,{email:'extra@example.com',role:'translator'})]),/seats/);
 await db.close();
});
test('billing events with stale timestamps cannot downgrade newer entitlements',async()=>{
 const db=await setup();await profile(db);
 const sql=`select apply_billing($1,$2::uuid,$3,'cus-1','sub-1',$4,'cycle-123','2027-01-01'::timestamptz,0)`;
 await service(db,sql,['new',OWNER,20,'team']);await service(db,sql,['old',OWNER,10,'free']);
 assert.equal((await db.query(`select data->>'plan' as plan from records where store='users'`)).rows[0].plan,'team');
 await db.close();
});

 test('record collections cannot be changed to bypass team seat limits', async()=>{
 const db=await setup(); await profile(db);
 await as(db,OWNER,`insert into records(store,id,owner_id,data) values('projects','project-1',$1::uuid,$2)`,[OWNER,rec('projects','project-1',OWNER,{name:'Private project'})]);
 await assert.rejects(as(db,OWNER,`update records set store='team',data=$1 where store='projects' and id='project-1'`,[rec('team','project-1',OWNER,{email:'member@example.com',role:'translator'})]),/identity cannot be changed/);
 await db.close();
 });

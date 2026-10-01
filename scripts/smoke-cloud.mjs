// Creates disposable, confirmed test accounts; sends no email and cleans up afterward.
// Does not verify confirmation-email delivery. Requires server Supabase credentials.
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!publicKey||!secret)throw new Error('Provide the three Supabase environment variables.');
const site=process.env.OVERSET_SITE_URL||'https://panelflow-pi.vercel.app';
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}}),users=[];
async function account(){
 const password=randomUUID()+randomUUID();
 const {data,error}=await admin.auth.admin.createUser({email:`overset-smoke-${randomUUID()}@example.test`,password,email_confirm:true});
 if(error)throw new Error('Test account creation failed.'); users.push(data.user.id);
 const jar=new Map();
 const db=createServerClient(url,publicKey,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(i=>jar.set(i.name,i.value))}});
 const sign=await db.auth.signInWithPassword({email:data.user.email,password});assert.equal(sign.error,null,'Cloud sign-in failed');
 return {id:data.user.id,db,cookies:()=>[...jar].map(([n,v])=>`${n}=${v}`).join('; ')};
}
try{
 const owner=await account(),stranger=await account();
 const projectId=`smoke_${randomUUID()}`;
 const profile={id:owner.id,ownerId:owner.id,name:'Disposable smoke test',email:'test@example.test',plan:'free'};
 const profileInsert=await owner.db.from('records').insert({store:'users',id:owner.id,owner_id:owner.id,data:profile});assert.equal(profileInsert.error,null,'Profile insert failed');
 const projectInsert=await owner.db.from('records').insert({store:'projects',id:projectId,owner_id:owner.id,data:{id:projectId,ownerId:owner.id,name:'Disposable smoke project'}});assert.equal(projectInsert.error,null,'Project insert failed');
 const hidden=await stranger.db.from('records').select('id').eq('store','projects').eq('id',projectId);assert.equal(hidden.error,null);assert.equal(hidden.data.length,0,'Stranger could read private project');
 const forged=await owner.db.from('records').update({data:{...profile,plan:'publisher'}}).eq('store','users').eq('id',owner.id);assert.equal(forged.error,null); const protectedPlan=await owner.db.from('records').select('data').eq('store','users').eq('id',owner.id).single(); assert.equal(protectedPlan.data.data.plan,'free','Browser could change its own plan');
 const usage=await owner.db.from('records').insert({store:'usage',id:`${owner.id}:test`,owner_id:owner.id,data:{id:`${owner.id}:test`,ownerId:owner.id,pagesProcessed:0}});assert.ok(usage.error,'Browser could forge usage');
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64');
 const path=`${owner.id}/smoke/${randomUUID()}.png`;
 const uploaded=await owner.db.storage.from('pages').upload(path,image,{contentType:'image/png'});assert.equal(uploaded.error,null,'Private storage upload failed');
 const own=await owner.db.storage.from('pages').download(path);assert.equal(own.error,null,'Owner could not load its upload');
 const denied=await stranger.db.storage.from('pages').download(path);assert.ok(denied.error,'Stranger could download private page');
 const response=await fetch(`${site}/api/usage`,{headers:{cookie:owner.cookies()}});assert.equal(response.status,200,'Deployed server did not accept verified auth cookies');
 const counters=await response.json();assert.equal(counters.pagesProcessed,0);assert.ok(Number.isFinite(counters.remaining),'Server usage missing');
 const services=await fetch(`${site}/api/services`,{headers:{cookie:owner.cookies()}});assert.equal(services.status,200);assert.equal((await services.json()).ai,false,'Unexpected live AI configuration: do not consume credits in this smoke test');
 const removed=await admin.storage.from('pages').remove([path]);assert.equal(removed.error,null);
 console.log('PASS: live sign-in, private records, storage isolation, plan protection, usage protection and deployed authenticated APIs. No emails sent or AI calls made.');
}finally{
 for(const id of users){const {error}=await admin.auth.admin.deleteUser(id);if(error)console.error('Could not remove a disposable test account; clean it up in Supabase.');}
}

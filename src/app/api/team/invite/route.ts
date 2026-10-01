import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authenticated,record,adminClient } from '@/lib/server/records';
import { sameOrigin,ServiceError,failure,siteUrl } from '@/lib/server/http';
import { queueEmail } from '@/lib/server/email';
import { rateLimit } from '@/lib/server/authz';
import type { UserRecord } from '@/lib/store/schema';
const schema=z.object({name:z.string().trim().max(200),email:z.string().trim().email().max(320),role:z.enum(['translator','proofreader','typesetter','viewer'])});
export async function POST(request:Request){try{
 sameOrigin(request);const {user,db}=await authenticated();
 const input=schema.safeParse(await request.json().catch(()=>null));if(!input.success)throw new ServiceError('invalid','Enter a valid teammate email and role.',400);
 if(!(await rateLimit(`invite:${user.id}`,10,60_000)).ok)throw new ServiceError('rate_limited','Too many invitations. Wait a minute.',429);
 const profile=await record<UserRecord>(db,'users',user.id);
 const member={id:`tm_${randomUUID()}`,ownerId:user.id,name:input.data.name||input.data.email.split('@')[0],email:input.data.email.toLowerCase(),role:input.data.role,avatarColor:'#6C63E8',lastActive:new Date().toISOString(),status:'invited'};
 // Use the caller's client: the database enforces owner access, duplicates and seats atomically.
 const saved=await db.from('records').insert({store:'team',id:member.id,owner_id:user.id,data:member});
 if(saved.error)throw new ServiceError('invite_failed',/seats/.test(saved.error.message)?'Your plan has no available team seats. Upgrade or remove a member first.':/already/.test(saved.error.message)?'That person is already on your team.':'The invitation could not be saved.',409);
 const mail={to:member.email,subject:`${profile.name} invited you to Overset`,text:`${profile.name} invited you to their localization workspace as a ${member.role}. Sign up or log in with ${member.email} and confirm your email to join.\n\n${siteUrl()}/signup`};
 let delivery={delivered:false};
 try{delivery=await queueEmail(mail,user.id,`invite-${member.id}`);}catch{
  // The saved invite remains valid; an owner can resend after email is connected.
  await adminClient().from('email_outbox').upsert({id:`invite-${member.id}`,owner_id:user.id,payload:mail},{ignoreDuplicates:true});
 }
 return NextResponse.json({member,...delivery});
}catch(error){return failure(error);}}

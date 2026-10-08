import { NextResponse } from 'next/server';
import { planById } from '@/lib/billing';
import { authenticated,record,adminClient } from '@/lib/server/records';
import { failure,ServiceError } from '@/lib/server/http';
import type { UserRecord,UsageRecord } from '@/lib/store/schema';
export async function GET(request:Request){try{
 const {user,db}=await authenticated();const owner=new URL(request.url).searchParams.get('workspace')||user.id;
 const profile=await record<UserRecord>(db,'users',owner);const admin=adminClient();
 const {data:billing,error}=await admin.from('workspace_billing').select('*').eq('owner_id',owner).maybeSingle();
 if(error)throw new ServiceError('usage_unavailable','Usage is temporarily unavailable.');
 const now=new Date();const month=`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}`;
 const period=profile.plan !== 'free' && billing?.period&&new Date(billing.resets_at)>now?billing.period:month;
 const {data:stored,error:readError}=await db.from('records').select('data').eq('store','usage').eq('id',`${owner}:${period}`).maybeSingle();
 if(readError)throw new ServiceError('usage_unavailable','Usage is temporarily unavailable.');
 const usage=(stored?.data as UsageRecord|undefined)??{id:`${owner}:${period}`,ownerId:owner,period,pagesProcessed:0,pagesExported:0};
 const plan=planById(profile.plan);
 if(plan.id==='free'){
  const startsAt=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString();
  const resetsAt=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1)).toISOString();
  const charged=await admin.from('page_charges').select('page_id',{count:'exact',head:true}).eq('owner_id',owner).eq('credit',false).gte('created_at',startsAt).lt('created_at',resetsAt);
  if(charged.error)throw new ServiceError('usage_unavailable','Monthly usage is temporarily unavailable.');
  const used=charged.count??0;
  const credits=billing?.credits??0;
  return NextResponse.json({...usage,plan:'free',period:month,pagesProcessed:used,pagesUsed:used,pagesIncluded:plan.pageAllowance,additionalCredits:credits,remaining:Math.max(0,plan.pageAllowance-used)+credits,resetsAt,hasSubscription:false});
 }
 const charged=await admin.from('page_charges').select('page_id',{count:'exact',head:true}).eq('owner_id',owner).eq('period',period).eq('credit',true);
 const credits=billing?.credits??0;const spent=charged.count??0;
 return NextResponse.json({...usage,plan:plan.id,pagesUsed:usage.pagesProcessed,pagesIncluded:plan.pageAllowance,additionalCredits:credits,creditsUsed:spent,remaining:Math.max(0,plan.pageAllowance-usage.pagesProcessed)+credits,resetsAt:period===month?new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1)).toISOString():billing.resets_at,hasSubscription:Boolean(billing?.subscription_id)});
}catch(error){return failure(error);}}

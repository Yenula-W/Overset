import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stripeClient,priceFor } from '@/lib/server/stripe';
import { authenticated,adminClient } from '@/lib/server/records';
import { failure,ServiceError,sameOrigin,siteUrl } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/authz';
import { CREDIT_PACKS } from '@/lib/billing';
const schema=z.object({item:z.enum(['creator','pro','team','publisher','pages-50']),interval:z.enum(['monthly','yearly']).default('monthly')});
export async function POST(request:Request) {
 try {
  sameOrigin(request);const {user}=await authenticated();const admin=adminClient();
  if(!(await rateLimit(`checkout:${user.id}`,5,60_000)).ok)throw new ServiceError('rate_limited','Wait a minute before opening another checkout.',429);
  const body=schema.safeParse(await request.json().catch(()=>null));if(!body.success)throw new ServiceError('invalid','Choose a plan or credit pack.',400);
  const {item,interval}=body.data;const stripe=stripeClient();const price=priceFor(item,interval);
  const {data:billing,error}=await admin.from('workspace_billing').select('*').eq('owner_id',user.id).maybeSingle();
  if(error)throw new ServiceError('billing_storage','Billing is temporarily unavailable.');
  const pack=CREDIT_PACKS.find(p=>p.id===item);
  if(!pack&&billing?.subscription_id) {
   const sub=await stripe.subscriptions.retrieve(billing.subscription_id);
   if(['active','trialing','past_due','unpaid','incomplete'].includes(sub.status))throw new ServiceError('existing_subscription','You already have a subscription. Use Manage billing to change your plan.',409);
  }
  let customer=billing?.customer_id;
  if(!customer) {
   const created=await stripe.customers.create({email:user.email,metadata:{ownerId:user.id}},{idempotencyKey:`overset-customer-${user.id}`});customer=created.id;
   const saved=await admin.from('workspace_billing').upsert({owner_id:user.id,customer_id:customer},{onConflict:'owner_id'});
   if(saved.error)throw new ServiceError('billing_storage','Your billing account could not be saved.');
  }
  const metadata={ownerId:user.id,item,price};
  // One open subscription checkout per customer avoids duplicate subscriptions.
  if(!pack){const open=await stripe.checkout.sessions.list({customer,status:'open',limit:100});const existing=open.data.find(s=>s.mode==='subscription');if(existing?.url)return NextResponse.json({url:existing.url});}
  const session=await stripe.checkout.sessions.create({customer,mode:pack?'payment':'subscription',line_items:[{price,quantity:1}],metadata,client_reference_id:user.id,...(!pack?{subscription_data:{metadata:{ownerId:user.id}}}:{}),success_url:`${siteUrl()}/usage?payment=success`,cancel_url:`${siteUrl()}/usage?payment=cancelled`});
  return NextResponse.json({url:session.url});
 }catch(error){return failure(error);}
}

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripeClient,planForPrice,priceFor } from '@/lib/server/stripe';
import { adminClient } from '@/lib/server/records';
import { failure,ServiceError } from '@/lib/server/http';
import { CREDIT_PACKS } from '@/lib/billing';
const idOf=(v:string|{id:string}|null)=>typeof v==='string'?v:v?.id??null;
export async function POST(request:Request){
 try {
  const stripe=stripeClient();const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret)throw new ServiceError('webhook_not_configured','Billing webhook is not configured.');
  const signature=request.headers.get('stripe-signature');if(!signature)throw new ServiceError('invalid_signature','Missing Stripe signature.',400);
  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret);}catch{throw new ServiceError('invalid_signature','Invalid Stripe signature.',400);}
  const admin=adminClient();
  let customer:string|null=null, subscription:string|null=null,credits=0,owner:string|null=null;
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   const session=event.data.object as Stripe.Checkout.Session;
   customer=idOf(session.customer);subscription=idOf(session.subscription);owner=session.metadata?.ownerId??null;
   if(session.mode==='payment'){
    if(session.payment_status!=='paid')return NextResponse.json({received:true});
    const pack=CREDIT_PACKS.find(p=>p.id===session.metadata?.item);
    const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:10});
    if(!pack||lines.data.length!==1||lines.data[0].quantity!==1||lines.data[0].price?.id!==priceFor(pack.id))throw new ServiceError('invalid_purchase','Unrecognized credit purchase.',400);
    credits=pack.pages;
    // Fulfillment deduplicates by session, including async-payment events.
    event={...event,id:`credits:${session.id}`};
   }
  } else if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
   const sub=event.data.object as Stripe.Subscription;customer=idOf(sub.customer);subscription=sub.id;owner=sub.metadata.ownerId??null;
  } else return NextResponse.json({received:true});
  if(!customer)throw new ServiceError('missing_customer','Billing event has no customer.',400);
  const {data:account,error}=await admin.from('workspace_billing').select('owner_id,customer_id,subscription_id').eq('customer_id',customer).maybeSingle();
  if(error||!account||owner&&owner!==account.owner_id)throw new ServiceError('unknown_customer','The billing customer does not match an Overset workspace.',400);
  owner=account.owner_id;
  let plan:string|null=null,period:string|null=null,resets:string|null=null;
  if(subscription){
   // Retrieve current state, instead of trusting potentially out-of-order event snapshots.
   const current=await stripe.subscriptions.retrieve(subscription);
   if(idOf(current.customer)!==customer)throw new ServiceError('customer_mismatch','The subscription customer is invalid.',400);
   if(account.subscription_id&&account.subscription_id!==subscription){const old=await stripe.subscriptions.retrieve(account.subscription_id);if(['active','trialing','past_due','unpaid'].includes(old.status))throw new ServiceError('duplicate_subscription','Another active subscription already exists.',409);}
   const item=current.items.data[0];const mapped=planForPrice(item?.price.id??'');
   if(current.items.data.length!==1||!mapped)throw new ServiceError('unknown_price','This subscription uses an unconfigured price.',400);
   plan=['active','trialing'].includes(current.status)?mapped.id:'free';
   if(plan!=='free'){
    const start=item.current_period_start,end=item.current_period_end;
    period=`cycle-${start}`;resets=new Date(end*1000).toISOString();
   }
  }
  const saved=await admin.rpc('apply_billing',{event_id:event.id,workspace:owner,event_time:event.created,customer,subscription,plan_id:plan,period_key:period,reset_date:resets,credit_pages:credits});
  if(saved.error)throw new ServiceError('billing_storage','Billing changes could not be saved. Stripe should retry this event.');
  return NextResponse.json({received:true});
 }catch(error){return failure(error);}
}

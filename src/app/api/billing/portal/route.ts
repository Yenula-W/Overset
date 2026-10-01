import { NextResponse } from 'next/server';
import { stripeClient } from '@/lib/server/stripe';
import { authenticated,adminClient } from '@/lib/server/records';
import { failure,sameOrigin,siteUrl,ServiceError } from '@/lib/server/http';
export async function POST(request:Request){try{
 sameOrigin(request);const {user}=await authenticated();const stripe=stripeClient();
 const {data,error}=await adminClient().from('workspace_billing').select('customer_id').eq('owner_id',user.id).maybeSingle();
 if(error||!data?.customer_id)throw new ServiceError('no_billing_account','Choose a paid plan before opening billing management.',409);
 const portal=await stripe.billingPortal.sessions.create({customer:data.customer_id,return_url:`${siteUrl()}/usage`});
 return NextResponse.json({url:portal.url});
}catch(error){return failure(error);}}

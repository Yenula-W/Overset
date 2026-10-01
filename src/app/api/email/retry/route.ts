import { NextResponse } from 'next/server';
import { authenticated,adminClient } from '@/lib/server/records';
import { failure,sameOrigin } from '@/lib/server/http';
import { deliverQueued,emailConfigured } from '@/lib/server/email';
async function retry(owner?:string){
 if(!emailConfigured())return NextResponse.json({delivered:0,pending:true});
 let query=adminClient().from('email_outbox').select('id').eq('state','pending').lt('attempts',20).order('created_at').limit(25);if(owner)query=query.eq('owner_id',owner);
 const {data,error}=await query;if(error)throw error;
 let delivered=0;for(const row of data??[])if((await deliverQueued(row.id)).delivered)delivered++;
 return NextResponse.json({delivered});
}
export async function POST(request:Request){try{sameOrigin(request);const {user}=await authenticated();return await retry(user.id);}catch(error){return failure(error);}}
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:{message:'Unauthorized'}},{status:401});try{return await retry();}catch(error){return failure(error);}}

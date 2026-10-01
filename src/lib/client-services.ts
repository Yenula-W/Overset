'use client';
import { notify } from '@/lib/store/db';
import type { PageRecord } from '@/lib/store/schema';
export async function callService<T>(path:string,body?:unknown):Promise<T>{
 const response=await fetch(path,{method:body===undefined?'GET':'POST',headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error?.message??'This action could not finish. Try again.');
 return data as T;
}
export async function aiPage(chapterId:string,pageId:string,action:'ocr'|'translate'|'regenerate'|'proofread',regionId?:string){
 const result=await callService<{page:PageRecord;qa?:Array<{regionId:string;message:string}>;skipped?:boolean}>(`/api/chapters/${encodeURIComponent(chapterId)}/translate`,{pageId,action,regionId,...(action==='regenerate'?{requestId:crypto.randomUUID()}:{})});
 notify('pages');notify('usage');notify('versions');return result;
}
export async function billingAction(item?:string,interval:'monthly'|'yearly'='monthly'){
 const result=await callService<{url:string}>(item?'/api/billing/checkout':'/api/billing/portal',item?{item,interval}:{});
 const url=new URL(result.url);
 if(url.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname))throw new Error('The billing link is invalid.');
 window.location.assign(url.href);
}

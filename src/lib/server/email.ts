import 'server-only';
import { randomUUID } from 'node:crypto';
import { adminClient } from './records';
import { ServiceError, siteUrl } from './http';
export interface EmailMessage { to: string; subject: string; text: string; replyTo?: string }
export function emailConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.OVERSET_EMAIL_FROM); }
export async function sendEmail(message: EmailMessage, id: string) {
  if (!emailConfigured()) throw new ServiceError('email_not_configured', 'Email delivery is not connected yet.');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': id }, signal: AbortSignal.timeout(15_000), body: JSON.stringify({from:process.env.OVERSET_EMAIL_FROM,to:[message.to],subject:message.subject,text:message.text,...(message.replyTo?{reply_to:message.replyTo}:{})}) });
  if (!response.ok) throw new ServiceError('email_delivery', 'The email could not be delivered yet. It is saved for retry.');
}
export async function queueEmail(message: EmailMessage, ownerId?: string, id = `mail_${randomUUID()}`) {
  const db = adminClient();
  const { error } = await db.from('email_outbox').upsert({id,owner_id:ownerId??null,payload:message},{onConflict:'id',ignoreDuplicates:true});
  if (error) throw new ServiceError('email_storage', 'The message could not be saved. Try again.');
  return deliverQueued(id);
}
export async function deliverQueued(id: string) {
  const db = adminClient();
  const {data,error} = await db.from('email_outbox').select('*').eq('id',id).single();
  if (error||!data) throw new ServiceError('email_storage','The message could not be loaded.');
  if (data.state === 'delivered') return {delivered:true};
  if (!emailConfigured()) return {delivered:false};
  try {
    await sendEmail(data.payload as EmailMessage,id);
    await db.from('email_outbox').update({state:'delivered',delivered_at:new Date().toISOString(),attempts:data.attempts+1}).eq('id',id);
    return {delivered:true};
  } catch {
    await db.from('email_outbox').update({attempts:data.attempts+1}).eq('id',id);
    return {delivered:false};
  }
}
export function chapterMessage(to:string,name:string,chapterId:string):EmailMessage {
  return {to,subject:`${name} is ready for review`,text:`Your chapter is ready for review in Overset. AI drafts still need your approval.\n\n${siteUrl()}/translate/editor?chapter=${encodeURIComponent(chapterId)}`};
}

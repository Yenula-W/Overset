import { NextResponse } from 'next/server';
import { authenticated } from '@/lib/server/records';
import { aiConfigured } from '@/lib/providers/comic';
import { emailConfigured } from '@/lib/server/email';
import { failure } from '@/lib/server/http';
export async function GET() {
  try { await authenticated();return NextResponse.json({ai:aiConfigured(),email:emailConfigured(),billing:Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET)}); }
  catch(error){return failure(error);}
}

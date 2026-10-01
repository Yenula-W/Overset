import { NextResponse } from 'next/server';
import { processPage, processSchema } from '@/lib/server/translate';
import { failure, sameOrigin, ServiceError } from '@/lib/server/http';
export const runtime = 'nodejs';
export const maxDuration = 300;
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    sameOrigin(request);
    const input=processSchema.safeParse(await request.json().catch(()=>null));
    if (!input.success) throw new ServiceError('invalid','Choose a page and processing action.',400);
    const {id}=await params;
    return NextResponse.json(await processPage(id,input.data));
  } catch(error) { return failure(error); }
}

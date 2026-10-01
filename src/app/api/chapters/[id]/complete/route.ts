import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { authenticated,editable,record,records } from '@/lib/server/records';
import { failure,sameOrigin,ServiceError } from '@/lib/server/http';
import { queueEmail,chapterMessage } from '@/lib/server/email';
import type { ChapterRecord,PageRecord,UserRecord } from '@/lib/store/schema';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 sameOrigin(request);const {user,db}=await authenticated();const {id}=await params;const chapter=await record<ChapterRecord>(db,'chapters',id);await editable(db,chapter.ownerId,user);
 const pages=await records<PageRecord>(db,'pages',chapter.ownerId,'chapterId',id);
 if(!pages.length||pages.some(p=>!p.regions.length||p.regions.some(r=>r.translate&&!r.finalTranslation.trim())))throw new ServiceError('unfinished','Finish or exclude untranslated regions before marking this chapter ready.',422);
 const updated={...chapter,status:'review',updatedAt:new Date().toISOString()};
 const {error}=await db.from('records').update({data:updated}).eq('store','chapters').eq('id',id);if(error)throw new ServiceError('save_failed','The chapter status could not be saved.');
 const owner=await record<UserRecord>(db,'users',chapter.ownerId);
 const fingerprint=createHash('sha256').update(JSON.stringify(pages.map(p=>p.regions.map(r=>r.finalTranslation)))).digest('hex');
 if(owner.preferences.emailOnProcessed)await queueEmail(chapterMessage(owner.email,chapter.name,id),owner.id,`ready-${id}-${fingerprint}`).catch(()=>{});
 return NextResponse.json({ok:true});
}catch(error){return failure(error);}}

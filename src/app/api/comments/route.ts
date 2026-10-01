import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authenticated,editable,record } from '@/lib/server/records';
import { sameOrigin,ServiceError,failure,siteUrl } from '@/lib/server/http';
import { queueEmail } from '@/lib/server/email';
import { rateLimit } from '@/lib/server/authz';
import type { PageRecord,ChapterRecord,UserRecord,CommentRecord } from '@/lib/store/schema';
const schema=z.object({chapterId:z.string().max(160),pageId:z.string().max(160),regionId:z.string().max(160),parentId:z.string().max(160).optional(),body:z.string().trim().min(1).max(5000)});
export async function POST(request:Request){try{
 sameOrigin(request);const {user,db}=await authenticated();const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)throw new ServiceError('invalid','Enter a comment of up to 5,000 characters.',400);
 if(!(await rateLimit(`comment:${user.id}`,30,60_000)).ok)throw new ServiceError('rate_limited','Too many comments. Wait a minute.',429);
 const input=parsed.data;const chapter=await record<ChapterRecord>(db,'chapters',input.chapterId);const page=await record<PageRecord>(db,'pages',input.pageId);
 if(page.chapterId!==chapter.id||page.ownerId!==chapter.ownerId||!page.regions.some(r=>r.id===input.regionId))throw new ServiceError('not_found','That dialogue region does not exist.',404);
 await editable(db,page.ownerId,user);
 if(input.parentId){const parent=await record<CommentRecord>(db,'comments',input.parentId);if(parent.pageId!==page.id||parent.regionId!==input.regionId)throw new ServiceError('invalid','Reply to a comment in this region.',400);}
 const author=await record<UserRecord>(db,'users',user.id);const owner=await record<UserRecord>(db,'users',page.ownerId);
 const comment={...input,id:`cmt_${randomUUID()}`,ownerId:page.ownerId,authorName:author.name,createdAt:new Date().toISOString(),resolved:false};
 const {error}=await db.from('records').insert({store:'comments',id:comment.id,owner_id:comment.ownerId,data:comment});if(error)throw new ServiceError('save_failed','The comment could not be saved.');
 if(owner.preferences.emailOnComment&&owner.id!==user.id)await queueEmail({to:owner.email,subject:`New comment on ${chapter.name}`,text:`${author.name}: ${comment.body}\n\n${siteUrl()}/translate/editor?chapter=${encodeURIComponent(chapter.id)}`},owner.id,`comment-${comment.id}`).catch(()=>{});
 return NextResponse.json(comment);
}catch(error){return failure(error);}}

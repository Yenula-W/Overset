import type { TranslationContext, TranslationOutput } from './types';
import type { ChapterRecord, ProjectRecord, PageRecord, CharacterRecord, GlossaryRecord, MemoryRecord } from '../store/schema';
import type { DialogueRegion } from '../types/domain';

export function buildTranslationContext(input: {
  chapter: ChapterRecord; project: ProjectRecord; page: PageRecord; current: DialogueRegion;
  pages: PageRecord[]; characters: CharacterRecord[]; glossary: GlossaryRecord[]; memory: MemoryRecord[];
  improve?: boolean;
}): TranslationContext {
  const {chapter,project,page,current,characters,glossary,memory}=input;
  const dialogue=input.pages.slice().sort((a,b)=>a.order-b.order).flatMap(p=>p.regions.slice().sort((a,b)=>a.readingOrder-b.readingOrder).map(r=>({r,pageOrder:p.order})));
  const spoken=dialogue.filter(({r})=>!['sfx','background','label'].includes(r.type));
  const index=spoken.findIndex(({r})=>r.id===current.id);
  const neighborhood=index<0?dialogue.filter(d=>d.pageOrder===page.order):spoken.slice(Math.max(0,index-8),index+9);
  const prefs=chapter.preferences,speaker=characters.find(c=>c.id===current.speakerId);
  return {
    sourceLanguage:chapter.sourceLanguage,targetLanguage:chapter.targetLanguage,currentText:current.sourceText.slice(0,6000),regionType:current.type,
    currentRegionId:current.id,currentDraft:input.improve?current.finalTranslation:undefined,
    translatorNote:current.translatorNote?.slice(0,2000),
    speaker:prefs.useCharacterProfiles&&speaker?{name:speaker.name,role:speaker.role,voice:speaker.voice,personality:speaker.personality,formality:speaker.formality,slang:speaker.slang,speechRules:speaker.speechRules,relationships:speaker.relationships.map(r=>({name:characters.find(c=>c.id===r.characterId)?.name??r.characterId,relation:r.relation}))}:undefined,
    surroundingDialogue:neighborhood.filter(({r})=>r.id!==current.id).map(({r,pageOrder})=>({regionId:r.id,pageOrder,readingOrder:r.readingOrder,speaker:characters.find(c=>c.id===r.speakerId)?.name,source:r.sourceText.slice(0,2000),translation:r.status==='approved'?r.finalTranslation.slice(0,2000):undefined})),
    chapterSummary:`${project.name}: ${project.description.slice(0,2000)}. ${chapter.name}. Source dialogue in page/reading order:\n${dialogue.map(({r,pageOrder})=>`[page ${pageOrder}, region ${r.readingOrder}, ${r.type}] ${r.sourceText}`).join('\n').slice(0,20000)}`,
    sceneSummary:'The attached original image shows the current scene. The target region is identified by currentRegionId and visualRegion bounds. Distinguish thoughts, spoken dialogue, interruptions and sound effects. Speaker identity is uncertain unless supplied.',
    glossary:glossary.filter(g=>g.status==='locked'||current.sourceText.includes(g.original)).slice(0,200).map(g=>({original:g.original,translation:g.translation,locked:g.status==='locked',type:g.type})),
    memory:prefs.useTranslationMemory?memory.filter(m=>m.sourceText===current.sourceText||current.sourceText.includes(m.sourceText)||m.sourceText.includes(current.sourceText)).slice(0,12).map(m=>({source:m.sourceText,translation:m.translation,context:`${m.chapterName}: ${m.context??''}`})):[],
    style:prefs.style,preserveHonorifics:prefs.preserveHonorifics,customRules:project.preferences.customRules,
    bubbleHint:{widthPx:current.bounds.width*page.width/100,heightPx:current.bounds.height*page.height/100,estimatedCharsPerLine:25},
  };
}

/** A second opinion is a proposal; never replace human work on generation. */
export function proposeRevision(region: DialogueRegion, draft: TranslationOutput): DialogueRegion {
  return {...region,revisionSuggestion:{translation:draft.recommended,literal:draft.literal,confidence:draft.confidence,note:[draft.ambiguityNote,draft.culturalNote].filter(Boolean).join(' · ')||undefined}};
}

import type { ChapterRecord, PageRecord } from '@/lib/store/schema';
import type { ChapterStatus } from '@/lib/types/domain';

export interface ChapterStats {
  pageCount: number;
  regionCount: number;
  translated: number;
  approved: number;
  /** 0–100, by approved regions. */
  progress: number;
}

export function chapterStats(pages: PageRecord[]): ChapterStats {
  const regions = pages.flatMap((p) => p.regions.filter((r) => r.translate));
  const translated = regions.filter((r) => r.finalTranslation.trim()).length;
  const approved = regions.filter((r) => r.status === 'approved').length;
  return {
    pageCount: pages.length,
    regionCount: regions.length,
    translated,
    approved,
    progress: regions.length ? Math.round((approved / regions.length) * 100) : 0,
  };
}

export function groupPagesByChapter(pages: PageRecord[]) {
  const map = new Map<string, PageRecord[]>();
  for (const p of pages) {
    const list = map.get(p.chapterId) ?? [];
    list.push(p);
    map.set(p.chapterId, list);
  }
  return map;
}

/** Status shown to the user, derived from what has actually been done. */
export function effectiveStatus(chapter: ChapterRecord, stats: ChapterStats): ChapterStatus {
  if (chapter.status === 'processing' || chapter.status === 'uploading' || chapter.status === 'failed') return chapter.status;
  if (stats.regionCount > 0 && stats.approved === stats.regionCount) return 'complete';
  return 'review';
}

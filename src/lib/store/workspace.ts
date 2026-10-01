'use client';

import { getAllByIndex } from './db';
import { useLiveQuery, useUser } from './hooks';
import type { ChapterRecord, GlossaryRecord, PageRecord, ProjectRecord } from './schema';
import { listAllChapters, listAllPages, listProjects } from './repo';
import { chapterStats, effectiveStatus, groupPagesByChapter, type ChapterStats } from '@/lib/stats';
import type { ChapterStatus } from '@/lib/types/domain';

export interface ChapterView {
  chapter: ChapterRecord;
  project?: ProjectRecord;
  stats: ChapterStats;
  status: ChapterStatus;
}

export interface WorkspaceView {
  projects: ProjectRecord[];
  chapters: ChapterView[];
  pages: PageRecord[];
  totalsByProject: Map<string, { chapters: number; pages: number; terms: number }>;
}

/** Everything the dashboard and project list need, kept live. */
export function useWorkspace() {
  const user = useUser();
  return useLiveQuery<WorkspaceView>(
    async () => {
      const [projects, chapters, pages, glossary] = await Promise.all([
        listProjects(user.id),
        listAllChapters(user.id),
        listAllPages(user.id),
        getAllByIndex<GlossaryRecord>('glossary', 'ownerId', user.id),
      ]);
      const byChapter = groupPagesByChapter(pages);
      const projectById = new Map(projects.map((p) => [p.id, p]));
      const views: ChapterView[] = chapters.map((chapter) => {
        const stats = chapterStats(byChapter.get(chapter.id) ?? []);
        return { chapter, project: projectById.get(chapter.projectId), stats, status: effectiveStatus(chapter, stats) };
      });
      const totalsByProject = new Map<string, { chapters: number; pages: number; terms: number }>();
      for (const p of projects) totalsByProject.set(p.id, { chapters: 0, pages: 0, terms: 0 });
      for (const v of views) {
        const t = totalsByProject.get(v.chapter.projectId);
        if (t) {
          t.chapters++;
          t.pages += v.stats.pageCount;
        }
      }
      for (const g of glossary) {
        const t = totalsByProject.get(g.projectId);
        if (t) t.terms++;
      }
      return { projects, chapters: views, pages, totalsByProject };
    },
    [user.id],
    ['projects', 'chapters', 'pages', 'glossary'],
  );
}

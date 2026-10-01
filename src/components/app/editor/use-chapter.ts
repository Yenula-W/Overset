'use client';

import * as React from 'react';
import { useLiveQuery, useActiveWorkspace } from '@/lib/store/hooks';
import {
  getChapter,
  getProject,
  listAllChapters,
  listCharacters,
  listComments,
  listGlossary,
  listMemory,
  listPages,
  listVersions,
  savePageRegions,
} from '@/lib/store/repo';
import type { DialogueRegion } from '@/lib/types/domain';

const SAVE_DELAY_MS = 400;

/** Resolves the chapter to open: ?chapter=, else the most recently touched one. */
export function useChapterId() {
  const workspace = useActiveWorkspace();
  const [id, setId] = React.useState<string | null | undefined>(undefined);
  React.useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('chapter');
    if (fromUrl) {
      setId(fromUrl);
      return;
    }
    listAllChapters(workspace.id).then((all) => setId(all[0]?.id ?? null), () => setId(null));
  }, [workspace.id]);
  return id;
}

export function useChapterData(chapterId: string) {
  const workspace = useActiveWorkspace();
  const live = useLiveQuery(
    async () => {
      const chapter = await getChapter(workspace.id, chapterId);
      const [project, pages, glossary, characters, memory, comments, versions] = await Promise.all([
        getProject(workspace.id, chapter.projectId),
        listPages(workspace.id, chapterId),
        listGlossary(workspace.id, chapter.projectId),
        listCharacters(workspace.id, chapter.projectId),
        listMemory(workspace.id, chapter.projectId),
        listComments(workspace.id, chapterId),
        listVersions(workspace.id, chapterId),
      ]);
      return { chapter, project, pages, glossary, characters, memory, comments, versions };
    },
    [workspace.id, chapterId],
    ['chapters', 'projects', 'pages', 'glossary', 'characters', 'memory', 'comments', 'versions'],
  );

  // Local drafts keep typing instant; saves are debounced per page.
  const [drafts, setDrafts] = React.useState<Record<string, DialogueRegion[]>>({});
  const pending = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const latest = React.useRef<Record<string, DialogueRegion[]>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Pages without unsaved edits follow the store (e.g. global replace, other tabs).
  React.useEffect(() => {
    if (!live.data) return;
    setDrafts((prev) => {
      const next: Record<string, DialogueRegion[]> = {};
      for (const p of live.data!.pages) next[p.id] = pending.current.has(p.id) && prev[p.id] ? prev[p.id] : p.regions;
      latest.current = next;
      return next;
    });
  }, [live.data]);

  const flush = React.useCallback(
    async (pageId: string) => {
      const timer = pending.current.get(pageId);
      if (timer) clearTimeout(timer);
      pending.current.delete(pageId);
      const regions = latest.current[pageId];
      if (!regions || !workspace.canEdit) return;
      setSaving(true);
      try {
        await savePageRegions(workspace.id, pageId, regions);
        setSaveError(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Changes couldn’t be saved.');
        throw err;
      } finally {
        setSaving(pending.current.size > 0);
      }
    },
    [workspace.id, workspace.canEdit],
  );

  const updateRegions = React.useCallback(
    (pageId: string, fn: (regions: DialogueRegion[]) => DialogueRegion[]) => {
      if (!workspace.canEdit) return;
      setDrafts((prev) => {
        const next = { ...prev, [pageId]: fn(prev[pageId] ?? []) };
        latest.current = next;
        return next;
      });
      const existing = pending.current.get(pageId);
      if (existing) clearTimeout(existing);
      pending.current.set(pageId, setTimeout(() => void flush(pageId).catch(() => {}), SAVE_DELAY_MS));
      setSaving(true);
    },
    [flush, workspace.canEdit],
  );

  // Never lose an edit: flush on unmount and warn before closing with unsaved work.
  React.useEffect(() => {
    const map = pending.current;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (map.size > 0) {
        for (const id of map.keys()) void flush(id).catch(() => {});
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      for (const id of [...map.keys()]) void flush(id).catch(() => {});
    };
  }, [flush]);

  return { ...live, drafts, updateRegions, flush, saving, saveError };
}

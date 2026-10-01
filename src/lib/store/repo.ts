import { callService } from '@/lib/client-services';
import { cloudEnabled, get, getAllByIndex, newId, notify, put, putMany, remove, removeMany } from './db';
import type {
  BlobRecord,
  ChapterRecord,
  CharacterRecord,
  CommentRecord,
  GlossaryRecord,
  MemoryRecord,
  PageRecord,
  ProjectRecord,
  TeamRecord,
  UsageRecord,
  UserRecord,
  VersionRecord,
} from './schema';
import {
  DEFAULT_TRANSLATION_PREFERENCES,
  type DialogueRegion,
  type LanguageCode,
  type TeamRole,
  type TranslationPreferences,
} from '@/lib/types/domain';

/**
 * Repository: the only way screens read or write data.
 *
 * Every lookup by id is scoped to the signed-in owner. A record that belongs
 * to someone else is reported as missing, so changing an id in the URL can
 * never surface another account's work.
 */

const now = () => new Date().toISOString();

export class NotFoundError extends Error {}

function owned<T extends { ownerId: string }>(record: T | undefined, ownerId: string, what: string): T {
  if (!record || record.ownerId !== ownerId) throw new NotFoundError(`That ${what} doesn’t exist or isn’t yours.`);
  return record;
}

const byCreated = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

/* --------------------------------------------------------------- projects */

export const COVER_COLORS = ['#6C63E8', '#4F8A5B', '#B4544A', '#B4833A', '#3F7CAC', '#8A5BA8'];

export async function listProjects(ownerId: string) {
  const rows = await getAllByIndex<ProjectRecord>('projects', 'ownerId', ownerId);
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(ownerId: string, id: string) {
  return owned(await get<ProjectRecord>('projects', id), ownerId, 'project');
}

export async function createProject(
  ownerId: string,
  input: { name: string; description?: string; sourceLanguage: LanguageCode; targetLanguage: LanguageCode; preferences?: Partial<TranslationPreferences> },
) {
  const existing = await listProjects(ownerId);
  const project: ProjectRecord = {
    id: newId('prj'),
    ownerId,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    coverColor: COVER_COLORS[existing.length % COVER_COLORS.length],
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, ...input.preferences },
    createdAt: now(),
    updatedAt: now(),
  };
  return put('projects', project);
}

export async function updateProject(ownerId: string, id: string, patch: Partial<Omit<ProjectRecord, 'id' | 'ownerId' | 'createdAt'>>) {
  const project = await getProject(ownerId, id);
  return put<ProjectRecord>('projects', {
    ...project,
    ...patch,
    preferences: { ...project.preferences, ...patch.preferences },
    updatedAt: now(),
  });
}

async function touchProject(ownerId: string, id: string) {
  const project = await get<ProjectRecord>('projects', id);
  if (project && project.ownerId === ownerId) await put('projects', { ...project, updatedAt: now() });
}

/** Deletes a project and everything inside it, including page images. */
export async function deleteProject(ownerId: string, id: string) {
  await getProject(ownerId, id);
  const chapters = await listChapters(ownerId, id);
  for (const c of chapters) await deleteChapter(ownerId, c.id);
  for (const store of ['characters', 'glossary', 'memory'] as const) {
    const rows = await getAllByIndex<{ id: string; ownerId: string }>(store, 'projectId', id);
    await removeMany(store, rows.filter((r) => r.ownerId === ownerId).map((r) => r.id));
  }
  await remove('projects', id);
}

/* --------------------------------------------------------------- chapters */

export async function listChapters(ownerId: string, projectId: string) {
  const rows = await getAllByIndex<ChapterRecord>('chapters', 'projectId', projectId);
  return rows.filter((c) => c.ownerId === ownerId).sort((a, b) => b.number - a.number);
}

export async function listAllChapters(ownerId: string) {
  const rows = await getAllByIndex<ChapterRecord>('chapters', 'ownerId', ownerId);
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getChapter(ownerId: string, id: string) {
  return owned(await get<ChapterRecord>('chapters', id), ownerId, 'chapter');
}

export async function createChapter(
  ownerId: string,
  projectId: string,
  input: { name?: string; number?: number; sourceLanguage: LanguageCode; targetLanguage: LanguageCode; preferences: TranslationPreferences },
) {
  await getProject(ownerId, projectId);
  const siblings = await listChapters(ownerId, projectId);
  const number = input.number ?? (siblings.reduce((m, c) => Math.max(m, c.number), 0) + 1);
  const chapter: ChapterRecord = {
    id: newId('chp'),
    ownerId,
    projectId,
    name: input.name?.trim() || `Chapter ${String(number).padStart(2, '0')}`,
    number,
    status: 'uploading',
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    preferences: input.preferences,
    stages: {},
    createdAt: now(),
    updatedAt: now(),
  };
  await put('chapters', chapter);
  await touchProject(ownerId, projectId);
  return chapter;
}

export async function updateChapter(ownerId: string, id: string, patch: Partial<Omit<ChapterRecord, 'id' | 'ownerId' | 'projectId' | 'createdAt'>>) {
  const chapter = await getChapter(ownerId, id);
  const next = await put<ChapterRecord>('chapters', { ...chapter, ...patch, updatedAt: now() });
  await touchProject(ownerId, chapter.projectId);
  return next;
}

export async function deleteChapter(ownerId: string, id: string) {
  await getChapter(ownerId, id);
  const pages = await listPages(ownerId, id);
  await removeMany('blobs', pages.flatMap((p) => [p.originalBlobId, p.thumbBlobId]));
  await removeMany('pages', pages.map((p) => p.id));
  for (const store of ['comments', 'versions'] as const) {
    const rows = await getAllByIndex<{ id: string; ownerId: string }>(store, 'chapterId', id);
    await removeMany(store, rows.filter((r) => r.ownerId === ownerId).map((r) => r.id));
  }
  await remove('chapters', id);
}

/* ------------------------------------------------------------------ pages */

export async function listPages(ownerId: string, chapterId: string) {
  const rows = await getAllByIndex<PageRecord>('pages', 'chapterId', chapterId);
  return rows.filter((p) => p.ownerId === ownerId).sort((a, b) => a.order - b.order);
}

export async function listAllPages(ownerId: string) {
  return getAllByIndex<PageRecord>('pages', 'ownerId', ownerId);
}

export async function getPage(ownerId: string, id: string) {
  return owned(await get<PageRecord>('pages', id), ownerId, 'page');
}

export interface NewPageInput {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  original: Blob;
  thumbnail: Blob;
  regions?: DialogueRegion[];
}

export async function addPages(ownerId: string, chapterId: string, inputs: NewPageInput[]) {
  await getChapter(ownerId, chapterId);
  const existing = await listPages(ownerId, chapterId);
  let order = existing.reduce((m, p) => Math.max(m, p.order), 0);
  const blobs: BlobRecord[] = [];
  const pages: PageRecord[] = inputs.map((input) => {
    const originalBlobId = newId('blb');
    const thumbBlobId = newId('blb');
    blobs.push({ id: originalBlobId, ownerId, kind: 'original', blob: input.original });
    blobs.push({ id: thumbBlobId, ownerId, kind: 'thumb', blob: input.thumbnail });
    const id = newId('pg');
    return {
      id,
      ownerId,
      chapterId,
      order: ++order,
      fileName: input.fileName,
      mimeType: input.mimeType,
      bytes: input.original.size,
      width: input.width,
      height: input.height,
      originalBlobId,
      thumbBlobId,
      regions: (input.regions ?? []).map((r) => ({ ...r, pageId: id })),
      createdAt: now(),
    };
  });
  await putMany('blobs', blobs);
  await putMany('pages', pages);
  return pages;
}

export async function savePageRegions(ownerId: string, pageId: string, regions: DialogueRegion[]) {
  const page = await getPage(ownerId, pageId);
  const next = await put<PageRecord>('pages', { ...page, regions });
  await touchChapter(ownerId, page.chapterId);
  return next;
}

async function touchChapter(ownerId: string, chapterId: string) {
  const chapter = await get<ChapterRecord>('chapters', chapterId);
  if (chapter && chapter.ownerId === ownerId) await put('chapters', { ...chapter, updatedAt: now() });
}

export async function reorderPages(ownerId: string, chapterId: string, orderedIds: string[]) {
  const pages = await listPages(ownerId, chapterId);
  const byId = new Map(pages.map((p) => [p.id, p]));
  const next = orderedIds.flatMap((id, i) => {
    const p = byId.get(id);
    return p ? [{ ...p, order: i + 1 }] : [];
  });
  await putMany('pages', next);
}

export async function deletePage(ownerId: string, pageId: string) {
  const page = await getPage(ownerId, pageId);
  await removeMany('blobs', [page.originalBlobId, page.thumbBlobId]);
  await remove('pages', pageId);
  await touchChapter(ownerId, page.chapterId);
}

export async function getBlob(ownerId: string, id: string) {
  const rec = await get<BlobRecord>('blobs', id);
  return rec && rec.ownerId === ownerId ? rec.blob : undefined;
}

/* ---------------------------------------------------- glossary/characters */

export async function listGlossary(ownerId: string, projectId: string) {
  const rows = await getAllByIndex<GlossaryRecord>('glossary', 'projectId', projectId);
  return rows.filter((r) => r.ownerId === ownerId).sort((a, b) => a.original.localeCompare(b.original));
}

export async function saveGlossaryEntry(ownerId: string, entry: Omit<GlossaryRecord, 'id' | 'ownerId'> & { id?: string }) {
  if (entry.id) owned(await get<GlossaryRecord>('glossary', entry.id), ownerId, 'glossary term');
  await getProject(ownerId, entry.projectId);
  return put<GlossaryRecord>('glossary', { ...entry, id: entry.id ?? newId('gls'), ownerId });
}

export async function deleteGlossaryEntry(ownerId: string, id: string) {
  owned(await get<GlossaryRecord>('glossary', id), ownerId, 'glossary term');
  await remove('glossary', id);
}

export async function listCharacters(ownerId: string, projectId: string) {
  const rows = await getAllByIndex<CharacterRecord>('characters', 'projectId', projectId);
  return rows.filter((r) => r.ownerId === ownerId).sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveCharacter(ownerId: string, character: Omit<CharacterRecord, 'id' | 'ownerId'> & { id?: string }) {
  if (character.id) owned(await get<CharacterRecord>('characters', character.id), ownerId, 'character');
  await getProject(ownerId, character.projectId);
  return put<CharacterRecord>('characters', { ...character, id: character.id ?? newId('chr'), ownerId });
}

export async function deleteCharacter(ownerId: string, id: string) {
  owned(await get<CharacterRecord>('characters', id), ownerId, 'character');
  await remove('characters', id);
}

/* ------------------------------------------------------ translation memory */

export async function listMemory(ownerId: string, projectId?: string) {
  const rows = projectId
    ? await getAllByIndex<MemoryRecord>('memory', 'projectId', projectId)
    : await getAllByIndex<MemoryRecord>('memory', 'ownerId', ownerId);
  return rows.filter((r) => r.ownerId === ownerId).sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));
}

/** Approving a region writes (or refreshes) its translation-memory entry. */
export async function rememberApproval(
  ownerId: string,
  input: { projectId: string; region: DialogueRegion; speakerName?: string; chapterName: string; regionLabel: string; context: string },
) {
  const { region } = input;
  if (!region.sourceText.trim() || !region.finalTranslation.trim()) return;
  const all = await listMemory(ownerId, input.projectId);
  const prior = all.find((m) => m.sourceRegionId === region.id);
  const sameText = all.filter((m) => m.sourceText.trim() === region.sourceText.trim() && m.id !== prior?.id);
  await put<MemoryRecord>('memory', {
    id: prior?.id ?? newId('mem'),
    ownerId,
    projectId: input.projectId,
    sourceRegionId: region.id,
    sourceText: region.sourceText.trim(),
    translation: region.finalTranslation.trim(),
    speakerId: region.speakerId,
    speakerName: input.speakerName,
    chapterName: input.chapterName,
    regionLabel: input.regionLabel,
    context: input.context,
    approvedAt: now(),
    occurrences: sameText.length + 1,
  });
}

export async function updateMemoryEntry(ownerId: string, id: string, translation: string) {
  const entry = owned(await get<MemoryRecord>('memory', id), ownerId, 'memory entry');
  return put<MemoryRecord>('memory', { ...entry, translation: translation.trim(), approvedAt: now() });
}

export async function deleteMemoryEntry(ownerId: string, id: string) {
  owned(await get<MemoryRecord>('memory', id), ownerId, 'memory entry');
  await remove('memory', id);
}

/**
 * "Change globally": rewrites every region in the project whose source text
 * matches, and records each change in version history.
 */
export async function applyTranslationGlobally(ownerId: string, projectId: string, sourceText: string, translation: string, actor: string) {
  const chapters = await listChapters(ownerId, projectId);
  let changed = 0;
  for (const chapter of chapters) {
    const pages = await listPages(ownerId, chapter.id);
    for (const page of pages) {
      let dirty = false;
      const regions = page.regions.map((r) => {
        if (r.sourceText.trim() !== sourceText.trim() || r.finalTranslation === translation) return r;
        dirty = true;
        changed++;
        void addVersion(ownerId, {
          chapterId: chapter.id,
          pageId: page.id,
          regionId: r.id,
          kind: 'human_edit',
          actor,
          summary: 'Applied translation memory globally',
          before: r.finalTranslation,
          after: translation,
          field: 'finalTranslation',
        });
        return { ...r, finalTranslation: translation, status: 'edited' as const };
      });
      if (dirty) await put<PageRecord>('pages', { ...page, regions });
    }
  }
  return changed;
}

/* ----------------------------------------------------- comments & history */

export async function listComments(ownerId: string, chapterId: string) {
  const rows = await getAllByIndex<CommentRecord>('comments', 'chapterId', chapterId);
  return rows.filter((r) => r.ownerId === ownerId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addComment(ownerId: string, input: Omit<CommentRecord, 'id' | 'ownerId' | 'createdAt' | 'resolved'>) {
  if (cloudEnabled) { const result = await callService<CommentRecord>('/api/comments', input); notify('comments'); return result; }
  return put<CommentRecord>('comments', { ...input, id: newId('cmt'), ownerId, createdAt: now(), resolved: false });
}

export async function setCommentResolved(ownerId: string, id: string, resolved: boolean) {
  const c = owned(await get<CommentRecord>('comments', id), ownerId, 'comment');
  return put<CommentRecord>('comments', { ...c, resolved });
}

export async function listVersions(ownerId: string, chapterId: string) {
  const rows = await getAllByIndex<VersionRecord>('versions', 'chapterId', chapterId);
  return rows.filter((r) => r.ownerId === ownerId).sort(byCreated);
}

export async function addVersion(ownerId: string, input: Omit<VersionRecord, 'id' | 'ownerId' | 'createdAt'>) {
  return put<VersionRecord>('versions', { ...input, id: newId('ver'), ownerId, createdAt: now() });
}

/* ------------------------------------------------------------------- team */

export async function listTeam(ownerId: string) {
  const rows = await getAllByIndex<TeamRecord>('team', 'ownerId', ownerId);
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

const AVATAR_COLORS = ['#4F8A5B', '#B4833A', '#B4544A', '#3F7CAC', '#8A5BA8'];

export async function inviteMember(ownerId: string, input: { name: string; email: string; role: TeamRole }) {
  if (cloudEnabled) { const result = await callService<{member: TeamRecord}>('/api/team/invite', input); notify('team'); return result.member; }
  const team = await listTeam(ownerId);
  const email = input.email.trim().toLowerCase();
  if (team.some((m) => m.email === email)) throw new Error('That person is already on your team.');
  return put<TeamRecord>('team', {
    id: newId('tm'),
    ownerId,
    name: input.name.trim() || email.split('@')[0],
    email,
    role: input.role,
    avatarColor: AVATAR_COLORS[team.length % AVATAR_COLORS.length],
    lastActive: now(),
    status: 'invited',
  });
}

export async function updateMemberRole(ownerId: string, id: string, role: TeamRole) {
  const m = owned(await get<TeamRecord>('team', id), ownerId, 'team member');
  return put<TeamRecord>('team', { ...m, role });
}

export async function removeMember(ownerId: string, id: string) {
  owned(await get<TeamRecord>('team', id), ownerId, 'team member');
  await remove('team', id);
}

/* ------------------------------------------------------------------ usage */

export function periodKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getUsage(ownerId: string, period = periodKey()): Promise<UsageRecord> {
  if (cloudEnabled && period === periodKey()) return callService<UsageRecord>(`/api/usage?workspace=${encodeURIComponent(ownerId)}`);
  return (
    (await get<UsageRecord>('usage', `${ownerId}:${period}`)) ?? {
      id: `${ownerId}:${period}`,
      ownerId,
      period,
      pagesProcessed: 0,
      pagesExported: 0,
    }
  );
}

export async function recordUsage(ownerId: string, delta: { pagesProcessed?: number; pagesExported?: number }) {
  if (cloudEnabled) { notify('usage'); return getUsage(ownerId); }
  const usage = await getUsage(ownerId);
  return put<UsageRecord>('usage', {
    ...usage,
    pagesProcessed: usage.pagesProcessed + (delta.pagesProcessed ?? 0),
    pagesExported: usage.pagesExported + (delta.pagesExported ?? 0),
  });
}

/* ---------------------------------------------------------------- account */

const OWNED_STORES = ['projects', 'chapters', 'pages', 'blobs', 'characters', 'glossary', 'memory', 'comments', 'versions', 'team', 'usage'] as const;

/** Removes every page image the account uploaded, and the pages that held them. */
export async function deleteAllUploads(ownerId: string) {
  const pages = await listAllPages(ownerId);
  await removeMany('blobs', pages.flatMap((p) => [p.originalBlobId, p.thumbBlobId]));
  await removeMany('pages', pages.map((p) => p.id));
  return pages.length;
}

export async function deleteAccount(ownerId: string) {
  if (cloudEnabled) {
    // Removing a login needs the server; it also deletes every record and image.
    const res = await fetch('/api/account', { method: 'DELETE' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(body?.error?.message ?? 'Your account couldn’t be deleted. Try again.');
    }
    return;
  }
  for (const store of OWNED_STORES) {
    const rows = await getAllByIndex<{ id: string }>(store, 'ownerId', ownerId);
    await removeMany(store, rows.map((r) => r.id));
  }
  await remove('users', ownerId);
  notify('users');
}

/** Everything the account owns except image bytes, for "Export all my data". */
export async function exportAccountData(ownerId: string) {
  const out: Record<string, unknown> = {};
  const user = await get<UserRecord>('users', ownerId);
  if (user) {
    const { passwordHash: _h, salt: _s, iterations: _i, ...safe } = user;
    out.account = safe;
  }
  for (const store of OWNED_STORES) {
    if (store === 'blobs') continue;
    out[store] = await getAllByIndex(store, 'ownerId', ownerId);
  }
  return out;
}

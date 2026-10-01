'use client';

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ComicPage } from '@/components/demo/comic-page';
import { PAGE_H, PAGE_W } from '@/components/demo/artwork';
import { DEMO_REGIONS } from '@/lib/data/chapter';
import { DEMO_CHARACTERS } from '@/lib/data/characters';
import { DEMO_GLOSSARY } from '@/lib/data/glossary';
import { DEMO_MEMORY } from '@/lib/data/workspace';
import { newId, putMany } from '@/lib/store/db';
import { addPages, createChapter, createProject, updateChapter } from '@/lib/store/repo';
import type { CharacterRecord, GlossaryRecord, MemoryRecord } from '@/lib/store/schema';
import { DEFAULT_TRANSLATION_PREFERENCES } from '@/lib/types/domain';

/**
 * Seeds "The Fallen Hero" — an original fictional sample — so a new account
 * can try the whole workflow before uploading anything. The page image is
 * rendered from Overset's own demo artwork into a real stored PNG, so it
 * behaves exactly like an upload.
 */

const SCALE = 2;

async function renderSamplePage(): Promise<{ original: Blob; thumbnail: Blob }> {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => root.render(<ComicPage view="original" regions={DEMO_REGIONS} />));
  const svg = host.querySelector('svg');
  if (!svg) throw new Error('The sample page could not be drawn.');
  svg.setAttribute('width', String(PAGE_W));
  svg.setAttribute('height', String(PAGE_H));
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = "text{font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif}";
  svg.insertBefore(style, svg.firstChild);
  const xml = new XMLSerializer().serializeToString(svg);
  root.unmount();

  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W * SCALE;
  canvas.height = PAGE_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not create a canvas.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const original = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed.'))), 'image/png'));

  const thumb = document.createElement('canvas');
  thumb.width = 240;
  thumb.height = Math.round((240 * PAGE_H) / PAGE_W);
  thumb.getContext('2d')?.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  const thumbnail = await new Promise<Blob>((res, rej) => thumb.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed.'))), 'image/webp', 0.82));
  return { original, thumbnail };
}

export async function seedSampleProject(ownerId: string) {
  const project = await createProject(ownerId, {
    name: 'The Fallen Hero (sample)',
    description: 'An original fictional murim serial for trying Overset. Four recurring speakers, locked terminology, honorifics preserved.',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, preserveHonorifics: true },
  });

  const charIds = new Map(DEMO_CHARACTERS.map((c) => [c.id, newId('chr')]));
  const characters: CharacterRecord[] = DEMO_CHARACTERS.map((c) => ({
    ...c,
    id: charIds.get(c.id)!,
    ownerId,
    projectId: project.id,
    relationships: c.relationships.map((r) => ({ ...r, characterId: charIds.get(r.characterId) ?? r.characterId })),
  }));
  const glossary: GlossaryRecord[] = DEMO_GLOSSARY.map((g) => ({
    ...g,
    id: newId('gls'),
    ownerId,
    projectId: project.id,
    characterIds: g.characterIds.map((id) => charIds.get(id) ?? id),
  }));
  const memory: MemoryRecord[] = DEMO_MEMORY.map((m) => ({
    ...m,
    id: newId('mem'),
    ownerId,
    projectId: project.id,
    speakerId: m.speakerId ? charIds.get(m.speakerId) : undefined,
  }));
  await putMany('characters', characters);
  await putMany('glossary', glossary);
  await putMany('memory', memory);

  const chapter = await createChapter(ownerId, project.id, {
    name: 'Chapter 14',
    number: 14,
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    preferences: project.preferences,
  });
  const { original, thumbnail } = await renderSamplePage();
  await addPages(ownerId, chapter.id, [
    {
      fileName: 'fallen-hero-ch14-p03.png',
      mimeType: 'image/png',
      width: PAGE_W * SCALE,
      height: PAGE_H * SCALE,
      original,
      thumbnail,
      regions: DEMO_REGIONS.map((r) => ({
        ...r,
        id: newId('rgn'),
        speakerId: r.speakerId ? charIds.get(r.speakerId) : undefined,
      })),
    },
  ]);
  await updateChapter(ownerId, chapter.id, {
    status: 'review',
    stages: {
      upload: { state: 'complete', message: 'Sample page' },
      detect: { state: 'complete', message: '7 regions' },
    },
  });
  return { projectId: project.id, chapterId: chapter.id };
}

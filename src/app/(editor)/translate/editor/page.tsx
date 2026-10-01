'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDownNarrowWide, ArrowLeft, ArrowUpNarrowWide, Download, Maximize2, Minus, MousePointer2, Plus, SquareDashed } from 'lucide-react';
import { PageCanvas } from '@/components/app/editor/page-canvas';
import { Inspector } from '@/components/app/editor/inspector';
import { TypesetPanel } from '@/components/app/editor/typeset-panel';
import { CompareView } from '@/components/app/editor/compare';
import { CommentsPanel, HistoryPanel, QaPanel } from '@/components/app/editor/side-panels';
import { ExportModal } from '@/components/app/editor/export-modal';
import { PageRail } from '@/components/app/editor/page-rail';
import { useChapterData, useChapterId } from '@/components/app/editor/use-chapter';
import { ConfirmModal } from '@/components/app/project-form';
import { Button, Checkbox, EmptyState, Field, Input, Modal, Select, useToast } from '@/components/ui';
import { useUser } from '@/lib/store/hooks';
import {
  addComment,
  addPages,
  addVersion,
  deletePage,
  getBlob,
  recordUsage,
  rememberApproval,
  reorderPages,
  saveGlossaryEntry,
  savePageRegions,
  setCommentResolved,
  updateChapter,
} from '@/lib/store/repo';
import { newId } from '@/lib/store/db';
import { ingestFiles } from '@/lib/imaging/ingest';
import { detectRegions } from '@/lib/imaging/detect';
import { readingOrder } from '@/lib/imaging/detect-core';
import { measureFit, type RenderMode } from '@/lib/imaging/render';
import { runQa, type QaFinding } from '@/lib/qa';
import type { PageRecord, VersionRecord } from '@/lib/store/schema';
import { DEFAULT_TYPESETTING, LANGUAGE_LABELS, type DialogueRegion, type GlossaryType, type Rect, type TypesettingProperties } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const CANVAS_VIEWS: Array<{ id: RenderMode | 'compare'; label: string }> = [
  { id: 'original', label: 'Original' },
  { id: 'cleaned', label: 'Cleaned' },
  { id: 'translated', label: 'Translated' },
  { id: 'compare', label: 'Compare' },
];
const RIGHT_TABS = [
  { id: 'translation', label: 'Translation' },
  { id: 'typeset', label: 'Typeset' },
  { id: 'qa', label: 'QA' },
  { id: 'comments', label: 'Comments' },
  { id: 'history', label: 'History' },
] as const;
type RightTab = (typeof RIGHT_TABS)[number]['id'];

/** Mobile gets tabs rather than a shrunken three-column desktop editor. */
const MOBILE_TABS = [
  { id: 'pages', label: 'Pages' },
  { id: 'panel', label: 'Panel' },
  { id: 'translation', label: 'Translation' },
] as const;
type MobileTab = (typeof MOBILE_TABS)[number]['id'];

export default function EditorPage() {
  const chapterId = useChapterId();
  if (chapterId === undefined) return <div className="flex h-screen items-center justify-center bg-editor-bg text-[13px] text-editor-muted">Opening chapter…</div>;
  if (chapterId === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <EmptyState
          title="No chapter to open."
          body="Upload a chapter to start translating, or open one from a project."
          action={
            <div className="flex gap-2">
              <Button href="/translate">Upload a chapter</Button>
              <Button href="/projects" variant="secondary">
                Projects
              </Button>
            </div>
          }
        />
      </div>
    );
  return <Editor chapterId={chapterId} />;
}

function Editor({ chapterId }: { chapterId: string }) {
  const user = useUser();
  const toast = useToast();
  const data = useChapterData(chapterId);
  const { drafts, updateRegions } = data;

  const [pageId, setPageId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<RenderMode | 'compare'>('original');
  const [tool, setTool] = React.useState<'select' | 'draw'>('select');
  const [rightTab, setRightTab] = React.useState<RightTab>('translation');
  const [mobileTab, setMobileTab] = React.useState<MobileTab>('panel');
  const [zoom, setZoom] = React.useState(100);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [deletingPage, setDeletingPage] = React.useState<PageRecord | null>(null);
  const [addingPages, setAddingPages] = React.useState(false);
  const [glossaryDraft, setGlossaryDraft] = React.useState<{ original: string; translation: string } | null>(null);
  const [image, setImage] = React.useState<ImageBitmap | null>(null);

  const pages = data.data?.pages ?? [];
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const regions = React.useMemo(() => (page ? drafts[page.id] ?? page.regions : []), [page, drafts]);
  const ordered = React.useMemo(() => [...regions].sort((a, b) => a.readingOrder - b.readingOrder), [regions]);
  const index = ordered.findIndex((r) => r.id === selectedId);
  const region = index >= 0 ? ordered[index] : undefined;

  // Open the first page, and keep a valid page selected as pages change.
  React.useEffect(() => {
    if (pages.length && (!pageId || !pages.some((p) => p.id === pageId))) setPageId(pages[0].id);
  }, [pages, pageId]);

  // Load the full-resolution original only for the page being edited.
  React.useEffect(() => {
    if (!page) return;
    let alive = true;
    let bitmap: ImageBitmap | null = null;
    setImage(null);
    getBlob(user.id, page.originalBlobId)
      .then(async (blob) => {
        if (!blob || !alive) return;
        bitmap = await createImageBitmap(blob);
        if (alive) setImage(bitmap);
        else bitmap.close();
      })
      .catch(() => toast({ message: `Page ${page.order} couldn’t be loaded from storage.`, tone: 'warn' }));
    return () => {
      alive = false;
      bitmap?.close();
    };
  }, [page?.id, page?.originalBlobId, user.id, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const characters = data.data?.characters ?? [];
  const glossary = data.data?.glossary ?? [];
  const speakerName = React.useCallback((id?: string) => characters.find((c) => c.id === id)?.name ?? '', [characters]);

  const pagesWithDrafts = React.useMemo(() => pages.map((p) => ({ ...p, regions: drafts[p.id] ?? p.regions })), [pages, drafts]);
  const findings = React.useMemo(
    () =>
      runQa(pagesWithDrafts, {
        glossary,
        characters,
        fits: (r, pid) => {
          const pg = pages.find((p) => p.id === pid);
          return !pg || !r.finalTranslation.trim() || measureFit(r, pg.width, pg.height).fits;
        },
      }),
    [pagesWithDrafts, glossary, characters, pages],
  );

  /* ------------------------------------------------------------ actions */

  const version = React.useCallback(
    (v: Omit<VersionRecord, 'id' | 'ownerId' | 'createdAt' | 'chapterId' | 'actor'>) =>
      void addVersion(user.id, { ...v, chapterId, actor: user.name }),
    [user.id, user.name, chapterId],
  );

  const patch = React.useCallback(
    (id: string, next: Partial<DialogueRegion>) => {
      if (!page) return;
      updateRegions(page.id, (rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));
    },
    [page, updateRegions],
  );

  function renumber(rs: DialogueRegion[]) {
    if (!page) return rs;
    const dir = data.data?.chapter.sourceLanguage === 'ja' ? 'rtl' : 'ltr';
    const px = rs.map((r) => ({ id: r.id, x: r.bounds.x, y: r.bounds.y, width: r.bounds.width, height: r.bounds.height }));
    const order = new Map(readingOrder(px, dir).map((r, i) => [r.id, i + 1]));
    return rs.map((r) => ({ ...r, readingOrder: order.get(r.id) ?? r.readingOrder }));
  }

  function createRegion(bounds: Rect) {
    if (!page || !data.data) return;
    const id = newId('rgn');
    const region: DialogueRegion = {
      id,
      pageId: page.id,
      bounds,
      type: 'dialogue',
      readingOrder: regions.length + 1,
      sourceLanguage: data.data.chapter.sourceLanguage,
      sourceText: '',
      literalTranslation: '',
      finalTranslation: '',
      alternatives: [],
      ocrConfidence: 0,
      translationConfidence: 0,
      status: 'untranslated',
      embeddedInArtwork: false,
      translate: true,
      contextUsed: [],
      // No source glyphs to measure, so start from the region's height.
      typesetting: { ...DEFAULT_TYPESETTING, fontSize: Math.round(Math.max(10, Math.min(36, (bounds.height / 100) * page.height * (840 / page.width) * 0.17)) * 2) / 2 },
    };
    updateRegions(page.id, (rs) => renumber([...rs, region]));
    setSelectedId(id);
    setTool('select');
    setRightTab('translation');
    version({ pageId: page.id, regionId: id, kind: 'ocr_edit', summary: `Added a region on page ${page.order}` });
  }

  function deleteRegion(id: string) {
    if (!page) return;
    const r = regions.find((x) => x.id === id);
    updateRegions(page.id, (rs) => renumber(rs.filter((x) => x.id !== id)));
    setSelectedId(null);
    version({ pageId: page.id, regionId: id, kind: 'ocr_edit', summary: `Deleted a region on page ${page.order}${r?.finalTranslation ? ` (“${r.finalTranslation.slice(0, 40)}”)` : ''}` });
  }

  function moveOrder(delta: -1 | 1) {
    if (!page || !region) return;
    const target = ordered[index + delta];
    if (!target) return;
    updateRegions(page.id, (rs) =>
      rs.map((r) => (r.id === region.id ? { ...r, readingOrder: target.readingOrder } : r.id === target.id ? { ...r, readingOrder: region.readingOrder } : r)),
    );
  }

  async function approve() {
    if (!page || !region || !data.data) return;
    if (!region.finalTranslation.trim()) return;
    patch(region.id, { status: 'approved' });
    version({ pageId: page.id, regionId: region.id, kind: 'approval', summary: `Approved region ${index + 1} on page ${page.order}` });
    if (data.data.chapter.preferences.useTranslationMemory !== false) {
      await rememberApproval(user.id, {
        projectId: data.data.project.id,
        region: { ...region, status: 'approved' },
        speakerName: speakerName(region.speakerId) || undefined,
        chapterName: data.data.chapter.name,
        regionLabel: `Page ${String(page.order).padStart(2, '0')} · Region ${String(index + 1).padStart(2, '0')}`,
        context: region.speakerId ? `${speakerName(region.speakerId)}, ${region.type}` : region.type,
      });
    }
    // Move on to the next region that still needs work.
    const next = ordered.slice(index + 1).find((r) => r.translate && r.status !== 'approved');
    if (next) setSelectedId(next.id);
  }

  function commitText(field: 'finalTranslation' | 'sourceText', before: string, after: string) {
    if (!page || !region || before === after) return;
    version({
      pageId: page.id,
      regionId: region.id,
      kind: field === 'finalTranslation' ? 'human_edit' : 'ocr_edit',
      summary: `${user.name.split(' ')[0]} edited ${field === 'finalTranslation' ? 'the translation' : 'the source text'} of region ${index + 1} on page ${page.order}`,
      before,
      after,
      field,
    });
  }

  async function restore(v: VersionRecord) {
    if (!v.field || v.before === undefined || !v.regionId) return;
    const target = pages.find((p) => (drafts[p.id] ?? p.regions).some((r) => r.id === v.regionId));
    if (!target) {
      toast({ message: 'That region no longer exists.', tone: 'warn' });
      return;
    }
    const current = (drafts[target.id] ?? target.regions).find((r) => r.id === v.regionId)!;
    updateRegions(target.id, (rs) => rs.map((r) => (r.id === v.regionId ? { ...r, [v.field!]: v.before!, status: 'edited' } : r)));
    version({ pageId: target.id, regionId: v.regionId, kind: 'human_edit', summary: 'Restored an earlier version', before: current[v.field], after: v.before, field: v.field });
    setPageId(target.id);
    setSelectedId(v.regionId);
    setRightTab('translation');
    toast({ message: 'Earlier version restored.', tone: 'ok' });
  }

  function goTo(f: QaFinding) {
    setPageId(f.pageId);
    setSelectedId(f.regionId ?? null);
    if (f.regionId) setRightTab('translation');
    setMobileTab('panel');
  }

  async function movePage(id: string, dir: -1 | 1) {
    const ids = pages.map((p) => p.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await reorderPages(user.id, chapterId, ids);
  }

  async function addFiles(files: File[]) {
    if (!data.data) return;
    setAddingPages(true);
    try {
      const { pages: ingested, problems } = await ingestFiles(files);
      if (ingested.length === 0) {
        toast({ message: problems[0]?.reason ?? 'None of those files could be read as pages.', tone: 'warn' });
        return;
      }
      const saved = await addPages(user.id, chapterId, ingested);
      await recordUsage(user.id, { pagesProcessed: saved.length });
      for (let i = 0; i < saved.length; i++) {
        try {
          await savePageRegions(user.id, saved[i].id, await detectRegions(ingested[i].original, saved[i].id, data.data.chapter.sourceLanguage));
        } catch {
          /* the translator can draw regions by hand */
        }
      }
      setPageId(saved[0].id);
      toast({ message: `Added ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}${problems.length ? `; ${problems.length} skipped` : ''}.`, tone: 'ok' });
    } finally {
      setAddingPages(false);
    }
  }

  // Region-to-region navigation is what a translator repeats hundreds of times
  // a chapter, so it gets keyboard shortcuts.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = (d: number) => {
        if (!ordered.length) return;
        const i = index < 0 ? (d > 0 ? -1 : 0) : index;
        setSelectedId(ordered[(i + d + ordered.length) % ordered.length].id);
      };
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'a' && region) void approve();
      else if ((e.key === 'Delete' || e.key === 'Backspace') && region) deleteRegion(region.id);
      else if (e.key === 'd') setTool((x) => (x === 'draw' ? 'select' : 'draw'));
      else if (e.key === 'Escape') {
        setTool('select');
        setSelectedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ------------------------------------------------------------- render */

  if (data.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <EmptyState title="This chapter isn’t available." body="It may have been deleted, or it belongs to a different account." action={<Button href="/projects">Back to projects</Button>} />
      </div>
    );
  }
  if (!data.data) return <div className="flex h-screen items-center justify-center bg-editor-bg text-[13px] text-editor-muted">Loading chapter…</div>;

  const { chapter, project, memory, comments, versions } = data.data;
  const allRegions = pagesWithDrafts.flatMap((p) => p.regions.filter((r) => r.translate));
  const approvedCount = allRegions.filter((r) => r.status === 'approved').length;

  const rightPanel = (
    <>
      <div className="flex gap-0.5 overflow-x-auto border-b border-editor-line px-3 pt-3 no-scrollbar" role="tablist">
        {RIGHT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightTab(t.id)}
            aria-selected={rightTab === t.id}
            role="tab"
            className={cn(
              'shrink-0 rounded-t-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
              rightTab === t.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text',
            )}
          >
            {t.label}
            {t.id === 'qa' && findings.filter((f) => f.severity !== 'info').length > 0 && (
              <span className="ml-1 rounded bg-warn/25 px-1 text-[10px] text-warn">{findings.filter((f) => f.severity !== 'info').length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rightTab === 'qa' ? (
          <QaPanel findings={findings} onGo={goTo} />
        ) : rightTab === 'history' ? (
          <HistoryPanel versions={versions} onRestore={(v) => void restore(v)} />
        ) : rightTab === 'comments' ? (
          <CommentsPanel
            hasRegion={!!region}
            authorName={user.name}
            comments={comments.filter((c) => c.regionId === region?.id)}
            onAdd={async (body, parentId) => {
              if (!region || !page) return;
              await addComment(user.id, { chapterId, pageId: page.id, regionId: region.id, parentId, authorName: user.name, body });
            }}
            onResolve={(id, resolved) => void setCommentResolved(user.id, id, resolved)}
          />
        ) : !region || !page ? (
          <div className="space-y-3 px-4 py-6 text-[12.5px] leading-relaxed text-editor-muted">
            <p className="text-[13px] font-medium text-editor-text">{ordered.length ? 'Select a region' : 'No regions on this page yet'}</p>
            <p>
              {ordered.length
                ? 'Click a region on the page, or press j / k to step through them.'
                : 'Choose the draw tool (d) and drag over each speech bubble, caption, or sound effect.'}
            </p>
            <button onClick={() => setTool('draw')} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white">
              <SquareDashed size={12} />
              Draw a region
            </button>
          </div>
        ) : rightTab === 'typeset' ? (
          <TypesetPanel
            region={region}
            pageWidth={page.width}
            pageHeight={page.height}
            onChange={(p: Partial<TypesettingProperties>) => patch(region.id, { typesetting: { ...region.typesetting, ...p } })}
          />
        ) : (
          <Inspector
            region={region}
            index={index}
            total={ordered.length}
            characters={characters}
            glossary={glossary}
            memory={chapter.preferences.useTranslationMemory === false ? [] : memory}
            rules={project.preferences.customRules}
            onChange={(p) => patch(region.id, p)}
            onCommit={commitText}
            onPrev={() => setSelectedId(ordered[(index - 1 + ordered.length) % ordered.length].id)}
            onNext={() => setSelectedId(ordered[(index + 1) % ordered.length].id)}
            onApprove={() => void approve()}
            onReject={() => {
              patch(region.id, { status: 'rejected' });
              version({ pageId: page.id, regionId: region.id, kind: 'approval', summary: `Rejected region ${index + 1} on page ${page.order}` });
            }}
            onDelete={() => deleteRegion(region.id)}
            onAddGlossary={(original, translation) => setGlossaryDraft({ original: original || region.sourceText.trim(), translation })}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-editor-bg text-editor-text">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-editor-line px-4 py-2.5">
        <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 text-[12.5px] text-editor-muted transition-colors hover:text-editor-text">
          <ArrowLeft size={14} />
          {project.name}
        </Link>
        <span className="text-editor-line" aria-hidden>
          /
        </span>
        <span className="text-[12.5px] text-editor-text">{chapter.name}</span>
        <span className="hidden text-[11.5px] text-editor-muted sm:inline">
          {LANGUAGE_LABELS[chapter.sourceLanguage]} → {LANGUAGE_LABELS[chapter.targetLanguage]}
        </span>
        <span className="ml-auto text-[11.5px] tabular-nums text-editor-muted" aria-live="polite">
          {data.saveError ? <span className="text-danger">{data.saveError}</span> : data.saving ? 'Saving…' : 'Saved'} · {approvedCount} / {allRegions.length} approved
        </span>
        <button
          onClick={() => setExportOpen(true)}
          disabled={pages.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-40"
        >
          <Download size={13} />
          Export
        </button>
      </header>

      <div className="flex gap-1 border-b border-editor-line px-3 py-2 lg:hidden" role="tablist">
        {MOBILE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            aria-selected={mobileTab === t.id}
            role="tab"
            className={cn('flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors', mobileTab === t.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <p className="text-[15px] font-medium">This chapter has no pages.</p>
            <p className="mt-1.5 text-[13px] text-editor-muted">Add pages to start translating.</p>
            <div className="mt-4">
              <PageRail pages={[]} drafts={{}} current={null} onSelect={() => {}} onMove={() => {}} onDelete={() => {}} onAddFiles={(f) => void addFiles(f)} adding={addingPages} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[124px_minmax(0,1fr)_350px]">
          <aside className={cn('min-h-0 overflow-y-auto border-r border-editor-line p-3', mobileTab === 'pages' ? 'block' : 'hidden lg:block')}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-editor-muted">{pages.length} pages</p>
            <PageRail
              pages={pages}
              drafts={drafts}
              current={page?.id ?? null}
              onSelect={(id) => {
                setPageId(id);
                setSelectedId(null);
                setMobileTab('panel');
              }}
              onMove={(id, d) => void movePage(id, d)}
              onDelete={setDeletingPage}
              onAddFiles={(f) => void addFiles(f)}
              adding={addingPages}
            />
          </aside>

          <section className={cn('min-h-0 overflow-auto border-r border-editor-line bg-editor-panel p-4', mobileTab === 'panel' ? 'block' : 'hidden lg:block')}>
            <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
              <div className="inline-flex gap-0.5 rounded-md border border-editor-line p-0.5" role="group" aria-label="Tool">
                <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} label="Select and move (Esc)">
                  <MousePointer2 size={12} />
                </ToolBtn>
                <ToolBtn active={tool === 'draw'} onClick={() => setTool('draw')} label="Draw a region (d)">
                  <SquareDashed size={12} />
                </ToolBtn>
              </div>
              {region && (
                <div className="inline-flex gap-0.5 rounded-md border border-editor-line p-0.5" role="group" aria-label="Reading order">
                  <ToolBtn onClick={() => moveOrder(-1)} label="Read this region earlier">
                    <ArrowUpNarrowWide size={12} />
                  </ToolBtn>
                  <ToolBtn onClick={() => moveOrder(1)} label="Read this region later">
                    <ArrowDownNarrowWide size={12} />
                  </ToolBtn>
                </div>
              )}
              <div className="mx-1 h-4 w-px bg-editor-line" aria-hidden />
              {CANVAS_VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  aria-pressed={view === v.id}
                  className={cn('rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors', view === v.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text')}
                >
                  {v.label}
                </button>
              ))}
              {view !== 'compare' && (
                <>
                  <div className="mx-1 h-4 w-px bg-editor-line" aria-hidden />
                  <ToolBtn onClick={() => setZoom((z) => Math.max(30, z - 15))} label="Zoom out">
                    <Minus size={12} />
                  </ToolBtn>
                  <span className="min-w-[40px] text-center text-[11.5px] tabular-nums text-editor-muted">{zoom}%</span>
                  <ToolBtn onClick={() => setZoom((z) => Math.min(300, z + 15))} label="Zoom in">
                    <Plus size={12} />
                  </ToolBtn>
                  <ToolBtn onClick={() => setZoom(100)} label="Fit to width">
                    <Maximize2 size={12} />
                  </ToolBtn>
                </>
              )}
            </div>

            {page &&
              (view === 'compare' ? (
                <CompareView image={image} regions={regions} />
              ) : (
                <PageCanvas
                  image={image}
                  width={page.width}
                  height={page.height}
                  regions={regions}
                  view={view}
                  zoom={zoom}
                  tool={tool}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (id) setRightTab((t) => (t === 'qa' || t === 'history' ? 'translation' : t));
                  }}
                  onCreate={createRegion}
                  onBoundsChange={(id, bounds) => patch(id, { bounds })}
                  onBoundsCommit={() => {}}
                />
              ))}
            {page && (
              <p className="mt-3 text-center text-[11px] text-editor-muted">
                Page {page.order} · {page.width} × {page.height} px · {tool === 'draw' ? 'drag to draw a region' : 'j / k step · a approve · d draw · delete removes'}
              </p>
            )}
          </section>

          <aside className={cn('flex min-h-0 flex-col', mobileTab === 'translation' ? 'flex' : 'hidden lg:flex')}>{rightPanel}</aside>
        </div>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        project={project}
        chapter={chapter}
        pages={pagesWithDrafts}
        findings={findings}
        speakerName={speakerName}
        loadOriginal={(p) => getBlob(user.id, p.originalBlobId)}
        onExported={async ({ pages: n }) => {
          await recordUsage(user.id, { pagesExported: n });
          await updateChapter(user.id, chapterId, { lastExportedAt: new Date().toISOString() });
          version({ kind: 'export', summary: `Exported ${n} ${n === 1 ? 'page' : 'pages'}` });
        }}
      />

      <ConfirmModal
        open={deletingPage !== null}
        onClose={() => setDeletingPage(null)}
        title={`Delete page ${deletingPage?.order ?? ''}?`}
        confirmLabel="Delete page"
        body="The page image and its regions are removed from this chapter."
        onConfirm={async () => {
          if (!deletingPage) return;
          await deletePage(user.id, deletingPage.id);
          const rest = pages.filter((p) => p.id !== deletingPage.id).map((p) => p.id);
          await reorderPages(user.id, chapterId, rest);
          toast({ message: 'Page deleted.', tone: 'ok' });
        }}
      />

      <GlossaryQuickAdd
        draft={glossaryDraft}
        onClose={() => setGlossaryDraft(null)}
        onSave={async (entry) => {
          await saveGlossaryEntry(user.id, {
            projectId: project.id,
            original: entry.original,
            translation: entry.translation,
            alternatives: [],
            type: entry.type,
            status: entry.locked ? 'locked' : 'approved',
            occurrences: pagesWithDrafts.flatMap((p) => p.regions).filter((r) => r.sourceText.includes(entry.original)).length,
            firstAppearance: `${chapter.name} · page ${page?.order ?? 1}`,
            lastAppearance: `${chapter.name} · page ${page?.order ?? 1}`,
            characterIds: region?.speakerId ? [region.speakerId] : [],
          });
          version({ kind: 'glossary_update', summary: `Added “${entry.original} → ${entry.translation}” to the glossary` });
          toast({ message: 'Added to the glossary. QA will check it from now on.', tone: 'ok' });
        }}
      />
    </div>
  );
}

function ToolBtn({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn('rounded p-1.5 transition-colors', active ? 'bg-accent text-white' : 'text-editor-muted hover:text-editor-text')}
    >
      {children}
    </button>
  );
}

function GlossaryQuickAdd({
  draft,
  onClose,
  onSave,
}: {
  draft: { original: string; translation: string } | null;
  onClose: () => void;
  onSave: (e: { original: string; translation: string; type: GlossaryType; locked: boolean }) => Promise<void>;
}) {
  const [original, setOriginal] = React.useState('');
  const [translation, setTranslation] = React.useState('');
  const [type, setType] = React.useState<GlossaryType>('term');
  const [locked, setLocked] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (draft) {
      setOriginal(draft.original);
      setTranslation(draft.translation);
      setType('term');
      setLocked(false);
    }
  }, [draft]);

  return (
    <Modal
      open={draft !== null}
      onClose={onClose}
      title="Add to glossary"
      description="Future chapters in this project are checked against it."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!original.trim() || !translation.trim()}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave({ original: original.trim(), translation: translation.trim(), type, locked });
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            Add term
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Original" htmlFor="g-orig" hint="Tip: select text in the source box first to prefill this.">
          <Input id="g-orig" value={original} onChange={(e) => setOriginal(e.target.value)} />
        </Field>
        <Field label="Approved translation" htmlFor="g-tr">
          <Input id="g-tr" value={translation} onChange={(e) => setTranslation(e.target.value)} autoFocus />
        </Field>
        <Field label="Type" htmlFor="g-type">
          <Select id="g-type" value={type} onChange={(e) => setType(e.target.value as GlossaryType)}>
            {(['name', 'location', 'ability', 'organization', 'title', 'item', 'technique', 'idiom', 'honorific', 'term'] as const).map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox label="Lock this term" description="QA treats any other wording as a critical issue." checked={locked} onChange={(e) => setLocked(e.target.checked)} />
      </div>
    </Modal>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Maximize2, Minus, Plus } from 'lucide-react';
import { ComicPage, type PageView } from '@/components/demo/comic-page';
import { Inspector } from '@/components/app/editor/inspector';
import { TypesetPanel } from '@/components/app/editor/typeset-panel';
import { CompareView } from '@/components/app/editor/compare';
import { HistoryPanel, QaPanel } from '@/components/app/editor/side-panels';
import { ExportModal } from '@/components/app/editor/export-modal';
import { PageRail, buildThumbs } from '@/components/app/editor/page-rail';
import { DEMO_REGIONS } from '@/lib/data/chapter';
import type { DialogueRegion, TypesettingProperties } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const PAGE_THUMBS = buildThumbs(12);
const CANVAS_VIEWS: Array<{ id: PageView | 'compare'; label: string }> = [
  { id: 'original', label: 'Original' },
  { id: 'cleaned', label: 'Cleaned' },
  { id: 'typeset', label: 'Translated' },
  { id: 'compare', label: 'Compare' },
];
const RIGHT_TABS = [
  { id: 'translation', label: 'Translation' },
  { id: 'typeset', label: 'Typeset' },
  { id: 'qa', label: 'QA' },
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
  const [regions, setRegions] = React.useState<DialogueRegion[]>(DEMO_REGIONS);
  const ordered = React.useMemo(() => [...regions].sort((a, b) => a.readingOrder - b.readingOrder), [regions]);
  const [selectedId, setSelectedId] = React.useState(ordered[1].id);
  const [view, setView] = React.useState<PageView | 'compare'>('typeset');
  const [rightTab, setRightTab] = React.useState<RightTab>('translation');
  const [mobileTab, setMobileTab] = React.useState<MobileTab>('panel');
  const [zoom, setZoom] = React.useState(100);
  const [page, setPage] = React.useState('03');
  const [exportOpen, setExportOpen] = React.useState(false);

  const index = ordered.findIndex((r) => r.id === selectedId);
  const region = ordered[index] ?? ordered[0];
  const approved = regions.filter((r) => r.status === 'approved').length;

  const patch = React.useCallback(
    (id: string, next: Partial<DialogueRegion>) =>
      setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r))),
    [],
  );

  const step = React.useCallback(
    (delta: number) => {
      const target = ordered[(index + delta + ordered.length) % ordered.length];
      setSelectedId(target.id);
    },
    [index, ordered],
  );

  // Region-to-region navigation is the motion a translator repeats hundreds of
  // times a chapter, so it gets keyboard shortcuts.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'j' || e.key === 'ArrowDown') step(1);
      if (e.key === 'k' || e.key === 'ArrowUp') step(-1);
      if (e.key === 'a') patch(selectedId, { status: 'approved' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, patch, selectedId]);

  const canvas =
    view === 'compare' ? (
      <CompareView regions={regions} />
    ) : (
      <div className="mx-auto overflow-hidden rounded-md bg-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)]" style={{ maxWidth: `${zoom}%` }}>
        <ComicPage view={view} regions={regions} selectedRegionId={selectedId} onSelectRegion={setSelectedId} interactive />
      </div>
    );

  const rightPanel = (
    <>
      <div className="flex gap-0.5 border-b border-editor-line px-3 pt-3">
        {RIGHT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightTab(t.id)}
            aria-selected={rightTab === t.id}
            role="tab"
            className={cn(
              'rounded-t-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
              rightTab === t.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rightTab === 'translation' && (
          <Inspector
            region={region}
            index={index}
            total={ordered.length}
            onChange={(p) => patch(region.id, p)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onApprove={() => patch(region.id, { status: 'approved' })}
          />
        )}
        {rightTab === 'typeset' && (
          <TypesetPanel
            region={region}
            onChange={(p: Partial<TypesettingProperties>) => patch(region.id, { typesetting: { ...region.typesetting, ...p } })}
          />
        )}
        {rightTab === 'qa' && <QaPanel onSelectRegion={setSelectedId} />}
        {rightTab === 'history' && <HistoryPanel />}
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-editor-bg text-editor-text">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-editor-line px-4 py-2.5">
        <Link href="/projects/p-fallen-hero" className="flex items-center gap-1.5 text-[12.5px] text-editor-muted transition-colors hover:text-editor-text">
          <ArrowLeft size={14} />
          The Fallen Hero
        </Link>
        <span className="text-editor-line" aria-hidden>/</span>
        <span className="text-[12.5px] text-editor-text">Chapter 14</span>
        <span className="hidden text-[11.5px] text-editor-muted sm:inline">KO → EN</span>
        <span className="ml-auto text-[11.5px] tabular-nums text-editor-muted">
          {approved} / {regions.length} approved
        </span>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Download size={13} />
          Export
        </button>
      </header>

      {/* Mobile tabs */}
      <div className="flex gap-1 border-b border-editor-line px-3 py-2 lg:hidden">
        {MOBILE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            aria-selected={mobileTab === t.id}
            role="tab"
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors',
              mobileTab === t.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[120px_minmax(0,1fr)_340px]">
        {/* Pages */}
        <aside className={cn('min-h-0 overflow-y-auto border-r border-editor-line p-3', mobileTab === 'pages' ? 'block' : 'hidden lg:block')}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-editor-muted">Chapter 14</p>
          <PageRail thumbs={PAGE_THUMBS} current={page} onSelect={setPage} regions={regions} />
        </aside>

        {/* Canvas */}
        <section className={cn('min-h-0 overflow-y-auto border-r border-editor-line bg-editor-panel p-4', mobileTab === 'panel' ? 'block' : 'hidden lg:block')}>
          {canvas}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <CanvasBtn onClick={() => setZoom((z) => Math.max(40, z - 10))} label="Zoom out">
              <Minus size={12} />
            </CanvasBtn>
            <span className="min-w-[44px] text-center text-[11.5px] tabular-nums text-editor-muted">{zoom}%</span>
            <CanvasBtn onClick={() => setZoom((z) => Math.min(200, z + 10))} label="Zoom in">
              <Plus size={12} />
            </CanvasBtn>
            <CanvasBtn onClick={() => setZoom(100)} label="Fit to width">
              <Maximize2 size={12} />
            </CanvasBtn>
            <div className="mx-1 h-4 w-px bg-editor-line" aria-hidden />
            {CANVAS_VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                  view === v.id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-editor-muted">
            840 × 1180 px · j / k move between regions · a approves
          </p>
        </section>

        {/* Inspector */}
        <aside className={cn('flex min-h-0 flex-col', mobileTab === 'translation' ? 'flex' : 'hidden lg:flex')}>{rightPanel}</aside>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}

function CanvasBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-md border border-editor-line p-1.5 text-editor-muted transition-colors hover:text-editor-text"
    >
      {children}
    </button>
  );
}

'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useObjectUrl, useActiveWorkspace } from '@/lib/store/hooks';
import { getBlob } from '@/lib/store/repo';
import type { PageRecord } from '@/lib/store/schema';
import type { DialogueRegion } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

/**
 * Navigation uses small stored thumbnails, never the full-resolution pages, so
 * a long chapter doesn't pull every original into memory.
 */
export function PageRail({
  pages,
  drafts,
  current,
  onSelect,
  onMove,
  onDelete,
  onAddFiles,
  adding,
}: {
  pages: PageRecord[];
  drafts: Record<string, DialogueRegion[]>;
  current: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (page: PageRecord) => void;
  onAddFiles: (files: File[]) => void;
  adding: boolean;
}) {
  const workspace = useActiveWorkspace();
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1">
        {pages.map((p, i) => (
          <Thumb
            key={p.id}
            page={p}
            index={i}
            total={pages.length}
            regions={drafts[p.id] ?? p.regions}
            active={p.id === current}
            onSelect={() => onSelect(p.id)}
            onMove={(d) => onMove(p.id, d)}
            onDelete={() => onDelete(p)}
          />
        ))}
      </ul>
      {workspace.canEdit && <button
        onClick={() => input.current?.click()}
        disabled={adding}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-editor-line py-2 text-[11px] text-editor-muted transition-colors hover:border-editor-muted hover:text-editor-text disabled:opacity-50"
      >
        <Plus size={12} />
        {adding ? 'Adding…' : 'Add pages'}
      </button>}
      <input
        ref={input}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.pdf,.zip"
        className="sr-only"
        aria-label="Add pages to this chapter"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onAddFiles(files);
        }}
      />
    </div>
  );
}

function Thumb({
  page,
  index,
  total,
  regions,
  active,
  onSelect,
  onMove,
  onDelete,
}: {
  page: PageRecord;
  index: number;
  total: number;
  regions: DialogueRegion[];
  active: boolean;
  onSelect: () => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const workspace = useActiveWorkspace();
  const [blob, setBlob] = React.useState<Blob | undefined>();
  React.useEffect(() => {
    let alive = true;
    getBlob(workspace.id, page.thumbBlobId).then((b) => alive && setBlob(b));
    return () => {
      alive = false;
    };
  }, [workspace.id, page.thumbBlobId]);
  const url = useObjectUrl(blob);
  const translatable = regions.filter((r) => r.translate);
  const approved = translatable.filter((r) => r.status === 'approved').length;
  const done = translatable.length > 0 && approved === translatable.length;
  const label = String(index + 1).padStart(2, '0');

  return (
    <li className="group relative">
      <button
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        aria-label={`Page ${label}, ${approved} of ${translatable.length} regions approved`}
        className={cn(
          'relative block w-full overflow-hidden rounded-md border bg-white transition-colors',
          active ? 'border-accent ring-1 ring-accent/40' : 'border-editor-line hover:border-editor-muted',
        )}
        style={{ aspectRatio: `${page.width} / ${Math.min(page.height, page.width * 1.6)}` }}
      >
        {url ? <img src={url} alt="" className="h-full w-full object-cover object-top" /> : <span className="block h-full w-full skeleton" />}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-4">
          <span className={cn('text-[10px] font-semibold', active ? 'text-[#C3BEFF]' : 'text-white/85')}>{label}</span>
          <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', done ? 'bg-ok' : approved > 0 ? 'bg-warn' : 'bg-white/35')} />
        </span>
      </button>
      {workspace.canEdit && <div className="absolute right-1 top-1 hidden gap-0.5 group-focus-within:flex group-hover:flex">
        <RailBtn label={`Move page ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp size={10} />
        </RailBtn>
        <RailBtn label={`Move page ${label} down`} disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown size={10} />
        </RailBtn>
        <RailBtn label={`Delete page ${label}`} onClick={onDelete}>
          <Trash2 size={10} />
        </RailBtn>
      </div>}
    </li>
  );
}

function RailBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="rounded bg-black/70 p-1 text-white transition-colors hover:bg-black disabled:opacity-30">
      {children}
    </button>
  );
}

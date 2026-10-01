'use client';

import * as React from 'react';
import { FileStack, GripVertical, Upload, X } from 'lucide-react';
import { Button, ErrorState, StatusBadge } from '@/components/ui';
import { validateFiles } from '@/lib/imaging/ingest';
import { extensionOf, naturalCompare } from '@/lib/imaging/sort';
import { formatBytes } from '@/lib/download';
import { cn } from '@/lib/utils';

const ACCEPTED_LABEL = 'PNG · JPG · WEBP · PDF · ZIP';

export interface UploadItem {
  id: string;
  file: File;
}

function describe(file: File) {
  const ext = extensionOf(file.name);
  if (ext === 'zip') return 'ZIP archive · pages counted on upload';
  if (ext === 'pdf') return 'PDF · pages counted on upload';
  return '1 page';
}

/** Filenames usually encode page order, so new files are sorted numerically. */
export function UploadZone({ items, onChange }: { items: UploadItem[]; onChange: (items: UploadItem[]) => void }) {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function accept(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const problems = validateFiles(incoming);
    setError(problems.length ? problems.map((p) => p.reason).join(' ') : null);
    const bad = new Set(problems.map((p) => p.file));
    const added = incoming
      .filter((f) => !bad.has(f.name))
      .sort((a, b) => naturalCompare(a.name, b.name))
      .map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`, file }));
    onChange([...items, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl2 border-2 border-dashed px-6 py-16 text-center transition-colors',
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
        )}
      >
        <Upload size={22} className="mx-auto text-accent" aria-hidden />
        <p className="mt-4 text-[17px] font-medium">Drop your chapter here</p>
        <p className="mt-1.5 text-[13px] text-ink-muted">Supported: {ACCEPTED_LABEL}</p>
        <Button variant="secondary" className="mt-5" onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.pdf,.zip,image/png,image/jpeg,image/webp,application/pdf,application/zip"
          className="sr-only"
          onChange={(e) => accept(e.target.files)}
          aria-label="Choose chapter files"
          data-testid="chapter-file-input"
        />
      </div>

      {error && <ErrorState title="Some files can’t be uploaded" detail={error} onAction={() => setError(null)} actionLabel="Dismiss" />}

      {items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical size={14} className="shrink-0 text-ink-faint" aria-hidden />
              <FileStack size={16} className="shrink-0 text-ink-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{item.file.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {describe(item.file)} · {formatBytes(item.file.size)}
                </p>
              </div>
              <StatusBadge tone="ok" label="Ready" />
              <div className="flex shrink-0 gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-[11px] text-ink-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Move ${item.file.name} earlier`}>
                  ↑
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1 text-[11px] text-ink-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Move ${item.file.name} later`}>
                  ↓
                </button>
                <button onClick={() => onChange(items.filter((x) => x.id !== item.id))} className="rounded p-1 text-ink-muted hover:bg-ink/5" aria-label={`Remove ${item.file.name}`}>
                  <X size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

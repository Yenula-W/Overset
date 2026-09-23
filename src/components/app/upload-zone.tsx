'use client';

import * as React from 'react';
import { FileStack, GripVertical, Upload, X } from 'lucide-react';
import { Button, ErrorState, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/utils';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];
const ACCEPTED_LABEL = 'PNG · JPG · WEBP · PDF · ZIP';
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export interface UploadedFile {
  id: string;
  name: string;
  sizeLabel: string;
  pageCount: number;
}

/** Filenames usually encode page order, so sort numerically rather than
 *  lexically — otherwise page 10 lands before page 2. */
export function sortByFilename(names: string[]): string[] {
  return [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function UploadZone({
  files,
  onFilesChange,
}: {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function accept(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);

    const wrongType = incoming.find((f) => f.type && !ACCEPTED.includes(f.type));
    if (wrongType) {
      setError(`“${wrongType.name}” isn’t a supported file type. Overset accepts ${ACCEPTED_LABEL}.`);
      return;
    }
    const tooLarge = incoming.find((f) => f.size > MAX_BYTES);
    if (tooLarge) {
      setError(`“${tooLarge.name}” is ${formatBytes(tooLarge.size)}, over the 2 GB limit for a single upload.`);
      return;
    }

    setError(null);
    const sorted = sortByFilename(incoming.map((f) => f.name));
    const added: UploadedFile[] = sorted.map((name, i) => {
      const file = incoming.find((f) => f.name === name)!;
      const isArchive = /\.(zip|pdf)$/i.test(name);
      return {
        id: `${name}-${i}`,
        name,
        sizeLabel: formatBytes(file.size),
        pageCount: isArchive ? 46 : 1,
      };
    });
    onFilesChange([...files, ...added]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    onFilesChange(next);
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
          accept=".png,.jpg,.jpeg,.webp,.pdf,.zip"
          className="sr-only"
          onChange={(e) => accept(e.target.files)}
          aria-label="Choose chapter files"
        />
      </div>

      {error && <ErrorState title="That file can’t be uploaded" detail={error} onAction={() => setError(null)} actionLabel="Dismiss" />}

      {files.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical size={14} className="shrink-0 text-ink-faint" aria-hidden />
              <FileStack size={16} className="shrink-0 text-ink-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{f.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {f.pageCount} {f.pageCount === 1 ? 'page' : 'pages'} · {f.sizeLabel}
                </p>
              </div>
              <StatusBadge tone="ok" label="Ready" />
              <div className="flex shrink-0 gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-[11px] text-ink-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Move ${f.name} earlier`}>
                  ↑
                </button>
                <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="rounded p-1 text-[11px] text-ink-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Move ${f.name} later`}>
                  ↓
                </button>
                <button onClick={() => onFilesChange(files.filter((x) => x.id !== f.id))} className="rounded p-1 text-ink-muted hover:bg-ink/5" aria-label={`Remove ${f.name}`}>
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

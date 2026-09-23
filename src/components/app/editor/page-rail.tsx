'use client';

import * as React from 'react';
import { ComicPage } from '@/components/demo/comic-page';
import { DEMO_REGIONS } from '@/lib/data/chapter';
import type { DialogueRegion } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

export interface PageThumb {
  id: string;
  label: string;
  approved: number;
  total: number;
}

export function buildThumbs(count: number): PageThumb[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1).padStart(2, '0'),
    label: String(i + 1).padStart(2, '0'),
    approved: i < 6 ? 7 : i < 9 ? 4 : 0,
    total: 7,
  }));
}

/**
 * Thumbnails render the page at a small size rather than loading the
 * full-resolution image — navigation should never pull a whole chapter of
 * full-size artwork into memory.
 */
export function PageRail({
  thumbs,
  current,
  onSelect,
  regions = DEMO_REGIONS,
  className,
}: {
  thumbs: PageThumb[];
  current: string;
  onSelect: (id: string) => void;
  regions?: DialogueRegion[];
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-3 gap-2 lg:grid-cols-1', className)}>
      {thumbs.map((t) => {
        const active = t.id === current;
        const done = t.approved === t.total;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            aria-current={active ? 'true' : undefined}
            aria-label={`Page ${t.label}, ${t.approved} of ${t.total} regions approved`}
            className={cn(
              'group relative overflow-hidden rounded-md border transition-colors',
              active ? 'border-accent ring-1 ring-accent/40' : 'border-editor-line hover:border-editor-muted',
            )}
          >
            <div className="pointer-events-none bg-white">
              <ComicPage view="typeset" regions={regions} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-4">
              <span className={cn('text-[10px] font-semibold', active ? 'text-[#C3BEFF]' : 'text-white/85')}>{t.label}</span>
              <span
                aria-hidden
                className={cn('h-1.5 w-1.5 rounded-full', done ? 'bg-ok' : t.approved > 0 ? 'bg-warn' : 'bg-white/35')}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

/** Accessible tab list — arrow keys move between tabs, as WAI-ARIA expects. */
export function Tabs({
  items,
  value,
  onChange,
  className,
  tone = 'light',
  size = 'md',
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const last = items.length - 1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'ArrowRight' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl p-1',
        tone === 'light' ? 'border border-line bg-surface' : 'border border-editor-line bg-editor-panel',
        className,
      )}
    >
      {items.map((item, i) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(item.id)}
            className={cn(
              'rounded-lg font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
              active
                ? tone === 'light'
                  ? 'bg-ink text-canvas'
                  : 'bg-editor-raised text-editor-text'
                : tone === 'light'
                  ? 'text-ink-muted hover:text-ink'
                  : 'text-editor-muted hover:text-editor-text',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, active, children, className }: { id: string; active: boolean; children: React.ReactNode; className?: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}

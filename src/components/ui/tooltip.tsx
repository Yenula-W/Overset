'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tooltip({ label, children, side = 'top' }: { label: string; children: React.ReactNode; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 animate-fade-in whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-canvas shadow-card',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { e.preventDefault(); panelRef.current?.focus(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-fade-up rounded-t-2xl border border-line bg-surface text-ink shadow-lift outline-none sm:rounded-xl2',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="-mr-1 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

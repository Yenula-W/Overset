import * as React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl2 border border-dashed border-line bg-surface/60 px-6 py-14 text-center', className)}>
      {icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">{icon}</div>}
      <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Errors name the thing that failed and what to do next. "Something went
 * wrong" tells a translator nothing about their chapter.
 */
export function ErrorState({
  title,
  detail,
  actionLabel = 'Retry',
  onAction,
  className,
}: {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-danger/25 bg-dangerSoft px-4 py-3.5', className)} role="alert">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{detail}</p>
      </div>
      {onAction && (
        <Button size="sm" variant="secondary" onClick={onAction} className="shrink-0">
          <RotateCw size={13} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

/** Tells the user which AI stage is running, never just that "it's loading". */
export function LoadingState({ steps, activeIndex, className }: { steps: string[]; activeIndex: number; className?: string }) {
  return (
    <ul className={cn('space-y-2', className)} aria-live="polite">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step} className="flex items-center gap-2.5 text-[13px]">
            <span
              aria-hidden
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                done ? 'border-ok bg-ok text-white' : active ? 'border-accent text-accent' : 'border-line text-transparent',
              )}
            >
              {done ? '✓' : active ? '●' : '○'}
            </span>
            <span className={cn(done ? 'text-ink-muted' : active ? 'font-medium text-ink' : 'text-ink-faint')}>{step}</span>
          </li>
        );
      })}
    </ul>
  );
}

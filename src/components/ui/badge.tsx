import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/[0.05] text-ink-muted border-transparent',
  accent: 'bg-accent-soft text-accent-strong border-transparent',
  ok: 'bg-okSoft text-ok border-transparent',
  warn: 'bg-warnSoft text-warn border-transparent',
  danger: 'bg-dangerSoft text-danger border-transparent',
  dark: 'bg-ink text-canvas border-transparent',
};

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Status never relies on color alone — a dot shape plus a label carries the
 * meaning for anyone who cannot distinguish the tones.
 */
export function StatusBadge({ tone = 'neutral', label, className }: { tone?: Tone; label: string; className?: string }) {
  const dot: Record<Tone, string> = {
    neutral: 'bg-ink-faint',
    accent: 'bg-accent',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    dark: 'bg-ink',
  };
  return (
    <Badge tone={tone} className={className}>
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot[tone])} />
      {label}
    </Badge>
  );
}

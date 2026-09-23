import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  lede,
  actions,
  className,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{title}</h1>
        {lede && <p className="mt-1.5 text-[14.5px] text-ink-muted">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AppShellPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10', className)}>{children}</div>;
}

import * as React from 'react';
import { cn } from '@/lib/utils';

export function AuthCard({
  title,
  lede,
  children,
  footer,
  className,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full max-w-[420px]', className)}>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
      {lede && <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{lede}</p>}
      <div className="mt-7 rounded-xl2 border border-line bg-surface p-6">{children}</div>
      {footer && <div className="mt-5 text-center text-[13.5px] text-ink-muted">{footer}</div>}
    </div>
  );
}

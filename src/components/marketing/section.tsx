import * as React from 'react';
import { cn } from '@/lib/utils';

export function Section({
  eyebrow,
  title,
  lede,
  children,
  className,
  id,
  align = 'left',
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  align?: 'left' | 'center';
}) {
  return (
    <section id={id} className={cn('pb-10 pt-[100px]', className)}>
      <div className="mk-shell">
        {(eyebrow || title || lede) && (
          <div className={cn('max-w-[720px]', align === 'center' && 'mx-auto text-center')}>
            {eyebrow && <p className="mk-eyebrow m-0 uppercase">{eyebrow}</p>}
            {title && <h2 className="mk-h2 mt-3.5">{title}</h2>}
            {lede && <p className="mt-5 text-pretty text-[16px] leading-[1.55] text-ink-muted">{lede}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={cn('animate-fade-up', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

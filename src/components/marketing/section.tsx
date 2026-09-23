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
    <section id={id} className={cn('py-20 sm:py-28', className)}>
      <div className="shell">
        {(eyebrow || title || lede) && (
          <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="mt-3 text-section font-semibold text-balance">{title}</h2>}
            {lede && <p className="lede mt-5 text-pretty">{lede}</p>}
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

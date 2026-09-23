import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * A panel frame with a line of text running past its edge — the overset
 * condition the product exists to resolve.
 */
export function OversetMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.1" y="3.6" width="14.6" height="16.8" rx="2.4" stroke="currentColor" strokeWidth="1.7" opacity="0.45" />
      <rect x="5.3" y="7.6" width="8.4" height="1.9" rx="0.95" fill="currentColor" opacity="0.45" />
      <rect x="5.3" y="11.1" width="16.6" height="1.9" rx="0.95" fill="currentColor" />
      <rect x="5.3" y="14.6" width="6.2" height="1.9" rx="0.95" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function Logo({ className, href = '/', tone = 'ink' }: { className?: string; href?: string; tone?: 'ink' | 'light' }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]', tone === 'ink' ? 'text-ink' : 'text-editor-text', className)}
      aria-label="Overset home"
    >
      <OversetMark className={tone === 'ink' ? 'text-accent' : 'text-accent'} />
      Overset
    </Link>
  );
}

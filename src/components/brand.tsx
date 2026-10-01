import Link from 'next/link';
import { cn } from '@/lib/utils';

/** An O-shaped dialogue frame, with a violet panel breaking its corner. */
export function OversetMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/overset-mark.svg" width={size} height={size} className={cn('shrink-0', className)} alt="" aria-hidden />
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

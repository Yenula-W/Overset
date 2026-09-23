import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Two overlapping panels with a speech bubble cut into the front one. */
export function PanelFlowMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="1.4" y="3.6" width="13.4" height="13.4" rx="2.6" stroke="currentColor" strokeWidth="1.7" opacity="0.4" />
      <path
        d="M9.2 7h11.4a2 2 0 0 1 2 2v7.6a2 2 0 0 1-2 2h-6.1l-3.1 2.8v-2.8H9.2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({ className, href = '/', tone = 'ink' }: { className?: string; href?: string; tone?: 'ink' | 'light' }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]', tone === 'ink' ? 'text-ink' : 'text-editor-text', className)}
      aria-label="PanelFlow home"
    >
      <PanelFlowMark className={tone === 'ink' ? 'text-accent' : 'text-accent'} />
      PanelFlow
    </Link>
  );
}

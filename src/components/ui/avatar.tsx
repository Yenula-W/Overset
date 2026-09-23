import { cn, initials } from '@/lib/utils';

export function Avatar({ name, color, size = 28, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, background: color ?? '#6C63E8', fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

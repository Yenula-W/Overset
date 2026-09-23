import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
  tone = 'accent',
  label,
}: {
  value: number;
  className?: string;
  tone?: 'accent' | 'ink' | 'ok' | 'warn';
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const bar = { accent: 'bg-accent', ink: 'bg-ink', ok: 'bg-ok', warn: 'bg-warn' }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', bar)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong active:bg-accent-strong shadow-[0_1px_2px_rgba(22,22,22,0.10)]',
  secondary: 'bg-surface text-ink border border-line hover:border-ink/25 hover:bg-white',
  ghost: 'text-ink-muted hover:text-ink hover:bg-ink/[0.045]',
  outline: 'border border-ink/15 text-ink hover:border-ink/35',
  danger: 'bg-danger text-white hover:brightness-95',
  dark: 'bg-ink text-canvas hover:bg-ink/90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[14px] gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

const base =
  'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', href, loading, children, disabled, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70"
    />
  );
}

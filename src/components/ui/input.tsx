'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint transition-colors hover:border-ink/20 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(field, 'h-10', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(field, 'min-h-[88px] resize-y leading-relaxed', className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(field, 'h-10 pr-8', className)} {...props} />;
  },
);

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line text-accent accent-accent focus:ring-2 focus:ring-accent/25"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer text-[13px] leading-5 text-ink">
        {label}
        {description && <span className="block text-[12px] text-ink-muted">{description}</span>}
      </label>
    </div>
  );
}

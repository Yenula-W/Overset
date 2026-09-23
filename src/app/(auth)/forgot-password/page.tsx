'use client';

import * as React from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { fieldErrors, resetSchema } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [sent, setSent] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = resetSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      lede={sent ? undefined : 'We’ll email you a link to set a new one.'}
      footer={
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-[14px] leading-relaxed text-ink-muted">
          If an account exists for that address, a reset link is on its way. The link expires in one hour.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

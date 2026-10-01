'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { passwordSchema } from '@/lib/auth';
import { AuthError, setNewPassword } from '@/lib/store/auth';
import { useSession } from '@/lib/store/hooks';

/** Where a reset link lands, already signed in by /auth/callback. */
export default function ResetPasswordPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = String(form.get('new') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) return setErrors({ new: parsed.error.issues[0]?.message ?? 'Choose a stronger password.' });
    if (next !== confirm) return setErrors({ confirm: 'The passwords don’t match.' });
    setErrors({});
    setBusy(true);
    try {
      await setNewPassword(next);
      router.replace('/dashboard');
    } catch (err) {
      setBusy(false);
      setErrors({ [err instanceof AuthError ? (err.field === 'password' ? 'new' : 'form') : 'form']: err instanceof Error ? err.message : 'That didn’t work.' });
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Back to log in
        </Link>
      }
    >
      {loading ? null : !user ? (
        <p className="text-[14px] leading-relaxed text-ink-muted">
          This reset link has expired or was already used.{' '}
          <Link href="/forgot-password" className="font-medium text-ink underline underline-offset-2">
            Send a new one
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {errors.form && (
            <p role="alert" className="rounded-lg bg-dangerSoft px-3.5 py-3 text-[13px] text-danger">
              {errors.form}
            </p>
          )}
          <Field label="New password" htmlFor="new" error={errors.new}>
            <Input id="new" name="new" type="password" autoComplete="new-password" aria-invalid={!!errors.new} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

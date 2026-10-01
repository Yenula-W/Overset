'use client';

import * as React from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { AuthError, cloudEnabled, requestPasswordReset } from '@/lib/store/auth';

/**
 * With cloud accounts, Supabase emails a reset link that opens /reset-password.
 * Accounts kept only in this browser have no inbox to send to, so the page says
 * so plainly rather than pretending to send a link that never arrives.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      footer={
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Back to log in
        </Link>
      }
    >
      {cloudEnabled ? <ResetRequestForm /> : <LocalOnlyNotice />}
    </AuthCard>
  );
}

function ResetRequestForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (err) {
      setError(err instanceof AuthError || err instanceof Error ? err.message : 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <p role="status" className="rounded-lg bg-accent-soft px-3.5 py-3 text-[14px] leading-relaxed text-ink">
        If there’s an account for {sentTo}, a reset link is on its way. It expires in an hour.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-[14px] leading-relaxed text-ink-muted">Enter the email you signed up with and we’ll send you a link to choose a new password.</p>
      <Field label="Email" htmlFor="email" error={error ?? undefined}>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!error} />
      </Field>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}

function LocalOnlyNotice() {
  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-ink-muted">
      <p>
        Your account is stored in this browser, so there’s no inbox we can send a reset link to.
      </p>
      <p>
        If you’re signed in on this device, you can change your password any time from{' '}
        <Link href="/settings" className="font-medium text-ink underline underline-offset-2">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}

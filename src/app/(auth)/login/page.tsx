'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { fieldErrors, loginSchema, writeSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    writeSession({ name: 'Yenula', email: parsed.data.email, onboardingComplete: true });
    router.push('/dashboard');
  }

  return (
    <AuthCard
      title="Log in"
      lede="Pick up where you left off."
      footer={
        <>
          New to Overset?{' '}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-ink-muted transition-colors hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}

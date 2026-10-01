'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { fieldErrors, loginSchema } from '@/lib/auth';
import { AuthError, logIn } from '@/lib/store/auth';
import { RedirectIfSignedIn, safeNext } from '@/lib/store/hooks';

export default function LoginPage() {
  return (
    <RedirectIfSignedIn>
      <LoginForm />
    </RedirectIfSignedIn>
  );
}

function LoginForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  // Email links that couldn't be completed come back here with the reason.
  React.useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error) setErrors({ form: error });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const user = await logIn(parsed.data);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(user.onboardingComplete ? safeNext(next) : '/onboarding');
    } catch (err) {
      setBusy(false);
      setErrors({ [err instanceof AuthError ? (err.field ?? 'form') : 'form']: err instanceof Error ? err.message : 'Login failed.' });
    }
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
        {errors.form && (
          <p role="alert" className="rounded-lg bg-dangerSoft px-3.5 py-3 text-[13px] text-danger">
            {errors.form}
          </p>
        )}
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

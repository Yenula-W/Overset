'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { Button, Field, Input } from '@/components/ui';
import { fieldErrors, signupSchema } from '@/lib/auth';
import { AuthError, signUp } from '@/lib/store/auth';
import { RedirectIfSignedIn } from '@/lib/store/hooks';
import { requestPersistence } from '@/lib/store/db';

export default function SignupPage() {
  return (
    <RedirectIfSignedIn>
      <SignupForm />
    </RedirectIfSignedIn>
  );
}

function SignupForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [requestedPlan, setRequestedPlan] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRequestedPlan(new URLSearchParams(window.location.search).get('plan'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await signUp(parsed.data);
      void requestPersistence();
      router.replace('/onboarding');
    } catch (err) {
      setBusy(false);
      if (err instanceof AuthError && err.tone === 'notice') setNotice(err.message);
      else if (err instanceof AuthError) setErrors({ [err.field ?? 'form']: err.message });
      else setErrors({ form: 'Your account couldn’t be created because this browser blocked storage. Turn off private browsing and try again.' });
    }
  }

  return (
    <AuthCard
      title="Create your account"
      lede="30 pages free. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {requestedPlan && requestedPlan !== 'free' && (
          <p className="rounded-lg bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
            Paid plans need billing, which isn’t connected yet. You’ll start on Free and can switch once payments are live.
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink">
            {notice}
          </p>
        )}
        {errors.form && (
          <p role="alert" className="rounded-lg bg-dangerSoft px-3.5 py-3 text-[13px] text-danger">
            {errors.form}
          </p>
        )}
        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 10 characters, including a number." error={errors.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-ink-faint">
          By creating an account you confirm you will only upload material you own or are authorized to translate.
          Your account and files are stored in this browser.
        </p>
      </form>
    </AuthCard>
  );
}

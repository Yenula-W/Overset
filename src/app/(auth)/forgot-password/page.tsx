import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

/**
 * A reset link has to be delivered to an inbox, which needs an email service.
 * Until one is connected this page says so plainly rather than pretending to
 * send a link that never arrives.
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
      <div className="space-y-3 text-[14px] leading-relaxed text-ink-muted">
        <p>
          Password reset emails need an email service, and Overset doesn’t have one connected yet — so there’s no link
          we can send you right now.
        </p>
        <p>
          If you’re signed in on this device, you can change your password any time from{' '}
          <Link href="/settings" className="font-medium text-ink underline underline-offset-2">
            Settings
          </Link>
          .
        </p>
      </div>
    </AuthCard>
  );
}

import Link from 'next/link';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="shell flex h-16 items-center">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em]">That page isn’t here.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            The link may be out of date, or the project may have been deleted. Your chapters are unaffected.
          </p>
          <div className="mt-7 flex justify-center gap-2">
            <Button href="/dashboard">Go to dashboard</Button>
            <Button href="/" variant="secondary">
              Back to site
            </Button>
          </div>
          <p className="mt-6 text-[13px] text-ink-faint">
            Looking for something specific?{' '}
            <Link href="/help" className="underline underline-offset-2">
              Help
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

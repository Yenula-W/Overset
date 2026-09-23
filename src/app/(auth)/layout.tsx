import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="shell flex h-16 items-center justify-between">
        <Logo />
        <Link href="/" className="text-[13.5px] text-ink-muted transition-colors hover:text-ink">
          Back to site
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-5 py-12">
        {children}
      </main>
    </div>
  );
}

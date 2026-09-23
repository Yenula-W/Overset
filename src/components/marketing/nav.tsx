'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/teams', label: 'For Teams' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'border-b border-line bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="shell flex h-16 items-center justify-between" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-[14px] text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-[14px] text-ink-muted transition-colors hover:text-ink">
            Log in
          </Link>
          <Button href="/signup" size="sm">
            Translate for free
          </Button>
        </div>

        <button
          className="-mr-2 rounded-lg p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="animate-fade-in border-t border-line bg-canvas md:hidden">
          <div className="shell flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-[15px] text-ink">
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
              <Button href="/login" variant="secondary" size="lg">
                Log in
              </Button>
              <Button href="/signup" size="lg">
                Translate for free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

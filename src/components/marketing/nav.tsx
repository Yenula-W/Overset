'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { OversetMark } from '@/components/brand';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from './mk';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-mk-page">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 text-ink hover:text-ink" aria-label="Overset home">
          <OversetMark size={24} className="text-accent" />
          <span className="text-[15px] font-extrabold tracking-[0.06em]">OVERSET</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn('text-[14px] text-ink hover:text-accent', active && 'underline underline-offset-[6px]')}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-[18px] md:flex">
          <Link href="/login" className="text-[14px] text-ink-muted hover:text-accent">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-ink px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent hover:text-white"
          >
            Translate free
          </Link>
        </div>

        <button
          className="-mr-2 p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-b border-line bg-mk-page md:hidden">
          <div className="flex flex-col px-4 pb-5 pt-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                className="border-b border-line py-3.5 text-[17px] font-semibold text-ink"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-5 flex gap-2">
              <Link href="/login" className="flex-1 border border-mk-input bg-white py-3 text-center text-[15px] text-ink">
                Log in
              </Link>
              <Link href="/signup" className="flex-1 bg-ink py-3 text-center text-[15px] font-medium text-white hover:text-white">
                Translate free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

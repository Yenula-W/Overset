import Link from 'next/link';
import { NAV_LINKS } from './mk';

export function MarketingFooter() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start justify-between gap-8 px-4 py-12 sm:px-8">
        <div className="flex max-w-[320px] flex-col gap-2.5">
          <span className="text-[15px] font-extrabold tracking-[0.06em]">OVERSET</span>
          <span className="text-[13px] leading-[1.5] text-ink-muted">
            AI localization workspace for manhwa, webtoons, manga, and comics.
          </span>
        </div>
        <nav className="flex flex-wrap gap-7" aria-label="Footer">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-ink-muted hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="text-[12px] text-ink-faint">© 2026 Overset</span>
          {/* Legal pages stay reachable from every marketing page. */}
          <span className="flex gap-4 text-[12px]">
            <Link href="/privacy" className="text-ink-faint hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-ink-faint hover:text-ink">
              Terms
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

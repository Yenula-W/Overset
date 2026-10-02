import Link from "next/link";
import { OversetMark } from "@/components/brand";
import { NAV_LINKS } from "./mk";

export function MarketingFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-[#eeede8]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start justify-between gap-8 px-4 pb-5 pt-10 sm:px-8">
        <div className="flex max-w-[320px] flex-col gap-2.5">
          <span className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-[0.06em]">
            <OversetMark size={28} />
            OVERSET
          </span>
          <span className="text-[13px] leading-[1.5] text-ink-muted">
            Comic localization, in one workspace.
          </span>
        </div>
        <nav className="flex flex-wrap gap-7" aria-label="Footer">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] text-ink-muted hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="text-[12px] text-ink-faint">© 2026 Overset</span>
          <span className="text-[12px] text-ink-faint">
            Some motion adapted from{" "}
            <a href="https://skiper-ui.com" className="text-ink-faint underline-offset-2 hover:text-ink hover:underline">
              Skiper UI
            </a>
          </span>
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
      <div className="footer-wordmark mk-shell" aria-hidden>
        overset<span className="footer-period">.</span>
      </div>
    </footer>
  );
}

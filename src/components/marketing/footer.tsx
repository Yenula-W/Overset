import Link from 'next/link';
import { Logo } from '@/components/brand';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/teams', label: 'Teams' },
      { href: '/teams#api', label: 'API' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/help', label: 'Help' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy#ownership', label: 'Content ownership' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="hairline mt-24 bg-canvas">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-[22ch] text-[13px] leading-relaxed text-ink-muted">
            Translate the story. Preserve the panel.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hairline">
        <div className="shell flex flex-col gap-1 py-6 text-[13px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PanelFlow AI</p>
          <p>Built for translators, creators, and localization teams.</p>
        </div>
      </div>
    </footer>
  );
}

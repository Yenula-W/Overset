import type { Metadata } from 'next';
import { PricingTable } from '@/components/marketing/pricing-table';
import { FinalCta } from '@/components/marketing/sections';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'PanelFlow plans for individual translators, creators, teams, and publishers.',
};

const FAQ = [
  ['What counts as a page?', 'One image, or one page of a PDF. Re-running translation on a page you already processed this cycle does not count again.'],
  ['What happens when I run out of pages?', 'Processing pauses rather than failing silently. You can buy additional pages or upgrade, and anything already translated stays exactly as it is.'],
  ['Can I change plans mid-cycle?', 'Yes. Allowances are prorated and your projects, glossaries, and translation memory are unaffected.'],
  ['Do you keep my chapters?', 'Your uploads stay private to your account and the people you invite, and you can delete them at any time.'],
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-section font-semibold text-balance">
            Translate more.
            <br className="hidden sm:block" /> Spend less time translating.
          </h1>
          <PricingTable />
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="shell">
          <h2 className="text-sub font-semibold">Questions</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {FAQ.map(([q, a]) => (
              <div key={q}>
                <dt className="text-[15px] font-medium">{q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-ink-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

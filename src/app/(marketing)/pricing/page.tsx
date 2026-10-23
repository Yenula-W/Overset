import type { Metadata } from 'next';
import { PricingHeader } from '@/components/marketing/pricing-table';
import { FaqSection, PRICING_FAQ } from '@/components/marketing/faq';
import { FinalCta } from '@/components/marketing/home-sections';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pay by the page. Every Overset plan includes OCR, translation, cleaning, and typesetting.',
};

export default function PricingPage() {
  return (
    <>
      <section className="mk-shell pb-10 pt-14">
        <PricingHeader />
      </section>
      <FaqSection
        items={PRICING_FAQ}
        eyebrow="Billing"
        title="Before you pay."
        intro="Plain answers about pages, plans and top-ups."
        headingId="pricing-faq-title"
      />
      <FinalCta />
    </>
  );
}

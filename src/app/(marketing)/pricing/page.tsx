import type { Metadata } from 'next';
import { PricingHeader } from '@/components/marketing/pricing-table';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pay by the page. Every Overset plan includes OCR, translation, cleaning, and typesetting.',
};

export default function PricingPage() {
  return (
    <section className="mk-shell pb-10 pt-14">
      <PricingHeader />
    </section>
  );
}

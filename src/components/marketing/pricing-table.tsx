'use client';

import * as React from 'react';
import Link from 'next/link';
import { CREDIT_PACKS, PLANS } from '@/lib/billing';
import { cn } from '@/lib/utils';
import { Segmented } from './mk';

type Billing = 'monthly' | 'yearly';

export function PricingHeader() {
  const [billing, setBilling] = React.useState<Billing>('monthly');
  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-14 gap-y-6">
        <h1 className="mk-display" style={{ flex: '1 1 480px' }}>
          Pay by
          <br />
          the page.
        </h1>
        <div className="flex max-w-[460px] flex-col gap-4" style={{ flex: '1 1 340px' }}>
          <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">
            Start with 30 free pages a month. Every plan includes OCR, translation, cleaning, and typesetting.
          </p>
          <Segmented
            label="Billing interval"
            size="md"
            value={billing}
            onChange={setBilling}
            items={[
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly · 2 months free' },
            ]}
          />
        </div>
      </div>
      <PlanGrid billing={billing} />
    </>
  );
}

function PlanGrid({ billing }: { billing: Billing }) {
  const pack = CREDIT_PACKS[0];
  return (
    <>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {PLANS.map((plan) => {
          const hl = Boolean(plan.highlighted);
          // Publisher is quoted per organization, so it always shows its monthly floor.
          const custom = plan.id === 'publisher';
          const price = custom ? plan.priceLabel ?? `$${plan.priceMonthly}` : `$${billing === 'monthly' ? plan.priceMonthly : plan.priceYearly}`;
          const per = custom || billing === 'monthly' ? '/month' : '/year';
          const href = custom ? '/contact' : plan.href;
          return (
            <div
              key={plan.id}
              className={cn('flex flex-col gap-[18px] border p-6', hl ? 'border-editor-line bg-ink text-white' : 'border-line bg-white text-ink')}
            >
              <div className="flex min-h-6 items-center justify-between">
                <span className="text-[15px] font-bold uppercase tracking-[0.04em]">{plan.name}</span>
                {plan.badge && <span className="bg-accent px-2 py-1 text-[11px] font-semibold text-white">{plan.badge}</span>}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[40px] font-extrabold tracking-[-0.03em]">{price}</span>
                {plan.priceMonthly > 0 && <span className={cn('text-[13px]', hl ? 'text-[#B8B8C4]' : 'text-ink-muted')}>{per}</span>}
              </div>
              <p className={cn('m-0 min-h-[42px] text-[14px] leading-[1.5]', hl ? 'text-[#B8B8C4]' : 'text-ink-muted')}>{plan.tagline}</p>
              <Link
                href={href}
                className={cn(
                  'py-3 text-center text-[14px] font-medium text-white transition-colors hover:text-white',
                  hl ? 'bg-accent hover:bg-accent-strong' : 'bg-ink hover:bg-accent',
                )}
              >
                {plan.cta}
              </Link>
              <ul className={cn('m-0 flex list-none flex-col gap-2.5 border-t p-0 pt-4', hl ? 'border-editor-line' : 'border-line')}>
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13.5px]">
                    <span className="text-accent" aria-hidden>
                      —
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-line bg-white px-6 py-5">
        <span className="text-[15px]">
          <strong>Need a few more pages?</strong>{' '}
          <span className="text-ink-muted">
            Top up with {pack.pages} pages for ${pack.priceUsd} on any plan.
          </span>
        </span>
        <Link href="/contact" className="text-[14px] text-ink underline underline-offset-4 hover:text-accent">
          Questions about volume? Talk to us
        </Link>
      </div>
    </>
  );
}

'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CREDIT_PACKS, PLANS } from '@/lib/billing';
import { cn } from '@/lib/utils';

export function PricingTable() {
  const [interval, setInterval] = React.useState<'month' | 'year'>('month');

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label="Billing interval">
          {(['month', 'year'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              aria-pressed={interval === i}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors',
                interval === i ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink',
              )}
            >
              {i === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[12.5px] text-ink-faint">Yearly billing includes two months at no additional cost.</p>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLANS.map((plan) => {
          const price = interval === 'month' ? plan.priceMonthly : plan.priceYearly;
          const suffix = interval === 'month' ? '/month' : '/year';
          return (
            <div
              key={plan.id}
              className={cn(
                // The pricing page centers its heading block, so cards opt back
                // out explicitly rather than inheriting centered body text.
                'flex flex-col rounded-xl2 border bg-surface p-6 text-left',
                plan.highlighted ? 'border-accent shadow-card ring-1 ring-accent/20' : 'border-line',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-semibold">{plan.name}</h3>
                {plan.badge && <Badge tone="accent">{plan.badge}</Badge>}
              </div>
              <p className="mt-1.5 text-[13px] text-ink-muted">{plan.tagline}</p>
              <p className="mt-6">
                <span className="text-[38px] font-semibold tracking-[-0.035em]">
                  {plan.priceLabel && interval === 'month' ? plan.priceLabel : `$${price}`}
                </span>
                {price > 0 && <span className="ml-1 text-[14px] text-ink-muted">{suffix}</span>}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <span className="text-ink-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <Button href={plan.href} variant={plan.highlighted ? 'primary' : 'secondary'} className="mt-7 w-full" size="md">
                {plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl2 border border-line bg-surface px-6 py-5 text-center">
        <p className="text-[15px] font-medium">Need more pages?</p>
        {CREDIT_PACKS.map((pack) => (
          <p key={pack.id} className="mt-1 text-[14px] text-ink-muted">
            {pack.pages} additional pages — ${pack.priceUsd}, available on any paid plan.
          </p>
        ))}
      </div>
    </>
  );
}

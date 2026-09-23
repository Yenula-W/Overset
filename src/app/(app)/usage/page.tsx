import type { Metadata } from 'next';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Button, Card, CardBody, CardHeader, CardTitle, Progress } from '@/components/ui';
import { DEMO_SUBSCRIPTION, DEMO_USAGE } from '@/lib/data/workspace';
import { CREDIT_PACKS, planById } from '@/lib/billing';
import { formatNumber, pct } from '@/lib/utils';

export const metadata: Metadata = { title: 'Usage' };

export default function UsagePage() {
  const plan = planById(DEMO_SUBSCRIPTION.plan);
  const { pagesUsed, pagesIncluded, additionalCredits } = DEMO_USAGE;
  const available = pagesIncluded + additionalCredits;
  const remaining = Math.max(0, available - pagesUsed);
  const resets = new Date(DEMO_USAGE.periodResetsAt);

  return (
    <AppShellPage>
      <PageHeader title="Usage" lede={`${plan.name} plan · billed monthly`} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{DEMO_USAGE.periodLabel}</CardTitle>
              <span className="text-[12.5px] text-ink-muted">
                Resets {resets.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              </span>
            </CardHeader>
            <CardBody>
              <p className="text-[34px] font-semibold tracking-[-0.035em] tabular-nums">
                {formatNumber(pagesUsed)}
                <span className="text-[20px] font-normal text-ink-muted"> / {formatNumber(available)} pages</span>
              </p>
              <Progress value={pct(pagesUsed, available)} className="mt-4" label="Pages used this cycle" />
              <p className="mt-3 text-[13.5px] text-ink-muted">{formatNumber(remaining)} pages remaining</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-line">
              {DEMO_USAGE.breakdown.map((b) => (
                <li key={b.label} className="flex items-baseline justify-between px-5 py-3.5">
                  <span className="text-[13.5px] text-ink-muted">{b.label}</span>
                  <span className="text-[14px] font-medium tabular-nums">{b.value}</span>
                </li>
              ))}
            </ul>
          </Card>

          <p className="text-[12.5px] leading-relaxed text-ink-faint">
            A page counts once per processing run. Re-translating a page you already processed this cycle does not
            consume another page, and usage is tracked server-side rather than from the browser.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Need more pages?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {CREDIT_PACKS.map((pack) => (
                <Button key={pack.id} variant="secondary" className="w-full">
                  Buy {pack.pages} pages — ${pack.priceUsd}
                </Button>
              ))}
              <Button href="/pricing" className="w-full">
                Upgrade plan
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-[24px] font-semibold tabular-nums">{DEMO_USAGE.storageGb} GB</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">Original, cleaned, and translated pages across all projects.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShellPage>
  );
}

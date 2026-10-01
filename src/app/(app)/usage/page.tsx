'use client';

import * as React from 'react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Button, Card, CardBody, CardHeader, CardTitle, Progress, Tooltip } from '@/components/ui';
import { CREDIT_PACKS, planById } from '@/lib/billing';
import { getAllByIndex, storageEstimate } from '@/lib/store/db';
import { useLiveQuery, useActiveWorkspace } from '@/lib/store/hooks';
import { getUsage, listAllPages, periodKey } from '@/lib/store/repo';
import type { UsageRecord } from '@/lib/store/schema';
import { formatBytes } from '@/lib/download';
import { formatNumber, pct } from '@/lib/utils';

export default function UsagePage() {
  const workspace = useActiveWorkspace();
  const plan = planById(workspace.plan);
  const data = useLiveQuery(
    async () => {
      const [usage, history, pages, storage] = await Promise.all([
        getUsage(workspace.id),
        getAllByIndex<UsageRecord>('usage', 'ownerId', workspace.id),
        listAllPages(workspace.id),
        storageEstimate(),
      ]);
      return { usage, history: history.sort((a, b) => b.period.localeCompare(a.period)), pages, storage };
    },
    [workspace.id],
    ['usage', 'pages', 'blobs'],
  );

  const now = new Date();
  const resets = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const used = data.data?.usage.pagesProcessed ?? 0;
  const remaining = Math.max(0, plan.pageAllowance - used);
  const regions = (data.data?.pages ?? []).flatMap((p) => p.regions);
  const uploadBytes = (data.data?.pages ?? []).reduce((s, p) => s + p.bytes, 0);
  const monthName = now.toLocaleDateString(undefined, { month: 'long' });

  return (
    <AppShellPage>
      <PageHeader title="Usage" lede={`${plan.name} plan`} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{monthName}</CardTitle>
              <span className="text-[12.5px] text-ink-muted">Resets {resets.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
            </CardHeader>
            <CardBody>
              <p className="text-[34px] font-semibold tabular-nums tracking-[-0.035em]">
                {formatNumber(used)}
                <span className="text-[20px] font-normal text-ink-muted"> / {formatNumber(plan.pageAllowance)} pages</span>
              </p>
              <Progress value={pct(used, plan.pageAllowance)} tone={used > plan.pageAllowance ? 'warn' : 'accent'} className="mt-4" label="Pages used this month" />
              <p className="mt-3 text-[13.5px] text-ink-muted">
                {used > plan.pageAllowance
                  ? `${formatNumber(used - plan.pageAllowance)} pages over the allowance — nothing is blocked while billing isn’t connected.`
                  : `${formatNumber(remaining)} pages remaining`}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-line">
              {[
                ['Pages processed this month', formatNumber(used)],
                ['Pages exported this month', formatNumber(data.data?.usage.pagesExported ?? 0)],
                ['Pages stored', formatNumber(data.data?.pages.length ?? 0)],
                ['Text regions', formatNumber(regions.length)],
                ['Approved translations', formatNumber(regions.filter((r) => r.status === 'approved').length)],
                ['Uploaded files', formatBytes(uploadBytes)],
              ].map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between px-5 py-3.5">
                  <span className="text-[13.5px] text-ink-muted">{k}</span>
                  <span className="text-[14px] font-medium tabular-nums">{v}</span>
                </li>
              ))}
            </ul>
          </Card>

          {(data.data?.history.length ?? 0) > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous months</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-line">
                {data.data!.history
                  .filter((h) => h.period !== periodKey())
                  .map((h) => (
                    <li key={h.id} className="flex items-baseline justify-between px-5 py-3">
                      <span className="text-[13.5px] text-ink-muted">
                        {new Date(`${h.period}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[13.5px] tabular-nums">
                        {formatNumber(h.pagesProcessed)} processed · {formatNumber(h.pagesExported)} exported
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}

          <p className="text-[12.5px] leading-relaxed text-ink-faint">
            A page counts when it’s uploaded and processed. Editing, re-rendering, and exporting it again don’t count twice.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Need more pages?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {CREDIT_PACKS.map((pack) => (
                <Tooltip key={pack.id} label="Needs a payment provider">
                  <Button variant="secondary" className="w-full" disabled aria-describedby="billing-note">
                    Buy {pack.pages} pages — ${pack.priceUsd}
                  </Button>
                </Tooltip>
              ))}
              <Button href="/pricing" className="w-full">
                Compare plans
              </Button>
              <p id="billing-note" className="text-[12px] leading-relaxed text-ink-faint">
                Purchases and upgrades need a payment provider, which isn’t connected yet.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-[24px] font-semibold tabular-nums">{data.data?.storage ? formatBytes(data.data.storage.usedBytes) : '—'}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                Stored in this browser
                {data.data?.storage?.quotaBytes ? `, out of about ${formatBytes(data.data.storage.quotaBytes)} available` : ''}.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShellPage>
  );
}

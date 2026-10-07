'use client';

import * as React from 'react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Button, Card, CardBody, CardHeader, CardTitle, Progress, useToast } from '@/components/ui';
import { billingAction } from '@/lib/client-services';
import { CREDIT_PACKS, PLANS, planById } from '@/lib/billing';
import { cloudEnabled, getAllByIndex, storageEstimate } from '@/lib/store/db';
import { useLiveQuery, useActiveWorkspace } from '@/lib/store/hooks';
import { getUsage, listAllPages, periodKey } from '@/lib/store/repo';
import type { UsageRecord } from '@/lib/store/schema';
import { formatBytes } from '@/lib/download';
import { CountUp } from '@/components/fx';
import { formatNumber, pct } from '@/lib/utils';

export default function UsagePage() {
  const workspace = useActiveWorkspace();
  const toast = useToast();
  const [billingBusy,setBillingBusy] = React.useState(false);
  async function buy(item?: string) { setBillingBusy(true);try { await billingAction(item); } catch(error){ toast({message:error instanceof Error?error.message:'Billing is unavailable.',tone:'warn'});setBillingBusy(false); } }
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
  const resets = data.data?.usage.resetsAt ? new Date(data.data.usage.resetsAt) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const used = data.data?.usage.pagesProcessed ?? 0;
  const remaining = data.data?.usage.remaining ?? Math.max(0, plan.pageAllowance - used);
  const allowance = plan.pageAllowance + (data.data?.usage.creditsUsed ?? 0) + (data.data?.usage.additionalCredits ?? 0);
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
              <CardTitle>{plan.id === 'free' ? 'Free trial' : monthName}</CardTitle>
              <span className="text-[12.5px] text-ink-muted">{plan.id === 'free' ? '10 pages total · does not reset' : `Resets ${resets.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`}</span>
            </CardHeader>
            <CardBody>
              <p className="text-[34px] font-semibold tabular-nums tracking-[-0.035em]">
                <CountUp value={used} />
                <span className="text-[20px] font-normal text-ink-muted"> / {formatNumber(allowance)} pages</span>
              </p>
              <Progress value={pct(used, allowance)} tone={used > allowance ? 'warn' : 'accent'} className="mt-4" label={plan.id === 'free' ? 'Trial pages used' : 'Pages used this month'} />
              <p className="mt-3 text-[13.5px] text-ink-muted">
                {used > allowance
                  ? `No pages remaining — upgrade or add credits to continue.`
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
                [plan.id === 'free' ? 'Free trial pages used' : 'Pages processed this month', formatNumber(used)],
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
                  .filter((h) => h.period !== data.data?.usage.period)
                  .map((h) => (
                    <li key={h.id} className="flex items-baseline justify-between px-5 py-3">
                      <span className="text-[13.5px] text-ink-muted">
                        {(h.period.startsWith('cycle-') ? new Date(Number(h.period.slice(6))*1000) : new Date(`${h.period}-01T00:00:00`)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
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
            Cloud usage counts a verified original page when AI processing starts. Re-running that saved page does not count it twice.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Need more pages?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {CREDIT_PACKS.map((pack) => (
                <Button key={pack.id} variant="secondary" className="w-full" disabled={!cloudEnabled || !workspace.isOwn || billingBusy} onClick={()=>void buy(pack.id)}>
                  Buy {pack.pages} pages — ${pack.priceUsd}
                </Button>
              ))}
              {workspace.isOwn && <><select aria-label="Upgrade plan" defaultValue="" disabled={!cloudEnabled || billingBusy} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px]" onChange={e=>{if(e.target.value)void buy(e.target.value);e.target.value='';}}>
                <option value="">Choose a plan…</option>{PLANS.filter(p=>p.id!=='free').map(p=><option key={p.id} value={p.id}>{p.name} — ${p.priceMonthly}/month</option>)}
              </select><Button variant="secondary" className="w-full" disabled={!cloudEnabled || billingBusy || !data.data?.usage.hasSubscription} onClick={()=>void buy()}>Manage billing</Button></>}
              <p className="text-[12px] leading-relaxed text-ink-faint">{workspace.isOwn ? 'Checkout opens securely in Stripe. Plans change after payment is confirmed.' : 'Only the workspace owner can purchase credits or manage billing.'}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-[24px] font-semibold tabular-nums">{data.data?.storage ? formatBytes(data.data.storage.usedBytes) : '—'}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                {cloudEnabled ? 'Stored privately in your cloud workspace' : 'Stored in this browser'}
                {data.data?.storage?.quotaBytes ? `, out of about ${formatBytes(data.data.storage.quotaBytes)} available` : ''}.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShellPage>
  );
}

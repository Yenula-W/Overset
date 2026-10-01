'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Card, CardBody, CardHeader, CardTitle, Progress, useToast } from '@/components/ui';
import { useUser } from '@/lib/store/hooks';
import { findLocalAccounts, importLocalAccount, type LocalAccount } from '@/lib/store/import-local';
import { formatNumber, pct } from '@/lib/utils';

function useLocalAccounts() {
  const [accounts, setAccounts] = React.useState<LocalAccount[]>([]);
  const reload = React.useCallback(() => void findLocalAccounts().then(setAccounts), []);
  React.useEffect(reload, [reload]);
  return { accounts, reload };
}

const describe = (a: LocalAccount) =>
  `${formatNumber(a.projects)} ${a.projects === 1 ? 'project' : 'projects'} and ${formatNumber(a.pages)} ${a.pages === 1 ? 'page' : 'pages'}`;

/** Points people with browser-only work at the import in Settings. */
export function ImportLocalBanner() {
  const { accounts } = useLocalAccounts();
  if (accounts.length === 0) return null;
  return (
    <p className="mt-6 rounded-xl bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-ink">
      This browser still has work saved from before your account moved online.{' '}
      <Link href="/settings#data" className="font-medium underline underline-offset-2">
        Bring it into your account
      </Link>
      .
    </p>
  );
}

/** Lists browser-only accounts on this device and copies one into the cloud. */
export function ImportLocalCard() {
  const user = useUser();
  const toast = useToast();
  const { accounts, reload } = useLocalAccounts();
  const [running, setRunning] = React.useState<{ id: string; done: number; total: number } | null>(null);

  if (accounts.length === 0) return null;

  async function run(account: LocalAccount) {
    setRunning({ id: account.id, done: 0, total: 1 });
    try {
      // Always into your own workspace, whichever team you're viewing.
      const result = await importLocalAccount(account.id, user.id, (done, total) => setRunning({ id: account.id, done, total }));
      toast({ message: `Imported ${formatNumber(result.projects)} ${result.projects === 1 ? 'project' : 'projects'}.`, tone: 'ok' });
      reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      toast({
        message: /permission/i.test(message)
          ? 'This work was already imported into a different account, so it can’t be added here.'
          : message || 'The import stopped partway. Run it again to pick up where it left off.',
        tone: 'warn',
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work saved in this browser</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-[14px] leading-relaxed text-ink-muted">
          Before accounts moved online, Overset kept everything in the browser. Copy it into your account to open it on any device.
          The browser copy stays where it is.
        </p>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{a.name}</p>
                <p className="text-[12.5px] text-ink-muted">
                  {a.email} · {describe(a)}
                </p>
                {running?.id === a.id && <Progress value={pct(running.done, running.total)} className="mt-2" label="Import progress" />}
              </div>
              <Button variant="secondary" onClick={() => void run(a)} disabled={running !== null}>
                {running?.id === a.id ? 'Importing…' : 'Import'}
              </Button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

import { NextResponse } from 'next/server';
import { planById } from '@/lib/billing';
import { getSessionUser } from '@/lib/server/authz';
import { serverClient } from '@/lib/supabase/server';
import type { PlanId } from '@/lib/types/domain';

/**
 * Usage for the signed-in account's current billing period, read on the
 * server. The plan comes from the profile row, which only the server can
 * change (see the records_guard trigger), so the allowance can't be inflated
 * from the browser.
 */
export async function GET() {
  const user = await getSessionUser();
  const supabase = await serverClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: 'unauthenticated', message: 'Log in to view usage.' } },
      { status: 401 },
    );
  }

  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [profile, usage] = await Promise.all([
    supabase.from('records').select('data').eq('store', 'users').eq('id', user.id).maybeSingle(),
    supabase.from('records').select('data').eq('store', 'usage').eq('id', `${user.id}:${period}`).maybeSingle(),
  ]);
  if (profile.error || usage.error) {
    return NextResponse.json(
      { error: { code: 'unavailable', message: 'Usage is unavailable right now. Try again shortly.' } },
      { status: 503 },
    );
  }

  const plan = planById(((profile.data?.data as { plan?: PlanId } | null)?.plan ?? 'free') as PlanId);
  const pagesUsed = Number((usage.data?.data as { pagesProcessed?: number } | null)?.pagesProcessed ?? 0);
  return NextResponse.json({ period, plan: plan.id, pagesUsed, pagesIncluded: plan.pageAllowance, additionalCredits: 0 });
}

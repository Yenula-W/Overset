import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, CREDIT_PACKS, PLANNING_COST_CENTS_PER_PAGE, estimatedCostPerPageCents, paymentFeeCents, planMarginAtFullUsage } from '../src/lib/billing.ts';

test('the planning cost covers the measured cost per page', () => {
  assert.ok(PLANNING_COST_CENTS_PER_PAGE >= estimatedCostPerPageCents());
});

test('every paid plan keeps at least half its revenue when every page is used', () => {
  for (const plan of PLANS.filter((p) => p.priceMonthly > 0)) {
    const { marginRatio } = planMarginAtFullUsage(plan);
    assert.ok(marginRatio >= 0.5, `${plan.name} margin is ${(marginRatio * 100).toFixed(1)}%`);
  }
});

test('yearly plans stay profitable at full usage', () => {
  for (const plan of PLANS.filter((p) => p.priceYearly > 0)) {
    const monthly = (plan.priceYearly * 100 - paymentFeeCents(plan.priceYearly)) / 12;
    assert.ok(monthly - plan.pageAllowance * PLANNING_COST_CENTS_PER_PAGE >= monthly * 0.45, plan.name);
  }
});

test('credit packs cost more per page than any plan and stay profitable', () => {
  const cheapestPlanPage = Math.min(...PLANS.filter((p) => p.priceMonthly > 0).map((p) => (p.priceMonthly * 100) / p.pageAllowance));
  for (const pack of CREDIT_PACKS) {
    const perPage = (pack.priceUsd * 100) / pack.pages;
    assert.ok(perPage >= cheapestPlanPage);
    assert.ok(pack.priceUsd * 100 - paymentFeeCents(pack.priceUsd) - pack.pages * PLANNING_COST_CENTS_PER_PAGE >= pack.priceUsd * 100 * 0.5);
  }
});

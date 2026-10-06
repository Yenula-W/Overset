/**
 * Billing configuration.
 *
 * Every price, allowance, and credit pack lives here so it can be changed
 * without touching product code. Allowances are set so every paid plan keeps
 * at least a 50% gross margin even when a customer uses every page, at the
 * measured AI cost per page (see COST_MODEL_CENTS_PER_PAGE).
 */

import type { PlanId } from '@/lib/types/domain';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceLabel?: string;
  tagline: string;
  pageAllowance: number;
  seats: number;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tagline: 'See what it does with a real chapter.',
    pageAllowance: 10,
    seats: 1,
    features: ['10 pages, one-time trial', 'OCR', 'AI translation', 'Limited context', 'Typesetting preview', '1 project'],
    cta: 'Start free',
    href: '/signup',
  },
  {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 19,
    priceYearly: 190,
    tagline: 'For solo translators shipping regularly.',
    pageAllowance: 80,
    seats: 1,
    features: [
      '80 pages / month',
      'Context-aware translation',
      'Automatic typesetting',
      'Translation memory',
      '1,000 glossary terms',
      '10 projects',
    ],
    cta: 'Choose Creator',
    href: '/signup?plan=creator',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceYearly: 490,
    tagline: 'Full context engine and QA.',
    pageAllowance: 220,
    seats: 1,
    features: [
      '220 pages / month',
      'Unlimited projects',
      'Unlimited glossary',
      'Character voices',
      'Advanced QA',
      'Priority processing',
    ],
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    id: 'team',
    name: 'Team',
    priceMonthly: 129,
    priceYearly: 1290,
    tagline: 'Translator, proofreader, typesetter — one workspace.',
    pageAllowance: 600,
    seats: 5,
    features: [
      '600 pages / month',
      '5 members',
      'Collaboration',
      'Proofreading workflow',
      'Comments',
      'Version history',
    ],
    cta: 'Start Team',
    href: '/signup?plan=team',
  },
  {
    id: 'publisher',
    name: 'Publisher',
    priceMonthly: 499,
    priceYearly: 5390,
    priceLabel: 'From $499',
    tagline: 'High-volume localization infrastructure.',
    pageAllowance: 2500,
    seats: 20,
    features: [
      '2,500+ pages / month',
      '20+ members',
      'Volume pricing',
      'Organization workspace',
      'Priority processing',
      'Custom limits',
    ],
    cta: 'Contact us',
    href: '/teams#contact',
  },
];

export interface CreditPack {
  id: string;
  pages: number;
  priceUsd: number;
}

export const CREDIT_PACKS: CreditPack[] = [{ id: 'pages-50', pages: 50, priceUsd: 15 }];

export function planById(id: PlanId): PlanDefinition {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/**
 * Measured AI cost per page, in cents, on Claude Sonnet 5.5 ($2 / $10 per
 * million input / output tokens) from processing logs:
 * - reading the page (two images): ~2.0
 * - translation: ~0.9 per bubble, ~6 bubbles on a typical page
 * - proofreading, regeneration and suggestions: ~1.0
 * Cleaning, typesetting and export run in the browser and cost nothing.
 * Re-measure from `processing_tasks` before changing allowances.
 */
export const COST_MODEL_CENTS_PER_PAGE = {
  ocr: 2.0,
  translation: 5.4,
  review: 1.0,
  storage: 0.1,
} as const;

/** Rounded up so allowances stay safe on busier pages. */
export const PLANNING_COST_CENTS_PER_PAGE = 9;

export function estimatedCostPerPageCents() {
  return Object.values(COST_MODEL_CENTS_PER_PAGE).reduce((a, b) => a + b, 0);
}

/** Card processing: 2.9% + 30¢ per charge. */
export function paymentFeeCents(amountUsd: number) {
  return amountUsd > 0 ? Math.round(amountUsd * 100 * 0.029 + 30) : 0;
}

/** Gross margin for one month of a plan when every included page is used. */
export function planMarginAtFullUsage(plan: PlanDefinition) {
  const revenueCents = plan.priceMonthly * 100;
  const costCents = plan.pageAllowance * PLANNING_COST_CENTS_PER_PAGE + paymentFeeCents(plan.priceMonthly);
  const marginCents = revenueCents - costCents;
  return { costCents, revenueCents, marginCents, marginRatio: revenueCents ? marginCents / revenueCents : 0 };
}

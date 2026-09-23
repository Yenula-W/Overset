/**
 * Billing configuration.
 *
 * Every price, allowance, and credit pack lives here so it can be changed
 * without touching product code. These numbers are an opening concept, not a
 * validated margin — real limits must be set against measured cost per page
 * (see CostBreakdown and the pipeline cost centers).
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
    pageAllowance: 30,
    seats: 1,
    features: ['30 pages / month', 'OCR', 'AI translation', 'Limited context', 'Typesetting preview', '1 project'],
    cta: 'Start free',
    href: '/signup',
  },
  {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 12,
    priceYearly: 120,
    tagline: 'For solo translators shipping regularly.',
    pageAllowance: 300,
    seats: 1,
    features: [
      '300 pages / month',
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
    priceMonthly: 29,
    priceYearly: 290,
    tagline: 'Full context engine and QA.',
    pageAllowance: 1000,
    seats: 1,
    features: [
      '1,000 pages / month',
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
    priceMonthly: 69,
    priceYearly: 690,
    tagline: 'Translator, proofreader, typesetter — one workspace.',
    pageAllowance: 3000,
    seats: 5,
    features: [
      '3,000 pages / month',
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
    priceMonthly: 249,
    priceYearly: 2490,
    priceLabel: 'From $249',
    tagline: 'High-volume localization infrastructure.',
    pageAllowance: 10000,
    seats: 20,
    features: [
      '10,000+ pages / month',
      '20+ members',
      'API access',
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

export const CREDIT_PACKS: CreditPack[] = [{ id: 'pages-100', pages: 100, priceUsd: 5 }];

export function planById(id: PlanId): PlanDefinition {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/**
 * Internal cost model, in cents per page. These are placeholders to be
 * replaced by measured values before production limits are locked in.
 */
export const COST_MODEL_CENTS_PER_PAGE = {
  ocr: 0.4,
  vision: 0.6,
  translation: 1.8,
  imageProcessing: 1.1,
  storage: 0.05,
  exports: 0.05,
} as const;

export function estimatedCostPerPageCents() {
  return Object.values(COST_MODEL_CENTS_PER_PAGE).reduce((a, b) => a + b, 0);
}

/** Gross margin check for a plan at full allowance usage. */
export function planMarginAtFullUsage(plan: PlanDefinition) {
  const costCents = plan.pageAllowance * estimatedCostPerPageCents();
  const revenueCents = plan.priceMonthly * 100;
  return { costCents, revenueCents, marginCents: revenueCents - costCents };
}

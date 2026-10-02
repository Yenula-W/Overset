// Run with Node 22+ after supplying STRIPE_SECRET_KEY in the process environment.
// Creates catalog/webhook configuration, never customers or charges.
import Stripe from 'stripe';
import { writeFile, access } from 'node:fs/promises';
import { PLANS, CREDIT_PACKS } from '../src/lib/billing.ts';
const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error('Set STRIPE_SECRET_KEY first.');
if (!key.startsWith('sk_test_') && !process.argv.includes('--live')) throw new Error('Use test mode first. Pass --live to configure a live account.');
const site = process.env.OVERSET_SITE_URL || 'https://useoverset.com';
if (new URL(site).protocol !== 'https:') throw new Error('Webhook site must use HTTPS.');
try { await access('.env.stripe-setup'); throw new Error('Move the previous .env.stripe-setup to a safe place before running again.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const stripe = new Stripe(key, { maxNetworkRetries: 2 });
const output = [];
const products = [];
async function catalog(item, intervals) {
 const id = `overset_${item.id.replaceAll('-', '_')}`;
 let product;
 try { product = await stripe.products.retrieve(id); }
 catch (error) { if (error.code !== 'resource_missing') throw error; product = await stripe.products.create({ id, name: `Overset ${item.name || `${item.pages} pages`}`, metadata: { overset_item: item.id } }, { idempotencyKey: `overset-product-${id}` }); }
 const available = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
 const selected = [];
 for (const [interval, amount] of intervals) {
  const cents = Math.round(amount * 100);
  let price = available.data.find(p => p.currency === 'usd' && p.unit_amount === cents && (interval ? p.recurring?.interval === interval : !p.recurring));
  if (!price) price = await stripe.prices.create({ product: product.id, currency: 'usd', unit_amount: cents, ...(interval ? { recurring: { interval } } : {}), metadata: { overset_item: item.id } }, { idempotencyKey: `overset-price-${id}-${interval || 'once'}-${cents}` });
  output.push(`STRIPE_PRICE_${item.id.replaceAll('-', '_').toUpperCase()}${interval ? `_${interval === 'month' ? 'MONTHLY' : 'YEARLY'}` : ''}=${price.id}`);
  selected.push(price.id);
 }
 if (intervals[0][0]) products.push({ product: product.id, prices: selected });
}
for (const plan of PLANS.filter(p => p.id !== 'free')) await catalog(plan, [['month', plan.priceMonthly], ['year', plan.priceYearly]]);
for (const pack of CREDIT_PACKS) await catalog(pack, [[null, pack.priceUsd]]);
const portalData = { business_profile: { headline: 'Manage your Overset subscription' }, features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: true, mode: 'at_period_end' }, subscription_update: { enabled: true, default_allowed_updates: ['price'], products, proration_behavior: 'create_prorations' } }, metadata: { overset: 'true' } };
const portals = await stripe.billingPortal.configurations.list({ limit: 100 });
const prior = portals.data.find(p => p.metadata?.overset === 'true');
const portal = prior ? await stripe.billingPortal.configurations.update(prior.id, portalData) : await stripe.billingPortal.configurations.create(portalData, { idempotencyKey: 'overset-portal-v1' });
output.push(`STRIPE_PORTAL_CONFIGURATION=${portal.id}`);
const endpointUrl = `${site.replace(/\/$/, '')}/api/billing/webhook`;
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
const events = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];
const existing = endpoints.data.find(e => e.url === endpointUrl && e.status === 'enabled');
if (existing) { await stripe.webhookEndpoints.update(existing.id, { enabled_events: events }); console.log('Webhook already exists. Keep its existing STRIPE_WEBHOOK_SECRET; Stripe only returns it at creation.'); }
else { const endpoint = await stripe.webhookEndpoints.create({ url: endpointUrl, enabled_events: events }, { idempotencyKey: `overset-webhook-${new URL(site).hostname}` }); output.push(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`); }
await writeFile('.env.stripe-setup', output.join('\n') + '\n', { mode: 0o600, flag: 'wx' });
console.log('Stripe catalog and portal configured. Add the entries in .env.stripe-setup to Vercel, then redeploy. No payments were made.');

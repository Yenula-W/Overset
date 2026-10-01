import 'server-only';
import Stripe from 'stripe';
import { PLANS, CREDIT_PACKS } from '@/lib/billing';
import { ServiceError } from './http';
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new ServiceError('billing_not_configured','Payments are not connected yet.');
  return new Stripe(process.env.STRIPE_SECRET_KEY,{maxNetworkRetries:2});
}
export function priceFor(item:string,interval:'monthly'|'yearly'='monthly') {
  const known=PLANS.some(p=>p.id===item&&p.id!=='free')||CREDIT_PACKS.some(p=>p.id===item);
  if(!known)throw new ServiceError('invalid_plan','Choose a listed plan or credit pack.',400);
  const name=`STRIPE_PRICE_${item.replaceAll('-','_').toUpperCase()}${item.startsWith('pages-')?'':`_${interval.toUpperCase()}`}`;
  const price=process.env[name];
  if(!price)throw new ServiceError('price_not_configured','This purchase is not available yet.');
  return price;
}
export function planForPrice(price:string) {
  return PLANS.find(p=>p.id!=='free'&&(['monthly','yearly'] as const).some(interval=>process.env[`STRIPE_PRICE_${p.id.toUpperCase()}_${interval.toUpperCase()}`]===price));
}

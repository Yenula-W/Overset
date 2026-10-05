import 'server-only';
import { cookies, headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { trialDigest, validTrialCookie, trialNetwork } from './trial-identity';
import { isIP } from 'node:net';
import { ServiceError } from './http';

/** Opaque, signed identity: no fingerprinting or hardware collection. */
export async function trialIdentity() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new ServiceError('trial_unavailable', 'Trial verification is temporarily unavailable.');
  const digest = (purpose: string, value: string) => trialDigest(secret, purpose, value);
  const jar = await cookies();
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-overset-trial' : 'overset-trial';
  const existing = jar.get(cookieName)?.value ?? '';
  let [id] = existing.split('.');
  const valid = validTrialCookie(secret, existing);
  if (!valid) id = randomUUID();
  // Renew expiry without changing a valid browser identity.
  jar.set(cookieName, `${id}.${digest('cookie', id)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  const requestHeaders = await headers();
  // Trust only Vercel's overwritten header, never arbitrary forwarded headers locally.
  const ip = process.env.VERCEL === '1' ? requestHeaders.get('x-vercel-forwarded-for')?.split(',')[0].trim() : undefined;
  if (process.env.VERCEL === '1' && (!ip || !isIP(ip))) throw new ServiceError('trial_unavailable', 'Your network could not be verified. Please try again shortly.');
  return { device_key: digest('device', id), network_key: ip && isIP(ip) ? digest('network', trialNetwork(ip)) : null };
}

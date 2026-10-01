import 'server-only';

import { ServiceError } from './http';
import { serverClient, serviceClient } from '@/lib/supabase/server';

/**
 * Authorization helpers.
 *
 * Every project-scoped request is checked against the caller's session, so
 * changing an id in a URL cannot reach someone else's private project. With
 * Supabase, the lookup itself runs under row-level security.
 */

export interface SessionUser {
  id: string;
  email: string;
}

export interface AccessResult {
  allowed: boolean;
  reason?: 'unauthenticated' | 'not_a_member' | 'not_found';
}

/** The signed-in caller, verified with Supabase Auth (not just decoded from a cookie). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await serverClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

export async function assertProjectAccess(user: SessionUser | null, projectId: string): Promise<AccessResult> {
  if (!user) return { allowed: false, reason: 'unauthenticated' };
  if (!projectId) return { allowed: false, reason: 'not_found' };
  const supabase = await serverClient();
  if (!supabase) return { allowed: false, reason: 'not_a_member' };
  const { data } = await supabase.from('records').select('id').eq('store', 'projects').eq('id', projectId).maybeSingle();
  return data ? { allowed: true } : { allowed: false, reason: 'not_found' };
}

/**
 * Rate limit for the expensive and abusable endpoints. With Supabase's service
 * key, buckets live in the database and hold across every server instance;
 * otherwise they fall back to this instance's memory.
 */
const buckets = new Map<string, { tokens: number; refilledAt: number }>();

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterMs: number }> {
  const admin = serviceClient();
  if (admin) {
    const { data, error } = await admin.rpc('take_rate_token', { bucket: key, max_tokens: limit, window_ms: windowMs });
    const row = Array.isArray(data) ? (data[0] as { ok: boolean; retry_after_ms: number } | undefined) : undefined;
    if (!error && row) return { ok: row.ok, retryAfterMs: row.retry_after_ms };
    throw new ServiceError('rate_limit_unavailable', 'Processing is temporarily unavailable. Please try again shortly.');
  }
  return memoryRateLimit(key, limit, windowMs);
}

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: limit, refilledAt: now };
  const elapsed = now - bucket.refilledAt;
  if (elapsed > windowMs) {
    bucket.tokens = limit;
    bucket.refilledAt = now;
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return { ok: false, retryAfterMs: windowMs - elapsed };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, retryAfterMs: 0 };
}

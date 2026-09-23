import 'server-only';

/**
 * Authorization helpers.
 *
 * Every project-scoped request is checked against the caller's session, so
 * changing an id in a URL cannot reach someone else's private project.
 */

export interface SessionUser {
  id: string;
  email: string;
}

export interface AccessResult {
  allowed: boolean;
  reason?: 'unauthenticated' | 'not_a_member' | 'not_found';
}

/** Placeholder session read — replaced by the real session store. */
export async function getSessionUser(): Promise<SessionUser | null> {
  return null;
}

export async function assertProjectAccess(user: SessionUser | null, projectId: string): Promise<AccessResult> {
  if (!user) return { allowed: false, reason: 'unauthenticated' };
  if (!projectId) return { allowed: false, reason: 'not_found' };
  // Real implementation: look up project membership for user.id.
  return { allowed: false, reason: 'not_a_member' };
}

/**
 * Token-bucket rate limit for the expensive endpoints. Processing a chapter
 * costs real money per page, so these cannot be left open.
 */
const buckets = new Map<string, { tokens: number; refilledAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
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

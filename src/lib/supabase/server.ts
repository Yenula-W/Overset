import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_KEY, SUPABASE_URL, cloudEnabled } from './config';

/** A client acting as the signed-in caller, so row-level security applies. */
export async function serverClient(): Promise<SupabaseClient | null> {
  if (!cloudEnabled) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a context that can't set cookies; the browser refreshes the session itself.
        }
      },
    },
  });
}

/**
 * Full-access client for the few things a user can't do for themselves:
 * deleting their login, and the shared rate limiter. Never sent to the browser.
 */
export function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!cloudEnabled || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

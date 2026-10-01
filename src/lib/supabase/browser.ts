'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL, cloudEnabled } from './config';

let client: SupabaseClient | null = null;

/** The session is kept in cookies so server routes can read the same login. */
export function supabase(): SupabaseClient {
  if (!cloudEnabled) throw new Error('Supabase is not configured.');
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

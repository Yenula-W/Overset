/**
 * Overset runs in one of two modes. With Supabase configured, accounts,
 * projects, and page images live on the server and follow the user across
 * devices. Without it, everything stays in this browser.
 *
 * These must be referenced literally so Next.js inlines them into the bundle.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const PAGES_BUCKET = 'pages';

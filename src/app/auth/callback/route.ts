import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';

/**
 * Landing point for links in Supabase emails (confirm signup, reset password,
 * change email). Exchanges the one-time code for a session, then continues.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/dashboard';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.startsWith('/\\') ? nextParam : '/dashboard';

  const supabase = await serverClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const description = url.searchParams.get('error_description');
  const login = new URL('/login', url.origin);
  login.searchParams.set('error', description ?? 'That link has expired or was already used. Request a new one.');
  return NextResponse.redirect(login);
}

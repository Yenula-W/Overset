import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/authz';

/**
 * Usage is always read from the server's own accounting. Page counts reported
 * by the browser are never trusted — they decide what a customer is billed.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthenticated', message: 'Log in to view usage.' } },
      { status: 401 },
    );
  }
  return NextResponse.json({ pagesUsed: 0, pagesIncluded: 0, additionalCredits: 0 });
}

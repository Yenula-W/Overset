import 'server-only';
import { NextResponse } from 'next/server';
export class ServiceError extends Error {
  constructor(public code: string, message: string, public status = 503) { super(message); }
}
export function failure(error: unknown) {
  if (error instanceof ServiceError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  console.error('[service]', error instanceof Error ? error.name : 'Unknown error');
  return NextResponse.json({ error: { code: 'unavailable', message: 'The service could not finish. Your saved work is safe; try again shortly.' } }, { status: 503 });
}
export function siteUrl() {
  const url = new URL(process.env.OVERSET_SITE_URL || 'https://useoverset.com');
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new ServiceError('configuration', 'The website URL is not configured correctly.');
  return url.origin;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && origin !== siteUrl()) throw new ServiceError('forbidden', 'Open this action from Overset.', 403);
}

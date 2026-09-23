import { NextResponse } from 'next/server';
import { assertProjectAccess, getSessionUser, rateLimit } from '@/lib/server/authz';
import { PIPELINE } from '@/lib/pipeline';

/**
 * Chapter translation endpoint.
 *
 * The browser talks only to Overset. Overset talks to the OCR, vision,
 * translation, and cleaning providers with server-held keys, then returns
 * results to the editor. No provider key is ever sent to the client.
 *
 *   Browser → Overset backend → providers → Overset backend → editor
 *
 * This route is the shape of that boundary. It enforces auth, project access,
 * and rate limiting before any billable work is queued.
 */

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthenticated', message: 'Log in to translate a chapter.' } },
      { status: 401 },
    );
  }

  // Expensive endpoints are rate limited per user, not per IP, because the
  // cost follows the account.
  const limit = rateLimit(`translate:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'rate_limited',
          message: 'Too many chapters queued at once. Try again shortly.',
          retryAfterMs: limit.retryAfterMs,
        },
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const body = (await request.json().catch(() => null)) as { projectId?: string } | null;
  const access = await assertProjectAccess(user, body?.projectId ?? '');
  if (!access.allowed) {
    // A project the caller cannot see is reported as missing rather than
    // forbidden, so ids cannot be probed by changing a URL.
    return NextResponse.json(
      { error: { code: 'not_found', message: 'That project does not exist.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    jobId: `job_${id}`,
    chapterId: id,
    stages: PIPELINE.map((stage) => ({ id: stage.id, state: 'pending', progress: 0 })),
  });
}

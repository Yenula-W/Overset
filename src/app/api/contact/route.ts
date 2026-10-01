import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/authz';

/**
 * Contact form endpoint.
 *
 * Messages are validated and written to the server log, which on Vercel means
 * they appear under the project's Runtime Logs. Wire an email provider in
 * `deliver()` to have them land in an inbox instead.
 */

const schema = z.object({
  topic: z.enum(['Sales', 'Support', 'Publisher plan', 'Press']),
  name: z.string().trim().min(1, 'Enter your name.').max(200),
  email: z.string().trim().email('Enter a valid email address.').max(320),
  company: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(1, 'Enter a message.').max(5000),
});

export type ContactPayload = z.infer<typeof schema>;

async function deliver(payload: ContactPayload) {
  console.info('[contact]', JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }));
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = await rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Too many messages from this connection. Try again in a few minutes.' } },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: { code: 'invalid', message: first?.message ?? 'Check the form and try again.', field: first?.path[0] } },
      { status: 400 },
    );
  }

  await deliver(parsed.data);
  return NextResponse.json({ ok: true });
}

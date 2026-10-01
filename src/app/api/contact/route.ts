import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/authz';
import { queueEmail, emailConfigured } from '@/lib/server/email';
import { failure, ServiceError } from '@/lib/server/http';

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

  try {
    if (!process.env.OVERSET_CONTACT_EMAIL || !emailConfigured()) throw new ServiceError('email_not_configured', 'The contact form is not available yet. Please try again later.');
    const p = parsed.data;
    const delivery = await queueEmail({ to: process.env.OVERSET_CONTACT_EMAIL, subject: `[Overset ${p.topic}] ${p.name}`, replyTo: p.email, text: `${p.name} <${p.email}>${p.company ? ` · ${p.company}` : ''}\n\n${p.message}` });
    return NextResponse.json({ ok: true, queued: !delivery.delivered });
  } catch(error) { return failure(error); }
}

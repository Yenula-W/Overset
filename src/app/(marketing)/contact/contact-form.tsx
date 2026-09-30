'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOPICS = ['Sales', 'Support', 'Publisher plan', 'Press'] as const;
type Topic = (typeof TOPICS)[number];

const field =
  'h-[50px] border border-mk-input bg-white px-3.5 text-[15px] text-ink outline-none transition-colors focus:border-ink';

export function ContactForm() {
  const [topic, setTopic] = React.useState<Topic>('Sales');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topic }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? 'Your message could not be sent.');
      }
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Your message could not be sent.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-2.5 border border-line bg-white p-8" role="status">
        <span className="mk-eyebrow">MESSAGE SENT</span>
        <span className="text-[24px] font-bold tracking-[-0.01em]">Thanks — we’ll reply by email.</span>
        <span className="text-[14px] text-ink-muted">Topic: {topic}</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[15px] font-bold">Topic</legend>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'border border-mk-input px-4 py-2.5 text-[14px] transition-colors',
                topic === t ? 'bg-ink text-white' : 'bg-white text-ink hover:border-ink',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label className="flex flex-col gap-2 text-[13px] text-ink-muted">
          Name
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="flex flex-col gap-2 text-[13px] text-ink-muted">
          Email
          <input name="email" required type="email" autoComplete="email" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-[13px] text-ink-muted">
        Studio or company (optional)
        <input name="company" autoComplete="organization" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-[13px] text-ink-muted">
        Message
        <textarea
          name="message"
          required
          rows={5}
          className="resize-y border border-mk-input bg-white p-3.5 text-[15px] text-ink outline-none transition-colors focus:border-ink"
        />
      </label>
      {status === 'error' && error && (
        <p role="alert" className="m-0 border border-danger/30 bg-dangerSoft px-3.5 py-3 text-[14px] text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex items-center gap-2.5 self-start bg-ink px-6 py-[15px] text-[15px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
        <ArrowRight size={16} aria-hidden />
      </button>
    </form>
  );
}

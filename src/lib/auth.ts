/**
 * Client-side auth surface.
 *
 * This is a thin, swappable seam. Every function here is the shape the real
 * backend endpoint will have, so wiring in a session API later is a change of
 * implementation, not of callers. Nothing sensitive is persisted in the
 * browser beyond a display session marker.
 */

import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .regex(/[0-9]/, 'Include at least one number.'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const resetSchema = z.object({ email: z.string().email('Enter a valid email address.') });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const SESSION_KEY = 'panelflow.session';

export interface ClientSession {
  name: string;
  email: string;
  onboardingComplete: boolean;
}

export function readSession(): ClientSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ClientSession) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: ClientSession) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* Storage can be unavailable in private windows; the app still works. */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}

/** Maps a Zod error into the field-keyed shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

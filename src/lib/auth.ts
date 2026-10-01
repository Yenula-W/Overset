/**
 * Form validation shared by the auth screens. The account logic itself lives
 * in `src/lib/store/auth.ts`.
 */

import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .regex(/[0-9]/, 'Include at least one number.');

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const resetSchema = z.object({ email: z.string().trim().email('Enter a valid email address.') });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Maps a Zod error into the field-keyed shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

import { get, getOneByIndex, newId, notify, put } from './db';
import type { PublicUser, UserRecord } from './schema';
import type { PlanId } from '@/lib/types/domain';

/**
 * Local accounts.
 *
 * Passwords are never stored: each account keeps a random salt and a
 * PBKDF2-SHA-256 derivation of the password. The session marker in
 * localStorage holds only the user id.
 *
 * Accounts live in this browser. Signing in on another device needs a server
 * database and is the point at which this module is replaced.
 */

const SESSION_KEY = 'overset.session';
const ITERATIONS = 310_000;

export class AuthError extends Error {
  constructor(
    message: string,
    public field?: 'name' | 'email' | 'password' | 'currentPassword' | 'form',
  ) {
    super(message);
  }
}

function toHex(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, saltHex: string, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time comparison so a mismatch position is not observable. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function toPublic(user: UserRecord): PublicUser {
  const { passwordHash: _h, salt: _s, iterations: _i, ...rest } = user;
  return rest;
}

/* ---------------------------------------------------------------- session */

export function getSessionUserId(): string | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string };
    return parsed.userId ?? null;
  } catch {
    return null;
  }
}

function setSession(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: new Date().toISOString() }));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    throw new AuthError('This browser is blocking storage, so Overset can’t keep you signed in. Turn off private browsing and try again.', 'form');
  }
  notify('users');
}

export async function currentUser(): Promise<PublicUser | null> {
  const id = getSessionUserId();
  if (!id) return null;
  const user = await get<UserRecord>('users', id);
  if (!user) {
    setSession(null);
    return null;
  }
  return toPublic(user);
}

/* ------------------------------------------------------------ account flow */

export async function signUp(input: { name: string; email: string; password: string; plan?: PlanId }): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await getOneByIndex<UserRecord>('users', 'email', email);
  if (existing) throw new AuthError('An account with this email already exists on this device. Log in instead.', 'email');

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const user: UserRecord = {
    id: newId('usr'),
    name: input.name.trim(),
    email,
    salt,
    iterations: ITERATIONS,
    passwordHash: await derive(input.password, salt, ITERATIONS),
    createdAt: new Date().toISOString(),
    onboardingComplete: false,
    preferences: { emailOnProcessed: true, emailOnComment: true },
    plan: input.plan ?? 'free',
  };
  await put('users', user);
  setSession(user.id);
  return toPublic(user);
}

export async function logIn(input: { email: string; password: string }): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const user = await getOneByIndex<UserRecord>('users', 'email', email);
  // One message for both cases so the form does not reveal which emails exist.
  const fail = new AuthError('That email and password don’t match an account on this device.', 'form');
  if (!user) {
    await derive(input.password, '00'.repeat(16), ITERATIONS); // even out timing
    throw fail;
  }
  const hash = await derive(input.password, user.salt, user.iterations);
  if (!safeEqual(hash, user.passwordHash)) throw fail;
  setSession(user.id);
  return toPublic(user);
}

export function logOut() {
  setSession(null);
}

export async function updateProfile(userId: string, patch: Partial<Pick<UserRecord, 'name' | 'email' | 'preferences' | 'onboardingComplete' | 'plan'>>) {
  const user = await get<UserRecord>('users', userId);
  if (!user) throw new AuthError('Your account could not be found. Log in again.', 'form');
  const next: UserRecord = { ...user, ...patch };
  if (patch.email !== undefined) {
    next.email = patch.email.trim().toLowerCase();
    if (next.email !== user.email) {
      const clash = await getOneByIndex<UserRecord>('users', 'email', next.email);
      if (clash) throw new AuthError('Another account on this device already uses that email.', 'email');
    }
  }
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.preferences) next.preferences = { ...user.preferences, ...patch.preferences };
  await put('users', next);
  return toPublic(next);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await get<UserRecord>('users', userId);
  if (!user) throw new AuthError('Your account could not be found. Log in again.', 'form');
  const hash = await derive(currentPassword, user.salt, user.iterations);
  if (!safeEqual(hash, user.passwordHash)) throw new AuthError('Your current password is incorrect.', 'currentPassword');
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  await put<UserRecord>('users', {
    ...user,
    salt,
    iterations: ITERATIONS,
    passwordHash: await derive(newPassword, salt, ITERATIONS),
  });
}

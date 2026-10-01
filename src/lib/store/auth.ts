import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/browser';
import { cloudEnabled, get, getOneByIndex, newId, notify, put } from './db';
import type { PublicUser, UserRecord } from './schema';
import type { PlanId, TeamRole } from '@/lib/types/domain';

/**
 * Accounts.
 *
 * With Supabase configured, Supabase Auth owns logins: passwords never touch
 * Overset's tables, sessions live in cookies the server can read, and reset
 * and confirmation emails are sent by Supabase. The profile (name, plan,
 * preferences) is a `users` record keyed by the auth user id.
 *
 * Without it, accounts live in this browser. Passwords are never stored: each
 * account keeps a random salt and a PBKDF2-SHA-256 derivation of the password,
 * and the session marker in localStorage holds only the user id.
 */

const SESSION_KEY = 'overset.session';
const ITERATIONS = 310_000;

export class AuthError extends Error {
  constructor(
    message: string,
    public field?: 'name' | 'email' | 'password' | 'currentPassword' | 'form',
    /** 'notice' means nothing went wrong — the user has a next step, like checking their inbox. */
    public tone: 'error' | 'notice' = 'error',
  ) {
    super(message);
  }
}

export { cloudEnabled };

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
  if (cloudEnabled) return cloud.currentUser();
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
  if (cloudEnabled) return cloud.signUp(input);
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
  if (cloudEnabled) return cloud.logIn(input);
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

export async function logOut() {
  if (cloudEnabled) return cloud.logOut();
  setSession(null);
}

export type ProfilePatch = Partial<Pick<UserRecord, 'name' | 'email' | 'preferences' | 'onboardingComplete' | 'plan'>>;

/** Returns the saved profile; `pendingEmail` is set when a new address still needs confirming. */
export async function updateProfile(userId: string, patch: ProfilePatch): Promise<PublicUser & { pendingEmail?: string }> {
  if (cloudEnabled) return cloud.updateProfile(userId, patch);
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
  if (cloudEnabled) return cloud.changePassword(currentPassword, newPassword);
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

/** Emails a reset link. Only possible with Supabase, which sends the mail. */
export async function requestPasswordReset(email: string) {
  if (!cloudEnabled) throw new AuthError('Password reset emails need the server, which isn’t connected.', 'form');
  const { error } = await supabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });
  if (error) throw cloud.mapError(error);
}

/** Sets a new password for the session opened by a reset link. */
export async function setNewPassword(password: string) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw cloud.mapError(error);
}

/** Runs `onChange` when the user signs in, out, or changes account details anywhere. */
export function watchAuth(onChange: () => void): () => void {
  if (!cloudEnabled) return () => {};
  const { data } = supabase().auth.onAuthStateChange((event) => {
    // Supabase holds a lock during this callback; reading the session inside it deadlocks.
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(onChange, 0);
  });
  return () => data.subscription.unsubscribe();
}

/** A workspace someone else owns that the signed-in user was invited to. */
export interface SharedWorkspace {
  ownerId: string;
  ownerName: string;
  role: TeamRole;
  plan: PlanId;
}

/** Teams the signed-in user belongs to. Only accounts in the cloud can be shared. */
export async function listSharedWorkspaces(): Promise<SharedWorkspace[]> {
  if (!cloudEnabled) return [];
  const { data, error } = await supabase().rpc('my_workspaces');
  if (error || !Array.isArray(data)) return [];
  const rows = data as { owner_id: string; owner_name: string; role: TeamRole }[];
  // Members can read the owner's profile, which holds the plan the workspace runs on.
  const owners = await Promise.all(rows.map((w) => get<UserRecord>('users', w.owner_id).catch(() => undefined)));
  return rows.map((w, i) => ({ ownerId: w.owner_id, ownerName: w.owner_name, role: w.role, plan: owners[i]?.plan ?? 'free' }));
}

/* ---------------------------------------------------------- cloud accounts */

const cloud = {
  mapError(error: SupabaseAuthError): AuthError {
    switch (error.code) {
      case 'invalid_credentials':
        return new AuthError('That email and password don’t match an account.', 'form');
      case 'email_not_confirmed':
        return new AuthError('Confirm your email first — open the link we sent when you signed up.', 'form');
      case 'user_already_exists':
      case 'email_exists':
        return new AuthError('An account with this email already exists. Log in instead.', 'email');
      case 'weak_password':
        return new AuthError(error.message || 'Choose a stronger password.', 'password');
      case 'same_password':
        return new AuthError('Your new password must be different from your current one.', 'password');
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return new AuthError('Too many attempts. Wait a minute and try again.', 'form');
      case 'email_address_invalid':
        return new AuthError('Enter a valid email address.', 'email');
      default:
        return new AuthError(error.message || 'Something went wrong. Try again.', 'form');
    }
  },

  invitesAccepted: new Set<string>(),

  async currentUser(): Promise<PublicUser | null> {
    const { data } = await supabase().auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) return null;
    const email = (authUser.email ?? '').toLowerCase();
    let profile = await get<PublicUser>('users', authUser.id);
    if (!profile) {
      // First sign-in (possibly after confirming email): the profile is created from signup details.
      const meta = authUser.user_metadata as { name?: string };
      profile = await put<PublicUser>('users', {
        id: authUser.id,
        name: meta.name?.trim() || email.split('@')[0],
        email,
        createdAt: authUser.created_at,
        onboardingComplete: false,
        preferences: { emailOnProcessed: true, emailOnComment: true },
        plan: 'free',
      });
      profile = (await get<PublicUser>('users', authUser.id)) ?? profile;
    } else if (email && profile.email !== email) {
      // A confirmed email change: the login is the source of truth.
      profile = await put<PublicUser>('users', { ...profile, email });
    }
    if (!cloud.invitesAccepted.has(authUser.id)) {
      cloud.invitesAccepted.add(authUser.id);
      void supabase().rpc('accept_invites').then(({ data: owners }) => {
        if (Array.isArray(owners) && owners.length) notify('team');
      });
    }
    return profile;
  },

  async signUp(input: { name: string; email: string; password: string }): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase().auth.signUp({
      email,
      password: input.password,
      options: {
        data: { name: input.name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) throw cloud.mapError(error);
    if (!data.session) {
      throw new AuthError(`We sent a confirmation link to ${email}. Open it to finish creating your account.`, 'form', 'notice');
    }
    const user = await cloud.currentUser();
    if (!user) throw new AuthError('Your account was created, but signing in failed. Log in to continue.', 'form');
    notify('users');
    return user;
  },

  async logIn(input: { email: string; password: string }): Promise<PublicUser> {
    const { error } = await supabase().auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password });
    if (error) throw cloud.mapError(error);
    const user = await cloud.currentUser();
    if (!user) throw new AuthError('Signing in failed. Try again.', 'form');
    notify('users');
    return user;
  },

  async logOut() {
    await supabase().auth.signOut();
    notify('users');
  },

  async updateProfile(userId: string, patch: ProfilePatch): Promise<PublicUser & { pendingEmail?: string }> {
    const profile = await get<PublicUser>('users', userId);
    if (!profile) throw new AuthError('Your account could not be found. Log in again.', 'form');
    const { email: requestedEmail, ...rest } = patch;
    const next: PublicUser = {
      ...profile,
      ...rest,
      name: rest.name !== undefined ? rest.name.trim() : profile.name,
      preferences: { ...profile.preferences, ...rest.preferences },
    };
    let pendingEmail: string | undefined;
    const email = requestedEmail?.trim().toLowerCase();
    if (email && email !== profile.email) {
      // Supabase emails the new address; the profile updates once it's confirmed.
      const { error } = await supabase().auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings` },
      );
      if (error) throw cloud.mapError(error);
      pendingEmail = email;
    }
    await put('users', next);
    return { ...next, pendingEmail };
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await supabase().auth.getSession();
    const email = data.session?.user.email;
    if (!email) throw new AuthError('Your session has ended. Log in again.', 'form');
    const check = await supabase().auth.signInWithPassword({ email, password: currentPassword });
    if (check.error) {
      throw check.error.code === 'invalid_credentials'
        ? new AuthError('Your current password is incorrect.', 'currentPassword')
        : cloud.mapError(check.error);
    }
    const { error } = await supabase().auth.updateUser({ password: newPassword });
    if (error) throw cloud.mapError(error);
  },
};

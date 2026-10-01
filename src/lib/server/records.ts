import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serverClient, serviceClient } from '@/lib/supabase/server';
import { getSessionUser } from './authz';
import { ServiceError } from './http';
export async function authenticated() {
  const user = await getSessionUser();
  const db = await serverClient();
  if (!user || !db) throw new ServiceError('unauthenticated', 'Log in to continue.', 401);
  return { user, db };
}
export function adminClient() {
  const db = serviceClient();
  if (!db) throw new ServiceError('configuration', 'Cloud services need the Supabase server key.');
  return db;
}
export async function record<T>(db: SupabaseClient, store: string, id: string): Promise<T> {
  const { data, error } = await db.from('records').select('data').eq('store', store).eq('id', id).maybeSingle();
  if (error) throw new ServiceError('database', 'Your workspace is temporarily unavailable.');
  if (!data) throw new ServiceError('not_found', 'That item does not exist or is not shared with you.', 404);
  return data.data as T;
}
export async function records<T>(db: SupabaseClient, store: string, owner: string, index?: string, value?: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    let q = db.from('records').select('data').eq('store', store).eq('owner_id', owner).order('id').range(offset, offset + 999);
    if (index && value) q = q.eq(`data->>${index}`, value);
    const { data, error } = await q;
    if (error) throw new ServiceError('database', 'Your workspace is temporarily unavailable.');
    out.push(...data.map(r => r.data as T));
    if (data.length < 1000) return out;
  }
}
export async function editable(db: SupabaseClient, owner: string, user: { id: string; email: string }) {
  if (owner === user.id) return;
  const { data, error } = await db.from('records').select('data').eq('store', 'team').eq('owner_id', owner).eq('data->>email', user.email.toLowerCase());
  const roles = ['translator', 'proofreader', 'typesetter'];
  if (error || !data?.some(r => roles.includes(r.data.role))) throw new ServiceError('read_only', 'This workspace is view only. Ask its owner for an editing role.', 403);
}

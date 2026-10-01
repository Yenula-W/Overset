'use client';

/**
 * Supabase backend: the same operations as the browser database, against the
 * `records` table (see supabase/migrations). Row-level security decides what
 * the caller can see, so a query here can never return another account's data.
 *
 * Page images go to the private `pages` bucket at `<owner id>/<blob id>`; the
 * `blobs` store keeps only their metadata. Only `db.ts` calls this.
 */

import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/browser';
import { PAGES_BUCKET } from '@/lib/supabase/config';
import type { StoreName } from './db';
import type { BlobRecord } from './schema';

const PAGE_SIZE = 1000;
const WRITE_CHUNK = 200;

interface BlobMeta {
  id: string;
  ownerId: string;
  kind: BlobRecord['kind'];
  size: number;
  type: string;
}

class CloudError extends Error {}

function fail(error: PostgrestError | { message: string; statusCode?: string }): never {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (offline) throw new CloudError('You’re offline, so Overset can’t reach your workspace. Reconnect and try again.');
  // Row-level security said no: a viewer editing, or a role that was just removed.
  const denied =
    ('code' in error && error.code === '42501') || ('statusCode' in error && error.statusCode === '403') || /row-level security/i.test(error.message);
  if (denied) throw new CloudError('You don’t have permission to change this workspace. Ask its owner for an editing role.');
  throw new CloudError(`Overset couldn’t reach your workspace: ${error.message}`);
}

function ownerOf(store: StoreName, value: Record<string, unknown>) {
  return String(store === 'users' ? value.id : value.ownerId);
}

function column(index: string) {
  return index === 'ownerId' ? 'owner_id' : `data->>${index}`;
}

const path = (meta: { ownerId: string; id: string }) => `${meta.ownerId}/${meta.id}`;

/* ------------------------------------------------------------------ reads */

async function selectAll<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase()
      .from('records')
      .select('data')
      .eq('store', store)
      .eq(column(index), String(value))
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) fail(error);
    out.push(...data.map((r) => r.data as T));
    if (data.length < PAGE_SIZE) return out;
  }
}

async function selectOne<T>(store: StoreName, id: string): Promise<T | undefined> {
  const { data, error } = await supabase().from('records').select('data').eq('store', store).eq('id', id).maybeSingle();
  if (error) fail(error);
  return (data?.data as T) ?? undefined;
}

/** Downloaded images, so scrolling the page rail doesn't refetch thumbnails. */
const blobCache = new Map<string, Blob>();
const BLOB_CACHE_LIMIT = 300;

function cacheBlob(id: string, blob: Blob) {
  blobCache.set(id, blob);
  if (blobCache.size > BLOB_CACHE_LIMIT) blobCache.delete(blobCache.keys().next().value!);
}

async function getBlob(id: string): Promise<BlobRecord | undefined> {
  const meta = await selectOne<BlobMeta>('blobs', id);
  if (!meta) return undefined;
  const cached = blobCache.get(id);
  if (cached) return { id, ownerId: meta.ownerId, kind: meta.kind, blob: cached };
  const { data, error } = await supabase().storage.from(PAGES_BUCKET).download(path(meta));
  if (error) fail(error);
  const blob = meta.type && data.type !== meta.type ? new Blob([data], { type: meta.type }) : data;
  cacheBlob(id, blob);
  return { id, ownerId: meta.ownerId, kind: meta.kind, blob };
}

export async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  if (store === 'blobs') return (await getBlob(key)) as T | undefined;
  return selectOne<T>(store, key);
}

export async function getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T[]> {
  return selectAll<T>(store, index, value);
}

export async function getOneByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T | undefined> {
  const { data, error } = await supabase()
    .from('records')
    .select('data')
    .eq('store', store)
    .eq(column(index), String(value))
    .limit(1);
  if (error) fail(error);
  return (data[0]?.data as T) ?? undefined;
}

/* ----------------------------------------------------------------- writes */

async function upsertRows(store: StoreName, values: Record<string, unknown>[]) {
  for (let i = 0; i < values.length; i += WRITE_CHUNK) {
    const rows = values.slice(i, i + WRITE_CHUNK).map((data) => ({ store, id: String(data.id), owner_id: ownerOf(store, data), data }));
    const { error } = await supabase().from('records').upsert(rows);
    if (error) fail(error);
  }
}

async function uploadBlobs(records: BlobRecord[]) {
  // A few at a time: fast on a good connection without flooding a slow one.
  const queue = [...records];
  const worker = async () => {
    for (let rec = queue.shift(); rec; rec = queue.shift()) {
      const { error } = await supabase()
        .storage.from(PAGES_BUCKET)
        .upload(path(rec), rec.blob, { contentType: rec.blob.type || 'application/octet-stream', upsert: true });
      if (error) fail(error);
      cacheBlob(rec.id, rec.blob);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, records.length) }, worker));
  const metas: BlobMeta[] = records.map((r) => ({ id: r.id, ownerId: r.ownerId, kind: r.kind, size: r.blob.size, type: r.blob.type }));
  await upsertRows('blobs', metas as unknown as Record<string, unknown>[]);
}

export async function put<T>(store: StoreName, value: T): Promise<T> {
  await putMany(store, [value]);
  return value;
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return;
  if (store === 'blobs') return uploadBlobs(values as unknown as BlobRecord[]);
  await upsertRows(store, values as unknown as Record<string, unknown>[]);
}

export async function remove(store: StoreName, key: string): Promise<void> {
  await removeMany(store, [key]);
}

export async function removeMany(store: StoreName, keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += WRITE_CHUNK) {
    const chunk = keys.slice(i, i + WRITE_CHUNK);
    if (store === 'blobs') {
      const { data, error } = await supabase().from('records').select('data').eq('store', 'blobs').in('id', chunk);
      if (error) fail(error);
      const paths = data.map((r) => path(r.data as BlobMeta));
      if (paths.length) {
        const removed = await supabase().storage.from(PAGES_BUCKET).remove(paths);
        if (removed.error) fail(removed.error);
      }
      chunk.forEach((id) => blobCache.delete(id));
    }
    const { error } = await supabase().from('records').delete().eq('store', store).in('id', chunk);
    if (error) fail(error);
  }
}

/* ------------------------------------------------------------------ quota */

/** Supabase's free tier includes 1 GB of file storage. */
const DEFAULT_QUOTA = 1024 ** 3;

export async function storageEstimate(): Promise<{ usedBytes: number; quotaBytes: number } | null> {
  const { data } = await supabase().auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const blobs = await selectAll<BlobMeta>('blobs', 'ownerId', userId);
  return { usedBytes: blobs.reduce((sum, b) => sum + (b.size ?? 0), 0), quotaBytes: DEFAULT_QUOTA };
}

/* --------------------------------------------------------------- realtime */

/**
 * Calls `onChange` whenever a record the caller can see changes anywhere —
 * another device, or a teammate. Row-level security filters the feed.
 */
export function watchChanges(onChange: (store: StoreName) => void): () => void {
  const channel = supabase()
    .channel('overset-records')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (payload) => {
      const row = (payload.new && 'store' in payload.new ? payload.new : payload.old) as { store?: StoreName } | undefined;
      if (row?.store) onChange(row.store);
    })
    .subscribe();
  return () => {
    void supabase().removeChannel(channel);
  };
}

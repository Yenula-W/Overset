/**
 * Overset's database.
 *
 * Screens never call this directly — `repo.ts` does. Behind it sits one of two
 * backends with identical behavior:
 *
 *  - Supabase, when NEXT_PUBLIC_SUPABASE_URL and a key are set: accounts and
 *    work live on the server and follow the user to any device.
 *  - IndexedDB otherwise: everything stays in this browser.
 *
 * Every write announces itself on a change bus so live queries re-run, and on
 * a BroadcastChannel so other tabs stay in sync. In cloud mode, changes made
 * on other devices or by teammates arrive over Supabase Realtime.
 */

import { cloudEnabled } from '@/lib/supabase/config';
import * as cloud from './cloud-db';
import * as local from './local-db';

export { cloudEnabled };

export type StoreName =
  | 'users'
  | 'projects'
  | 'chapters'
  | 'pages'
  | 'blobs'
  | 'characters'
  | 'glossary'
  | 'memory'
  | 'comments'
  | 'versions'
  | 'team'
  | 'usage';

const backend = cloudEnabled ? cloud : local;

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  return backend.get<T>(store, key);
}

export function getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T[]> {
  return backend.getAllByIndex<T>(store, index, value);
}

export function getOneByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T | undefined> {
  return backend.getOneByIndex<T>(store, index, value);
}

export async function put<T>(store: StoreName, value: T): Promise<T> {
  await backend.put(store, value);
  notify(store);
  return value;
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return;
  await backend.putMany(store, values);
  notify(store);
}

export async function remove(store: StoreName, key: string): Promise<void> {
  await backend.remove(store, key);
  notify(store);
}

export async function removeMany(store: StoreName, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await backend.removeMany(store, keys);
  notify(store);
}

export function storageEstimate() {
  return backend.storageEstimate();
}

/* ------------------------------------------------------------- change bus */

type Listener = (store: StoreName) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

let stopRealtime: (() => void) | null = null;

/** Batches bursts of remote changes (including echoes of our own writes). */
const pendingRemote = new Set<StoreName>();
let remoteTimer: ReturnType<typeof setTimeout> | null = null;

function onRemoteChange(store: StoreName) {
  pendingRemote.add(store);
  remoteTimer ??= setTimeout(() => {
    remoteTimer = null;
    const stores = [...pendingRemote];
    pendingRemote.clear();
    for (const s of stores) listeners.forEach((l) => l(s));
  }, 250);
}

function getChannel() {
  if (!isBrowser()) return null;
  if (cloudEnabled && !stopRealtime) stopRealtime = cloud.watchChanges(onRemoteChange);
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel('overset-store');
    channel.onmessage = (e) => {
      const store = e.data as StoreName;
      listeners.forEach((l) => l(store));
    };
  }
  return channel;
}

export function notify(store: StoreName) {
  listeners.forEach((l) => l(store));
  getChannel()?.postMessage(store);
}

export function subscribe(listener: Listener): () => void {
  getChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function newId(prefix: string) {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}

/** Ask the browser not to evict Overset's data under storage pressure. */
export async function requestPersistence() {
  if (cloudEnabled) return true;
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

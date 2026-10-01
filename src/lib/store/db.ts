/**
 * Browser database.
 *
 * Overset stores accounts, projects, chapters, page images, and everything the
 * translator produces in IndexedDB, so the full workflow runs without any
 * outside service. The repository layer (`repo.ts`) is the only caller; swap
 * this file for a server-backed implementation and the screens do not change.
 *
 * Every write announces itself on a change bus so live queries re-run, and on
 * a BroadcastChannel so other tabs stay in sync.
 */

const DB_NAME = 'overset';
const DB_VERSION = 1;

export const STORES = {
  users: { keyPath: 'id', indexes: [['email', 'email', true]] },
  projects: { keyPath: 'id', indexes: [['ownerId', 'ownerId', false]] },
  chapters: { keyPath: 'id', indexes: [['projectId', 'projectId', false], ['ownerId', 'ownerId', false]] },
  pages: { keyPath: 'id', indexes: [['chapterId', 'chapterId', false], ['ownerId', 'ownerId', false]] },
  blobs: { keyPath: 'id', indexes: [['ownerId', 'ownerId', false]] },
  characters: { keyPath: 'id', indexes: [['projectId', 'projectId', false], ['ownerId', 'ownerId', false]] },
  glossary: { keyPath: 'id', indexes: [['projectId', 'projectId', false], ['ownerId', 'ownerId', false]] },
  memory: { keyPath: 'id', indexes: [['projectId', 'projectId', false], ['ownerId', 'ownerId', false]] },
  comments: { keyPath: 'id', indexes: [['chapterId', 'chapterId', false], ['ownerId', 'ownerId', false]] },
  versions: { keyPath: 'id', indexes: [['chapterId', 'chapterId', false], ['ownerId', 'ownerId', false]] },
  team: { keyPath: 'id', indexes: [['ownerId', 'ownerId', false]] },
  usage: { keyPath: 'id', indexes: [['ownerId', 'ownerId', false]] },
} as const;

export type StoreName = keyof typeof STORES;

let dbPromise: Promise<IDBDatabase> | null = null;

export function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

export function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) return Promise.reject(new Error('Overset storage is only available in the browser.'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, def] of Object.entries(STORES)) {
        if (db.objectStoreNames.contains(name)) continue;
        const store = db.createObjectStore(name, { keyPath: def.keyPath });
        for (const [indexName, keyPath, unique] of def.indexes) {
          store.createIndex(indexName, keyPath, { unique });
        }
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // Another tab upgraded the schema: drop this connection so it can proceed.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error('Could not open browser storage.'));
    };
    req.onblocked = () => reject(new Error('Browser storage is blocked by another Overset tab. Close other tabs and reload.'));
  });
  return dbPromise;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted.'));
  });
}

export async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDb();
  return promisify(db.transaction(store, 'readonly').objectStore(store).get(key)) as Promise<T | undefined>;
}

export async function getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDb();
  return promisify(db.transaction(store, 'readonly').objectStore(store).index(index).getAll(value)) as Promise<T[]>;
}

export async function getOneByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  return promisify(db.transaction(store, 'readonly').objectStore(store).index(index).get(value)) as Promise<T | undefined>;
}

export async function put<T>(store: StoreName, value: T): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(value);
  await txDone(tx);
  notify(store);
  return value;
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  for (const v of values) os.put(v);
  await txDone(tx);
  notify(store);
}

export async function remove(store: StoreName, key: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(key);
  await txDone(tx);
  notify(store);
}

export async function removeMany(store: StoreName, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  for (const k of keys) os.delete(k);
  await txDone(tx);
  notify(store);
}

/* ------------------------------------------------------------- change bus */

type Listener = (store: StoreName) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function getChannel() {
  if (!isBrowser() || typeof BroadcastChannel === 'undefined') return null;
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
  return () => listeners.delete(listener);
}

export function newId(prefix: string) {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}

export async function storageEstimate(): Promise<{ usedBytes: number; quotaBytes: number } | null> {
  if (!isBrowser() || !navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { usedBytes: est.usage ?? 0, quotaBytes: est.quota ?? 0 };
}

/** Ask the browser not to evict Overset's data under storage pressure. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

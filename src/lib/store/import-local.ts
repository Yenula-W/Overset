'use client';

/**
 * Moves work saved in this browser (from before cloud accounts were switched
 * on) into the signed-in cloud account. Record ids are kept, so links between
 * projects, chapters, pages and images survive; only the owner changes.
 *
 * The browser copy is left untouched. Usage history isn't carried over: the
 * cloud account's allowance starts from its own records.
 */

import * as cloud from './cloud-db';
import { cloudEnabled, notify, type StoreName } from './db';
import * as local from './local-db';
import type { UserRecord } from './schema';

/** Parents before children, so a partly finished import never leaves orphans. */
const STORES: StoreName[] = ['projects', 'chapters', 'characters', 'glossary', 'memory', 'blobs', 'pages', 'comments', 'versions', 'team'];

const IMPORTED_KEY = 'overset.imported';

export interface LocalAccount {
  id: string;
  name: string;
  email: string;
  projects: number;
  pages: number;
}

function importedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(IMPORTED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function markImported(id: string) {
  try {
    localStorage.setItem(IMPORTED_KEY, JSON.stringify([...importedIds(), id]));
  } catch {
    // Without storage the card simply stays offered; importing again is harmless.
  }
}

/** Browser-only accounts on this device that still have work to bring over. */
export async function findLocalAccounts(): Promise<LocalAccount[]> {
  if (!cloudEnabled || typeof indexedDB === 'undefined') return [];
  try {
    const done = importedIds();
    const users = (await local.getAll<UserRecord>('users')).filter((u) => !done.has(u.id));
    const accounts = await Promise.all(
      users.map(async (u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        projects: (await local.getAllByIndex('projects', 'ownerId', u.id)).length,
        pages: (await local.getAllByIndex('pages', 'ownerId', u.id)).length,
      })),
    );
    return accounts.filter((a) => a.projects > 0);
  } catch {
    // Blocked or missing browser storage just means there's nothing to import.
    return [];
  }
}

/** Copies one browser account's work into `ownerId`'s cloud workspace. */
export async function importLocalAccount(localId: string, ownerId: string, onProgress?: (done: number, total: number) => void) {
  const batches = await Promise.all(STORES.map((store) => local.getAllByIndex<Record<string, unknown>>(store, 'ownerId', localId)));
  const total = batches.reduce((n, rows) => n + rows.length, 0);
  let done = 0;
  for (const [i, store] of STORES.entries()) {
    const rows = batches[i].map((row) => ({ ...row, ownerId }));
    // Images go up in small groups so progress moves and memory stays flat.
    const step = store === 'blobs' ? 20 : 500;
    for (let j = 0; j < rows.length; j += step) {
      const chunk = rows.slice(j, j + step);
      await cloud.putMany(store, chunk);
      done += chunk.length;
      onProgress?.(done, total);
    }
    notify(store);
  }
  markImported(localId);
  return { projects: batches[0].length, records: total };
}

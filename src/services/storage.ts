import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

type StorageNotice = (message: string | null) => void;
let report: StorageNotice = () => {};
let queue = Promise.resolve();
let lastWritten: string | null = null;
export function onStorageNotice(listener: StorageNotice) { report = listener; }

export const indexedDbStorage: StateStorage = {
  async getItem(name) {
    let value: unknown;
    try {
      value = await get<unknown>(name);
    } catch {
      report('Your saved game could not be loaded. You can still play; saving will be retried.');
      return null;
    }
    if (value !== undefined && typeof value !== 'string') throw new Error('Invalid save');
    if (typeof value === 'string') {
      const envelope = JSON.parse(value) as unknown;
      if (!envelope || typeof envelope !== 'object' || !('state' in envelope) || !('version' in envelope) || typeof envelope.version !== 'number') throw new Error('Invalid save envelope');
    }
    return value ?? null;
  },
  setItem(name, value) {
    // Selection and transient UI updates need not rewrite an identical snapshot.
    if (value === lastWritten) return queue;
    lastWritten = value;
    queue = queue.then(async () => {
      try { await set(name, value); report(null); }
      catch { lastWritten = null; report('Progress could not be saved. Keep this window open; saving will be retried.'); }
    });
    return queue;
  },
  async removeItem(name) {
    await queue;
    try { await del(name); lastWritten = null; }
    catch { report('The saved game could not be removed.'); }
  },
};

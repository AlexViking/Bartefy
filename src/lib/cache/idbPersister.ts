import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client'

/** Minimal IndexedDB store. No dependency, ~40 lines, survives refresh and
 *  restart - which localStorage also does, but localStorage is synchronous and
 *  caps at ~5MB. A persisted feed with LQIP data URIs blows past that.
 */
const DB = 'bartefy-cache'
const STORE = 'queries'
const KEY = 'client'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export const idbPersister: Persister = {
  persistClient: (client) => tx('readwrite', (s) => s.put(client, KEY)).then(() => undefined),
  restoreClient: () => tx<PersistedClient | undefined>('readonly', (s) => s.get(KEY)),
  removeClient: () => tx('readwrite', (s) => s.delete(KEY)).then(() => undefined),
}

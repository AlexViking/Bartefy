/** Clears everything this app has stored in the browser.
 *
 *  The database wipe for V4 removes every account, item and swap on the server,
 *  but a browser that used the old app keeps its own copies: a TanStack Query
 *  cache persisted to IndexedDB, two Zustand stores in localStorage, and the
 *  Supabase session. Left in place they are worse than stale -- the query cache
 *  will render items and swaps that no longer exist, and the session points at
 *  a user id that has been deleted, so requests fail in ways that look like
 *  bugs in the new code.
 *
 *  Kept deliberately explicit rather than clearing all of localStorage: this
 *  origin also holds the theme preference, and wiping test data is no reason to
 *  throw away a person's chosen appearance.
 */

/** Written by lib/cache/idbPersister.ts. */
const IDB_NAME = 'bartefy-cache'
const IDB_STORE = 'queries'

/** Every localStorage key the app writes, except the theme. Listed by hand so
 *  adding a store forces a decision about whether it should survive a reset. */
const LOCAL_KEYS = [
  'bartefy-hunt', // Zustand: deck position and seen ids
  'bartefy.onboarding', // Zustand: the completed flag the router gates on
  'bartefy.nudges.dismissed', // NextStep: which stall nudges were dismissed
]

/** Keys that deliberately survive. Preferences, not data: the language someone
 *  chose and the theme they picked are not the test data being cleared. */
const KEEP = ['bartefy.theme', 'bartefy.lang']

export type ResetResult = {
  localCleared: string[]
  idbCleared: boolean
  sessionCleared: boolean
}

/** Empties the persisted query cache.
 *
 *  Clears the object store rather than deleting the database, because the
 *  running app holds an open connection: deleteDatabase then fires onblocked
 *  and the cache survives the reset entirely. Emptying the store needs no
 *  exclusive lock, so it works while the app is running -- which is the only
 *  situation this is ever called in.
 */
function clearIndexedDb(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      // A browser that never ran the app has no store to clear; create it so
      // the transaction below has something to open rather than throwing.
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE)
        }
      }
      req.onerror = () => resolve(false)
      req.onsuccess = () => {
        const db = req.result
        try {
          const clear = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).clear()
          clear.onsuccess = () => {
            db.close()
            resolve(true)
          }
          clear.onerror = () => {
            db.close()
            resolve(false)
          }
        } catch {
          db.close()
          resolve(false)
        }
      }
    } catch {
      resolve(false)
    }
  })
}

/** Clear local state. Pass a Supabase client to sign out at the same time;
 *  without one the session survives, which is only ever what you want when the
 *  account still exists.
 */
export async function resetLocal(opts?: {
  signOut?: () => Promise<unknown>
}): Promise<ResetResult> {
  const localCleared: string[] = []

  for (const key of LOCAL_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key)
        localCleared.push(key)
      }
    } catch {
      // Private windows throw on access. Nothing stored means nothing stale.
    }
  }

  // Supabase writes its session under a project-scoped key (sb-<ref>-auth-token)
  // that is not knowable from here, so it is matched by shape rather than
  // listed. KEEP is checked so a future preference using the same prefix is not
  // caught by accident.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (!key || KEEP.includes(key)) continue
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key)
        localCleared.push(key)
      }
    }
  } catch {
    /* as above */
  }

  const idbCleared = await clearIndexedDb()

  let sessionCleared = false
  if (opts?.signOut) {
    try {
      await opts.signOut()
      sessionCleared = true
    } catch {
      // The account may already be gone, which makes sign-out fail while
      // still leaving nothing to sign out of. Removing the token above is
      // what actually ends the session.
      sessionCleared = false
    }
  }

  return { localCleared, idbCleared, sessionCleared }
}

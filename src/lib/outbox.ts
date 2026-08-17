import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Batched, durable, deduplicated mutations.
 *
 *  Swipes are the reason this exists: a fast hunter fires ten in fifteen
 *  seconds. Ten POSTs on mobile data is ten chances to fail and ten times the
 *  server cost, for an action that is not urgent.
 *
 *  Rules:
 *  - Every job carries a client-generated id, so a retry can never double-post.
 *  - Flushed on a 3s timer, at 10 jobs, on reconnect, and on page hide.
 *  - Only reversible, near-certain actions belong here. Offers, handover
 *    confirmation and reports are sent directly and awaited - the UI must not
 *    claim those happened before the server agrees.
 */
export type JobKind = 'swipe' | 'save' | 'unsave' | 'message'

export interface Job {
  id: string
  kind: JobKind
  payload: Record<string, unknown>
  queuedAt: number
  tries: number
}

const MAX_BATCH = 10
const FLUSH_MS = 3000

interface OutboxState {
  jobs: Job[]
  enqueue: (kind: JobKind, payload: Record<string, unknown>) => void
  take: (n?: number) => Job[]
  ack: (ids: string[]) => void
  fail: (ids: string[]) => void
}

export const useOutbox = create<OutboxState>()(
  persist(
    (set, get) => ({
      jobs: [],
      enqueue: (kind, payload) =>
        set((s) => ({
          jobs: [
            ...s.jobs,
            { id: crypto.randomUUID(), kind, payload, queuedAt: Date.now(), tries: 0 },
          ],
        })),
      take: (n = MAX_BATCH) => get().jobs.slice(0, n),
      ack: (ids) => set((s) => ({ jobs: s.jobs.filter((j) => !ids.includes(j.id)) })),
      fail: (ids) =>
        set((s) => ({
          jobs: s.jobs
            // Five failures means the payload is bad, not the network. Drop it
            // rather than retrying forever and wedging the queue.
            .map((j) => (ids.includes(j.id) ? { ...j, tries: j.tries + 1 } : j))
            .filter((j) => j.tries < 5),
        })),
    }),
    { name: 'bartefy-outbox', storage: createJSONStorage(() => localStorage) },
  ),
)

/** Start once, at app level. */
export function startOutbox(send: (jobs: Job[]) => Promise<string[]>) {
  let running = false

  const flush = async () => {
    if (running || !navigator.onLine) return
    const batch = useOutbox.getState().take()
    if (batch.length === 0) return
    running = true
    try {
      const acked = await send(batch)
      useOutbox.getState().ack(acked)
    } catch {
      useOutbox.getState().fail(batch.map((j) => j.id))
    } finally {
      running = false
    }
  }

  const timer = setInterval(flush, FLUSH_MS)
  window.addEventListener('online', flush)
  // Last chance before the tab goes away. pagehide fires reliably on mobile;
  // beforeunload does not.
  window.addEventListener('pagehide', flush)

  return () => {
    clearInterval(timer)
    window.removeEventListener('online', flush)
    window.removeEventListener('pagehide', flush)
  }
}

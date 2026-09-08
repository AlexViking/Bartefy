import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

/** One cache for every read in the app. Zustand keeps client state only:
 *  card index, filters, drafts, outbox. Server data lives here.
 *
 *  Defaults are conservative-fresh: show what we have, revalidate quietly.
 *  Per-resource lifetimes are set on each hook - see the table in ARCHITECTURE.md.
 */
export const STALE = {
  feed: 2 * 60_000,
  item: 5 * 60_000,
  mine: 10 * 60_000,
  counts: 60_000,
  realtime: 0,
} as const

/** Every failed read and write, in one place.
 *
 *  Screens handle the errors they can show the user, but most queries have no
 *  onError at all -- so a failing request simply rendered an empty list and
 *  looked identical to having no data. That is the difference between "nobody
 *  has offered yet" and "the offers request is broken", and until now nothing
 *  in the app could tell them apart.
 *
 *  The cache-level callbacks fire for EVERY query and mutation without
 *  touching 30 call sites. They only log: what the user sees stays each
 *  screen's decision.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[bartefy] query failed', { key: query.queryKey, error })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      console.error('[bartefy] mutation failed', { key: mutation.options.mutationKey, error })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: STALE.item,
      gcTime: 24 * 60 * 60_000,
      // The cache is the first paint. Never flash a spinner over good data.
      placeholderData: (prev: unknown) => prev,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      retry: (count, err: unknown) => {
        const e = err as { status?: number; code?: string }
        if (e?.status && e.status >= 400 && e.status < 500) return false
        // Supabase errors carry a PostgREST `code`, not an HTTP `status`, so
        // the status check alone never matched and a missing row was retried
        // for seconds behind a "Just a moment…" that looked like a hang.
        // PGRST1xx are request-shaped problems; retrying cannot help.
        if (e?.code && /^(PGRST1|22|23|42)/.test(e.code)) return false
        return count < 2
      },
    },
    mutations: { retry: 0 },
  },
})

/** Stable key factory. Every read goes through here so realtime patches and
 *  invalidations can find the exact entry without guessing at key shapes.
 */
export const keys = {
  feed: (filters: string[], radiusKm: number) => ['feed', { filters, radiusKm }] as const,
  item: (id: string) => ['item', id] as const,
  myItems: (userId: string) => ['my-items', userId] as const,
  swaps: (userId: string) => ['swaps', userId] as const,
  unread: (userId: string) => ['unread', userId] as const,
  // Deliberately nested under the same 'unread' prefix, so the single
  // invalidateQueries({ queryKey: keys.unread(id) }) in realtime.ts refreshes
  // the total and the per-row counts together and they cannot disagree.
  unreadBySwap: (userId: string) => ['unread', userId, 'by-swap'] as const,
  thread: (swapId: string) => ['thread', swapId] as const,
  offers: (swapId: string) => ['offers', swapId] as const,
  /** The V4 barter offer lists, and the badge count derived from the same rows.
   *
   *  The count MUST NOT share a key with the list. One key is one cache entry,
   *  so when the shell's badge (a number) and the Offers screen (an array) both
   *  claimed ['barter','offers','incoming',id], whichever mounted first decided
   *  the shape for both -- the shell won, the screen read a number, and
   *  `rows.map` threw a blank page. Separate keys, both under the 'barter'
   *  prefix so one invalidateQueries({ queryKey: ['barter'] }) still refreshes
   *  the list and the badge together. */
  barterOffers: (userId: string, box: 'incoming' | 'sent') =>
    ['barter', 'offers', box, userId] as const,
  barterOffersCount: (userId: string) => ['barter', 'offers', 'incoming-count', userId] as const,
  eyeing: (itemId: string) => ['eyeing', itemId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  reviews: (userId: string) => ['reviews', userId] as const,
  membership: (userId: string) => ['membership', userId] as const,
}

import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { keys } from './cache/queryClient'

/** Push, don't poll.
 *
 *  One channel per user, opened once at app level. Each event patches the query
 *  cache in place - no refetch, no interval. A new message costs one websocket
 *  frame instead of a round trip per client per tick.
 *
 *  The discovery feed is deliberately NOT pushed: ranking is expensive and the
 *  user only ever looks at the top card. A single feed_version integer tells us
 *  something new landed nearby; we act on it only when the user is idle.
 */
export function useRealtime(userId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chan = supabase.channel('user:' + userId) as any

    const channel = chan
      // Messages append to the open thread and bump the inbox.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: row }: { new: { swap_id: string } }) => {
          appendMessage(qc, row)
          qc.invalidateQueries({ queryKey: keys.swaps(userId) })
          // The badge counts the same rows, so it moves on the same frame.
          qc.invalidateQueries({ queryKey: keys.unread(userId) })
        },
      )

      // Swap status: agreed, arranged, received, frozen, closed.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'swaps' },
        ({ new: row }: { new: { id: string } }) => {
          qc.setQueryData(keys.swaps(userId), (prev: unknown) => patchById(prev, row))
          qc.invalidateQueries({ queryKey: keys.thread(row.id) })
        },
      )

      // Offer accepted / declined / countered / expired.
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        ({ new: row }: { new: { swap_id: string } }) => {
          qc.invalidateQueries({ queryKey: keys.offers(row.swap_id) })
        },
      )

      // My items changing status - reserved by an agreement, paused, gone.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items', filter: 'user_id=eq.' + userId },
        ({ new: row }: { new: { id: string } }) => {
          qc.setQueryData(keys.myItems(userId), (prev: unknown) => patchById(prev, row))
          qc.invalidateQueries({ queryKey: keys.item(row.id) })
        },
      )

      // Someone started eyeing one of my finds.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'saves' },
        ({ new: row }: { new: { item_id: string } }) => {
          qc.invalidateQueries({ queryKey: keys.eyeing(row.item_id) })
        },
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, qc])
}

/** Feed freshness without polling: one integer, acted on only when idle at the
 *  top of the stack. Never mid-swipe - moving cards under someone's thumb is
 *  worse than being two minutes stale.
 */
export function useFeedFreshness({
  city,
  onStale,
  idle,
}: {
  city: string | undefined
  onStale: () => void
  idle: boolean
}) {
  useEffect(() => {
    if (!city) return
    const channel = supabase
      .channel('feed_version:' + city)
      .on('broadcast', { event: 'bump' }, () => {
        if (idle) onStale()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [city, idle, onStale])
}

function appendMessage(qc: QueryClient, row: { swap_id: string }) {
  qc.setQueryData(keys.thread(row.swap_id), (prev: unknown) => {
    const list = Array.isArray(prev) ? prev : []
    // Realtime can duplicate an optimistic insert; dedupe on id.
    const id = (row as { id?: string }).id
    if (id && list.some((m: { id?: string }) => m.id === id)) return list
    return [...list, row]
  })
}

function patchById(prev: unknown, row: { id: string }) {
  if (!Array.isArray(prev)) return prev
  return prev.map((r: { id: string }) => (r.id === row.id ? { ...r, ...row } : r))
}

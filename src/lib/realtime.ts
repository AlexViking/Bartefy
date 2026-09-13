import { useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { keys } from './cache/queryClient'
import i18n from '@/i18n'

/* Realtime requires the table to be BOTH on the supabase_realtime publication
 * (036) and readable by the subscriber under RLS -- Supabase filters delivery
 * per subscriber, so a policy that needs auth.uid() delivers nothing to an
 * anonymous socket. Verified on production 2026-09-13 with a real user token:
 * an offer inserted for that user arrives. Testing the same thing as anon
 * receives nothing and proves only that anon cannot read it. */

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
type Offer = { to_user?: string; from_user?: string }
type Match = { user_a?: string; user_b?: string }

export function useRealtime(userId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chan = supabase.channel('user:' + userId) as any

    const channel = chan
      /* A new message bumps the badges. This listened on `messages` until
         035 -- the V3 table nothing has written to since the V4 rebuild -- so
         the callback never ran and the dot never moved.

         It does NOT append to the open thread: useMatchChat holds its own
         channel filtered to the match you are reading, and appending here as
         well put the message in twice. */
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barter_messages' },
        ({ new: row }: { new: { sender_id: string } }) => {
          // Your own message is not unread, and echoes back over the same
          // socket you sent it on.
          if (row.sender_id === userId) return
          qc.invalidateQueries({ queryKey: keys.swaps(userId) })
          qc.invalidateQueries({ queryKey: keys.unread(userId) })
        },
      )

      // Swap status: agreed, arranged, received, frozen, closed.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'swaps' },
        ({ new: row }: { new: { id: string; public_id?: string } }) => {
          qc.setQueryData(keys.swaps(userId), (prev: unknown) => patchById(prev, row))
          qc.invalidateQueries({ queryKey: keys.thread(row.id) })
        },
      )

      /* An offer arriving, or being accepted / declined / cancelled.
         
         This listened on `offers` -- the V3 table -- until now. Every real
         offer has gone to `barter_offers` since the V4 rebuild, so the
         callback never ran once: the badge, the Offers list and the
         Notifications feed all sat still until something else refetched them,
         which in practice meant the person refreshed the app. Same cause as
         the unread dot and for the same reason: the rebuild moved the table
         and left the subscriptions pointing at the old name.

         Two rows change on an offer -- the sender's and the recipient's -- so
         this cannot filter server-side on one column. It takes every event on
         the table and drops the ones that are not about this user, which is
         cheap: the payload is one row. */
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barter_offers' },
        ({ new: row, old: prev }: { new?: Offer; old?: Offer }) => {
          const r = row ?? prev
          if (!r) return
          if (r.to_user !== userId && r.from_user !== userId) return
          /* Everything the Offers screen reads lives under the 'barter'
             prefix -- both list boxes and the badge count -- so one
             invalidation refreshes the lot. Accepting an offer also creates a
             match, which is read under the same prefix. */
          qc.invalidateQueries({ queryKey: ['barter'] })
          // The Notifications feed is derived from offers and matches at read
          // time and keys on its own name, so it needs telling separately.
          qc.invalidateQueries({ queryKey: ['notifications', userId] })
        },
      )

      /* A match opening, for BOTH people.
         
         barter_matches had no subscription at all, so a match pushed nothing
         to anyone. The person who made the offer that completed the pair saw
         the celebration sheet because Hunt shows it locally, off their own
         action -- the other side had no code path to be told at all and found
         out by refreshing.

         A match is created by respond_to_offer (someone accepted) and by the
         037 trigger (two plain likes agreed). Neither is an action the
         recipient took, so this is the only way they learn.

         The toast is deliberately quiet -- no navigation, no modal. It can
         arrive mid-swipe, and hijacking the screen to celebrate would throw
         away the card someone was deciding on. */
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barter_matches' },
        ({ new: row }: { new?: Match }) => {
          if (!row) return
          if (row.user_a !== userId && row.user_b !== userId) return
          qc.invalidateQueries({ queryKey: ['barter'] })
          qc.invalidateQueries({ queryKey: ['notifications', userId] })
          qc.invalidateQueries({ queryKey: keys.unread(userId) })
          /* Fired here rather than through a callback prop: a function passed
             in from App would be a new identity every render, and it would
             have to go in the effect's dep array -- tearing down and
             rebuilding the websocket channel on each one. */
          toast.success(i18n.t('notif.matchTitle'))
        },
      )

      // My items changing status - reserved by an agreement, paused, gone.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items', filter: 'user_id=eq.' + userId },
        ({ new: row }: { new: { id: string; public_id?: string } }) => {
          // setQueryData needs an EXACT key, unlike invalidateQueries, so
          // both scopes are patched by name. Patching only the default one
          // left My Items showing a find as live seconds after it was
          // paused -- the row it renders lives under the 'all' entry.
          qc.setQueryData(keys.myItems(userId, 'active'), (prev: unknown) => patchById(prev, row))
          qc.setQueryData(keys.myItems(userId, 'all'), (prev: unknown) => patchById(prev, row))
          // The detail cache is keyed by the PUBLIC token since migration 029.
          // Postgres sends the bigint in `id`, so the token has to come from
          // the row's own public_id -- passing row.id here invalidated nothing.
          if (row.public_id) qc.invalidateQueries({ queryKey: keys.item(row.public_id) })
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

function patchById(prev: unknown, row: { id: string }) {
  if (!Array.isArray(prev)) return prev
  return prev.map((r: { id: string }) => (r.id === row.id ? { ...r, ...row } : r))
}

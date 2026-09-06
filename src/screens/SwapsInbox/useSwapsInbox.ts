import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getUnreadBySwap } from '@/lib/api'
import { archiveMatch, getMyMatches } from '@/lib/barter'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import type { SwapStatus } from '@/types/swap'

export type InboxTab = 'active' | 'closed'

/** Two tabs, not three. 'activity' sat between these and was hardcoded to
 *  render the empty state before it read any rows, so it was blank for every
 *  user however much had happened. Active and Done already partition every
 *  swap between them, so nothing is lost by dropping it. A real activity feed
 *  — offers, reveals, who is eyeing a find — would be a different surface. */
export const INBOX_TABS: { id: InboxTab; label: string }[] = [
  { id: 'active', label: 'swaps.tabActive' },
  { id: 'closed', label: 'swaps.tabDone' },
]

export interface SwapRow {
  id: string
  isSideA: boolean
  cancelReason: string | null
  title: string
  status: SwapStatus
  photoUrl?: string
  photoColor: string
  /** Messages waiting in this thread, for the dot on the row. */
  unread: number
}

const CLOSED: SwapStatus[] = ['done', 'cancelled']

/** swaps.status in Postgres is CHECK'd to four values
 *  ('proposed','confirmed','completed','cancelled'), but the V3 UI was built
 *  around a richer nine-state flow that was never migrated. Rows therefore
 *  arrive with statuses the client's SwapStatus union does not contain, and
 *  StatusRow's lookup returned undefined — which blanked the whole screen.
 *
 *  This maps the database's vocabulary onto the UI's at the boundary, so the
 *  rest of the app only ever sees a SwapStatus. When the schema catches up to
 *  the nine-state model, this map is the single place to retire.
 */

/** The inbox's data and tab state, with no layout in it. */
export function useSwapsInbox() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [params, setParams] = useSearchParams()
  // Validated rather than cast: a bookmarked ?tab=activity, or any other
  // stale value, would otherwise be a tab that matches no filter and lights no
  // button — the list would show closed swaps with nothing selected. Anything
  // unrecognised falls back to Active.
  const rawTab = params.get('tab')
  const tab: InboxTab = INBOX_TABS.some((t) => t.id === rawTab)
    ? (rawTab as InboxTab)
    : 'active'

  /** Reads barter_matches, not the old swaps table.
   *
   *  The three match states map onto the UI's richer vocabulary at this
   *  boundary: the engine only knows active/completed/cancelled, and the tab
   *  filter only needs to know whether a row is finished.
   */
  const { data: swaps = [], isLoading } = useQuery({
    queryKey: ['barter', 'matches', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getMyMatches(userId!)
      if (error) throw error
      return (data ?? [])
        .filter((m: Record<string, unknown>) => {
          // Archiving is per side: a row one person tidied away must stay in
          // the other person's list.
          const isA = String(m.user_a) === userId
          return !(isA ? m.a_archived : m.b_archived)
        })
        .map((m: Record<string, unknown>): SwapRow => {
          const one = (v: unknown) =>
            (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | null
          const itemA = one(m.itemA)
          const itemB = one(m.itemB)

          // By ownership, never by a/b position: position would show you your
          // own find on half the rows.
          const aIsMine = itemA ? String(itemA.user_id ?? '') === userId : String(m.user_a) === userId
          const theirItem = aIsMine ? itemB : itemA
          const myItem = aIsMine ? itemA : itemB

          const photos = theirItem?.images as string[] | undefined
          const dbStatus = String(m.status ?? 'active')
          const isA = String(m.user_a) === userId
          return {
            /** Which side I am, so Archive writes the right column. */
            isSideA: isA,
            /** 'item_traded_elsewhere' is the wireframe's "no longer
             *  available": the other person traded that find with somebody
             *  else, which is a different thing from a swap being called off
             *  and reads very differently to the person it happened to. */
            cancelReason: (m.cancel_reason as string) ?? null,
            id: String(m.id),
            // A match whose other side was removed still has to render, so
            // fall back to your own find rather than an empty row.
            title: String(theirItem?.title ?? myItem?.title ?? ''),
            status:
              dbStatus === 'completed'
                ? 'done'
                : dbStatus === 'cancelled'
                  ? 'cancelled'
                  : 'chatting',
            photoUrl: photos?.[0],
            photoColor: 'hsl(var(--illo-denim))',
            unread: 0,
          }
        })
    },
    enabled: !!userId,
    staleTime: STALE.realtime,
  })

  /** Which threads have something waiting. Keyed under the same 'unread'
   *  prefix as the nav total, so the existing realtime invalidation refreshes
   *  both on the frame a message arrives. */
  const { data: unreadBySwap = {} } = useQuery({
    queryKey: keys.unreadBySwap(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getUnreadBySwap(userId!)
      if (error) throw error
      return data ?? {}
    },
    enabled: !!userId,
    staleTime: STALE.realtime,
  })

  // Merged after the fact rather than inside the swaps query, so a change to
  // either count does not refetch the other.
  const withUnread = swaps.map((s) => ({ ...s, unread: unreadBySwap[s.id] ?? 0 }))

  const active = withUnread.filter((s) => !CLOSED.includes(s.status))
  const closed = withUnread.filter((s) => CLOSED.includes(s.status))
  const rows = tab === 'closed' ? closed : active

  const archive = async (id: string, isSideA: boolean) => {
    await archiveMatch(id, isSideA)
    qc.invalidateQueries({ queryKey: ['barter'] })
  }

  return {
    archive,
    tab,
    setTab: (t: InboxTab) => setParams(t === 'active' ? {} : { tab: t }),
    rows,
    active,
    closed,
    isLoading,
    openSwap: (id: string) => navigate('/matches/' + id),
    goHunt: () => navigate('/discover'),
  }
}

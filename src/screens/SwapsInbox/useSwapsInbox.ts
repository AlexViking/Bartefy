import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { getMySwaps, getUnreadBySwap } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { STATUS_FROM_DB, type SwapStatus } from '@/types/swap'

export type InboxTab = 'active' | 'activity' | 'closed'

export const INBOX_TABS: { id: InboxTab; label: string }[] = [
  { id: 'active', label: 'swaps.tabActive' },
  { id: 'activity', label: 'swaps.tabActivity' },
  { id: 'closed', label: 'swaps.tabDone' },
]

export interface SwapRow {
  id: string
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
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as InboxTab) ?? 'active'

  const { data: swaps = [], isLoading } = useQuery({
    queryKey: keys.swaps(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getMySwaps(userId!)
      if (error) throw error
      return (data ?? []).map((s: Record<string, unknown>): SwapRow => {
        const itemA = s.item_a as Record<string, unknown> | null
        const itemB = s.item_b as Record<string, unknown> | null

        // item_a does NOT reliably belong to user_a in the existing rows, so
        // choosing by a/b position shows you your own find. Decide by who
        // actually owns each item, and fall back to position only when the
        // item row could not be joined.
        const aIsMine = itemA ? String(itemA.user_id ?? '') === userId : s.user_a_id === userId
        const theirItem = aIsMine ? itemB : itemA
        const myItem = aIsMine ? itemA : itemB

        const photos = theirItem?.images as string[] | undefined
        return {
          id: String(s.id),
          // A swap whose other side was deleted still has to render — the row
          // falls back to your own find's title rather than an empty row.
          title: String(theirItem?.title ?? myItem?.title ?? ''),
          status: STATUS_FROM_DB[String(s.status ?? '')] ?? 'new',
          photoUrl: photos?.[0],
          photoColor: 'hsl(var(--illo-denim))',
          // Filled in below, once the per-swap counts have loaded.
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

  return {
    tab,
    setTab: (t: InboxTab) => setParams(t === 'active' ? {} : { tab: t }),
    rows,
    active,
    closed,
    isLoading,
    openSwap: (id: string) => navigate('/swaps/' + id),
    goHunt: () => navigate('/hunt'),
  }
}

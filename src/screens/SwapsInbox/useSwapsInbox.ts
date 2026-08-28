import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { getMySwaps } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import type { SwapStatus } from '@/types/swap'

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
}

const CLOSED: SwapStatus[] = ['done', 'cancelled']

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
        const theirItem = s.user_a_id === userId ? itemB : itemA
        const photos = theirItem?.images as string[] | undefined
        return {
          id: String(s.id),
          title: String(theirItem?.title ?? ''),
          status: String(s.status ?? 'new') as SwapStatus,
          photoUrl: photos?.[0],
          photoColor: 'hsl(var(--illo-denim))',
        }
      })
    },
    enabled: !!userId,
    staleTime: STALE.realtime,
  })

  const active = swaps.filter((s) => !CLOSED.includes(s.status))
  const closed = swaps.filter((s) => CLOSED.includes(s.status))
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

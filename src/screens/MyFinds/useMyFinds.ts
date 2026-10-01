import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router'

import { useNeedsYou, type ExpiringOffer } from '@/components/deck/NeedsYou'
import { deleteItem, getMyItems, setItemStatus } from '@/lib/api'
import { barterErrorKey, renewItem } from '@/lib/barter'
import { keys } from '@/lib/cache/queryClient'
import { getGrants } from '@/lib/points'
import { splitWants } from '@/lib/taxonomy'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>
const DAY = 86_400_000
/** A find with this little left is "leaving the deck soon". */
export const SOON_DAYS = 3

export interface MyFind {
  id: string
  publicId: string
  title: string
  description: string
  category: string
  categories: string[]
  condition: number
  photos: string[]
  /** items.photo_meta, in the same order as photos -- sizes when stored. */
  photoMeta: { w?: number | null; h?: number | null }[]
  status: 'active' | 'paused' | 'reserved'
  expiresAt: string | null
  /** Whole days until it leaves the deck; null for paused or in a swap. */
  daysLeft: number | null
  wantsCats: string[]
  wantsNote: string
  wantsRaw: string[]
  offers: ExpiringOffer[]
  boosted: boolean
  createdAt: string
}

export type FindsTab = 'table' | 'paused'

/** My finds (V6, proposal B): what is on your table, what needs you, and --
 *  since Item detail is cut -- the one place to renew, pause, edit or remove a
 *  find. */
export function useMyFinds() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { findId } = useParams<{ findId?: string }>()
  const tab: FindsTab = new URLSearchParams(useLocation().search).get('tab') === 'paused' ? 'paused' : 'table'
  const needs = useNeedsYou()
  const on = !!userId

  const items = useQuery({
    queryKey: keys.myItems(userId ?? '', 'all'),
    queryFn: async () => {
      const { data, error } = await getMyItems(userId!, true)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: on,
    staleTime: 60_000,
  })

  // Live boosts: point_grants with the find as subject.
  const grants = useQuery({
    queryKey: ['points', 'grants', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getGrants(userId!)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: on,
    staleTime: 60_000,
  })
  const boostedIds = new Set((grants.data ?? []).filter((g) => g.perk === 'boost').map((g) => String(g.subject)))

  const now = Date.now()
  const finds: MyFind[] = (items.data ?? [])
    .filter((it) => ['active', 'paused', 'reserved'].includes(String(it.status)))
    .map((it) => {
      const status = String(it.status) as MyFind['status']
      const exp = it.expires_at ? Date.parse(String(it.expires_at)) : NaN
      const wants = splitWants(it.wants_in_return)
      return {
        id: String(it.id),
        publicId: String(it.public_id ?? ''),
        title: String(it.title ?? ''),
        description: String(it.description ?? ''),
        category: String(it.category ?? 'other'),
        categories: Array.isArray(it.categories) ? (it.categories as string[]).map(String) : [String(it.category ?? 'other')],
        condition: Number(it.condition ?? 4),
        photos: Array.isArray(it.images) ? (it.images as unknown[]).map(String) : [],
        photoMeta: Array.isArray(it.photo_meta) ? (it.photo_meta as { w?: number | null; h?: number | null }[]) : [],
        status,
        expiresAt: it.expires_at ? String(it.expires_at) : null,
        daysLeft: status === 'active' && Number.isFinite(exp) ? Math.max(0, Math.ceil((exp - now) / DAY)) : null,
        wantsCats: wants.categories,
        wantsNote: wants.note,
        wantsRaw: Array.isArray(it.wants_in_return) ? (it.wants_in_return as string[]).map(String) : [],
        offers: needs.expiring.filter((o) => o.wantedId === String(it.id)),
        boosted: boostedIds.has(String(it.id)),
        createdAt: String(it.created_at ?? ''),
      }
    })

  // On the table: live first by what needs you (soonest to leave), then the
  // ones in a swap. Paused on their own tab.
  const table = finds
    .filter((f) => f.status !== 'paused')
    .sort((a, b) => (a.status === 'reserved' ? 1 : 0) - (b.status === 'reserved' ? 1 : 0) || (a.daysLeft ?? 99) - (b.daysLeft ?? 99))
  const paused = finds.filter((f) => f.status === 'paused')
  const shown = tab === 'paused' ? paused : table
  // The URL carries the PUBLIC id (029): items.id is sequential, so a bigint
  // in the address bar would count and enumerate the catalogue.
  const selected = findId ? (finds.find((f) => f.publicId === findId) ?? null) : null

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['my-items'] })
    void qc.invalidateQueries({ queryKey: ['barter'] })
    void qc.invalidateQueries({ queryKey: ['feed'] })
  }

  const act = useMutation({
    mutationFn: async ({ f, what }: { f: MyFind; what: 'pause' | 'resume' | 'renew' | 'remove' }) => {
      if (what === 'renew') {
        const { error } = await renewItem(f.id)
        if (error) throw error
        return
      }
      if (what === 'remove') {
        const { error } = await deleteItem(f.id)
        if (error) throw error
        return
      }
      const { data, error } = await setItemStatus(f.id, what === 'pause' ? 'paused' : 'active')
      if (error) throw error
      // Zero rows back means the database refused it without saying so.
      if (!data || data.length === 0) throw { code: 'NOROWS' }
    },
    onSuccess: () => refresh(),
  })

  return {
    tab,
    setTab: (t: FindsTab) => navigate(t === 'paused' ? '/items?tab=paused' : '/items', { replace: true }),
    finds,
    table,
    paused,
    shown,
    selected,
    missing: !!findId && !selected && !items.isLoading,
    select: (f: MyFind | null) => navigate(f ? `/items/${f.publicId}${tab === 'paused' ? '?tab=paused' : ''}` : `/items${tab === 'paused' ? '?tab=paused' : ''}`),
    isLoading: items.isLoading,
    /** The list has actually arrived (or failed). A query that has not
     *  started yet -- no session in the store -- is not "loading", so
     *  isLoading alone reads as "done, and empty". */
    settled: items.isSuccess || items.isError,
    error: items.error,
    leavingSoon: table.filter((f) => f.daysLeft !== null && f.daysLeft <= SOON_DAYS),
    offersWaiting: needs.expiring.length,
    inSwap: table.filter((f) => f.status === 'reserved'),
    act: (f: MyFind, what: 'pause' | 'resume' | 'renew' | 'remove') => act.mutateAsync({ f, what }),
    busy: act.isPending,
    actError: act.error ? barterErrorKey(act.error as { code?: string }) : null,
    refresh,
  }
}

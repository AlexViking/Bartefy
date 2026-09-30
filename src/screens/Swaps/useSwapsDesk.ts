import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router'

import { getUnreadBySwap } from '@/lib/api'
import { getIncomingOffers, getMyMatches, getSentOffers } from '@/lib/barter'
import { keys, STALE } from '@/lib/cache/queryClient'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const photo = (r: Row | null) => (Array.isArray(r?.images) && r!.images.length ? String((r!.images as unknown[])[0]) : undefined)

export interface Find {
  title: string
  photo?: string
  category?: string
  condition?: number
}

export interface Person {
  id: string
  name: string
  swaps: number
}

export interface OfferItem {
  kind: 'offer'
  id: string
  /** Offers to me, or mine to them. */
  box: 'in' | 'out'
  who: Person
  /** What I would get, and what I would give. */
  theirs: Find
  mine: Find
  note: string | null
  expiresAt: string | null
  isSuper: boolean
  createdAt: string
}

export interface SwapItem {
  kind: 'swap'
  id: string
  who: Person
  theirs: Find
  mine: Find
  status: 'active' | 'completed' | 'cancelled'
  cancelReason: string | null
  mineConfirmed: boolean
  theirsConfirmed: boolean
  createdAt: string
  completedAt: string | null
  unread: number
  last: { mine: boolean; body: string; kind: 'text' | 'audio'; at: string } | null
}

export type DeskItem = OfferItem | SwapItem

export type GroupId = 'offers' | 'turn' | 'none' | 'wait' | 'sent' | 'archive'

/** Swaps & offers -- "Active Swaps at volume", proposal B (Alex, 2026-09-28).
 *
 *  One screen, list + detail. The list is grouped by what each row waits on:
 *
 *    offers   Offers to you        yes or no within 24h (super/multi only --
 *                                  free likes are private, see Admirers)
 *    turn     Your turn to confirm they already did
 *    none     Agreed, not swapped  nobody has confirmed yet
 *    wait     Waiting for them     you confirmed
 *    sent     Your offers          waiting for an answer
 *    archive  Archive              swapped (or called off) -- chat closed
 *
 *  Chat lives here (2026-09-28): an agreed swap's row IS its conversation.
 *
 *  Names come from profiles_public. A join through `profiles` returns null for
 *  everyone but staff -- RLS lets a person read only their own row there -- so
 *  the old inbox showed a blank name to every normal user.
 */
export function useSwapsDesk() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const navigate = useNavigate()
  const { swapId } = useParams<{ swapId?: string }>()
  const { search } = useLocation()
  const offerId = new URLSearchParams(search).get('offer')
  const on = !!userId

  const incoming = useQuery({
    queryKey: ['barter', 'desk', 'incoming', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: on,
    staleTime: STALE.realtime,
  })

  const sent = useQuery({
    queryKey: ['barter', 'desk', 'sent', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getSentOffers(userId!)
      if (error) throw error
      return ((data ?? []) as Row[]).filter((o) => o.status === 'pending')
    },
    enabled: on,
    staleTime: STALE.realtime,
  })

  const matches = useQuery({
    queryKey: ['barter', 'desk', 'matches', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getMyMatches(userId!)
      if (error) throw error
      return ((data ?? []) as Row[]).filter((m) => {
        const isA = String(m.user_a) === userId
        return !(isA ? m.a_archived : m.b_archived)
      })
    },
    enabled: on,
    staleTime: STALE.realtime,
  })

  const matchIds = (matches.data ?? []).map((m) => String(m.id))

  /** The last line of every thread, in one query. RLS returns only threads I
   *  am in. 400 rows covers the newest line of any realistic list. */
  const lastLines = useQuery({
    queryKey: ['barter', 'desk', 'last', userId ?? '', matchIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barter_messages')
        .select('match_id, sender_id, body, kind, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false })
        .limit(400)
      if (error) throw error
      const out: Record<string, Row> = {}
      for (const m of (data ?? []) as Row[]) {
        const k = String(m.match_id)
        if (!out[k]) out[k] = m
      }
      return out
    },
    enabled: on && matchIds.length > 0,
    staleTime: STALE.realtime,
  })

  const { data: unreadBySwap = {} } = useQuery({
    queryKey: keys.unreadBySwap(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getUnreadBySwap(userId!)
      if (error) throw error
      return data ?? {}
    },
    enabled: on,
    staleTime: STALE.realtime,
  })

  // Everyone on the other side of a row, looked up once.
  const otherIds = [
    ...(incoming.data ?? []).map((o) => String(o.from_user)),
    ...(sent.data ?? []).map((o) => String(o.to_user)),
    ...(matches.data ?? []).map((m) => String(String(m.user_a) === userId ? m.user_b : m.user_a)),
  ]
  const uniq = [...new Set(otherIds)].sort()
  const people = useQuery({
    queryKey: ['profiles-public', uniq.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles_public').select('id, name, completed_trades').in('id', uniq)
      if (error) throw error
      const out: Record<string, Person> = {}
      for (const p of (data ?? []) as Row[]) {
        out[String(p.id)] = { id: String(p.id), name: String(p.name ?? ''), swaps: Number(p.completed_trades ?? 0) }
      }
      return out
    },
    enabled: on && uniq.length > 0,
    staleTime: 5 * 60_000,
  })
  const person = (id: string): Person => people.data?.[id] ?? { id, name: '', swaps: 0 }

  const find = (r: Row | null): Find => ({
    title: String(r?.title ?? ''),
    photo: photo(r),
    category: r?.category ? String(r.category) : undefined,
    condition: r?.condition != null ? Number(r.condition) : undefined,
  })

  const offersIn: OfferItem[] = (incoming.data ?? [])
    .map((o) => ({
      kind: 'offer' as const,
      id: String(o.id),
      box: 'in' as const,
      who: person(String(o.from_user)),
      theirs: find(one(o.offered)),
      mine: find(one(o.wanted)),
      note: (o.note as string) ?? null,
      expiresAt: o.expires_at ? String(o.expires_at) : null,
      isSuper: Boolean(o.is_priority),
      createdAt: String(o.created_at ?? ''),
    }))
    // Soonest deadline first: that is the order the decisions are due in.
    .sort((a, b) => (a.expiresAt ?? '9') < (b.expiresAt ?? '9') ? -1 : 1)

  const offersOut: OfferItem[] = (sent.data ?? []).map((o) => ({
    kind: 'offer' as const,
    id: String(o.id),
    box: 'out' as const,
    who: person(String(o.to_user)),
    theirs: find(one(o.wanted)),
    mine: find(one(o.offered)),
    note: (o.note as string) ?? null,
    expiresAt: o.expires_at ? String(o.expires_at) : null,
    isSuper: Boolean(o.is_priority),
    createdAt: String(o.created_at ?? ''),
  }))

  const swaps: SwapItem[] = (matches.data ?? []).map((m) => {
    const isA = String(m.user_a) === userId
    // item_a is user_a's by construction (037): decide from the match, never
    // from an embedded row that RLS might have hidden.
    const mineRow = one(isA ? m.itemA : m.itemB)
    const theirsRow = one(isA ? m.itemB : m.itemA)
    const last = lastLines.data?.[String(m.id)]
    return {
      kind: 'swap' as const,
      id: String(m.id),
      who: person(String(isA ? m.user_b : m.user_a)),
      theirs: find(theirsRow),
      mine: find(mineRow),
      status: String(m.status ?? 'active') as SwapItem['status'],
      cancelReason: (m.cancel_reason as string) ?? null,
      mineConfirmed: Boolean(isA ? m.a_confirmed : m.b_confirmed),
      theirsConfirmed: Boolean(isA ? m.b_confirmed : m.a_confirmed),
      createdAt: String(m.created_at ?? ''),
      completedAt: m.completed_at ? String(m.completed_at) : null,
      unread: unreadBySwap[String(m.id)] ?? 0,
      last: last
        ? {
            mine: String(last.sender_id) === userId,
            body: String(last.body ?? ''),
            kind: last.kind === 'audio' ? 'audio' : 'text',
            at: String(last.created_at ?? ''),
          }
        : null,
    }
  })

  const byRecent = (a: SwapItem, b: SwapItem) =>
    (b.last?.at ?? b.createdAt) > (a.last?.at ?? a.createdAt) ? 1 : -1
  const live = swaps.filter((s) => s.status === 'active').sort(byRecent)
  const groups: { id: GroupId; items: DeskItem[] }[] = [
    { id: 'offers', items: offersIn },
    { id: 'turn', items: live.filter((s) => s.theirsConfirmed && !s.mineConfirmed) },
    { id: 'none', items: live.filter((s) => !s.theirsConfirmed && !s.mineConfirmed) },
    { id: 'wait', items: live.filter((s) => s.mineConfirmed && !s.theirsConfirmed) },
    { id: 'sent', items: offersOut },
    {
      id: 'archive',
      items: swaps
        .filter((s) => s.status !== 'active')
        .sort((a, b) => ((b.completedAt ?? b.createdAt) > (a.completedAt ?? a.createdAt) ? 1 : -1)),
    },
  ]

  const all: DeskItem[] = groups.flatMap((g) => g.items)
  const selected: DeskItem | null = swapId
    ? (swaps.find((s) => s.id === swapId) ?? null)
    : offerId
      ? ([...offersIn, ...offersOut].find((o) => o.id === offerId) ?? null)
      : null

  return {
    userId,
    groups,
    all,
    selected,
    /** A deep link to something that is not (or no longer) in the lists --
     *  an old notification, a swap archived elsewhere. */
    missing: !!(swapId || offerId) && !selected && !matches.isLoading && !incoming.isLoading,
    counts: { offers: offersIn.length, agreed: live.length },
    isLoading: incoming.isLoading || matches.isLoading,
    error: incoming.error || matches.error || sent.error,
    select: (item: DeskItem | null, replace = false) =>
      navigate(!item ? '/matches' : item.kind === 'swap' ? '/matches/' + item.id : '/matches?offer=' + item.id, { replace }),
  }
}

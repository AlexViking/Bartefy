import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useShellData } from '@/components/shell/useShellData'
import { track } from '@/lib/analytics'
import { barterErrorKey, respondToBarterOffer } from '@/lib/barter'
import { pointsErrorKey, spendOnTier, TIER_PRICES } from '@/lib/points'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const photo = (r: Row | null) => (Array.isArray(r?.images) && r!.images.length ? String((r!.images as unknown[])[0]) : undefined)

const DAY = 86_400_000

export interface Admirer {
  id: string
  createdAt: string
  /** Under a day old. */
  fresh: boolean
  mine: { id: string; title: string; photo?: string }
  /** Only for Collector and Curator -- see the note on the query. */
  theirs?: { title: string; photo?: string }
  who?: { id: string; name: string }
}

/** Admirers (V6 step 5): who put one of their finds on the table for one of
 *  yours, for free.
 *
 *  In the engine a plain Put on Table is an offer row with is_priority =
 *  false, kept private from the owner (037). Since 049 they no longer expire.
 *  Collector sees them and can answer: Swap accepts (the match, and "It's a
 *  bartefy!"), Pass declines quietly -- the sender only ever sees their
 *  pending offers, so a pass simply stops being pending.
 *
 *  A Hunter sees that they exist, and for which of their finds -- nothing
 *  about WHO or WHAT. That is not a blur over real data: the query for a
 *  Hunter does not ask for the other person or their find at all, so there is
 *  nothing in the browser to un-blur. (RLS still lets a Hunter read the rows
 *  directly; enforcing Collector-only in SQL is a server change.)
 */
export function useAdmirers() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const shell = useShellData()
  const qc = useQueryClient()
  const unlocked = shell.tier !== 'hunter'
  const on = !!userId

  const list = useQuery({
    queryKey: ['barter', 'admirers', userId ?? '', unlocked ? 'full' : 'locked'],
    queryFn: async () => {
      const cols = unlocked
        ? `id, created_at, from_user,
           wanted:items!barter_offers_wanted_item_id_fkey (id, title, images),
           offered:items!barter_offers_offered_item_id_fkey (id, title, images)`
        : `id, created_at, wanted:items!barter_offers_wanted_item_id_fkey (id, title, images)`
      const { data, error } = await supabase
        .from('barter_offers')
        .select(cols)
        .eq('to_user', userId!)
        .eq('status', 'pending')
        .eq('is_priority', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as unknown as Row[]

      // Names through profiles_public: `profiles` is own-row only for
      // anyone who is not staff, so a join there is null.
      const names: Record<string, string> = {}
      if (unlocked && rows.length) {
        const ids = [...new Set(rows.map((r) => String(r.from_user)))]
        const { data: people, error: pe } = await supabase.from('profiles_public').select('id, name').in('id', ids)
        if (pe) throw pe
        for (const p of (people ?? []) as Row[]) names[String(p.id)] = String(p.name ?? '')
      }

      const now = Date.now()
      return rows.map((r): Admirer => {
        const w = one(r.wanted)
        const o = one(r.offered)
        return {
          id: String(r.id),
          createdAt: String(r.created_at ?? ''),
          fresh: now - Date.parse(String(r.created_at)) < DAY,
          mine: { id: String(w?.id ?? ''), title: String(w?.title ?? ''), photo: photo(w) },
          theirs: unlocked && o ? { title: String(o.title ?? ''), photo: photo(o) } : undefined,
          who: unlocked ? { id: String(r.from_user), name: names[String(r.from_user)] ?? '' } : undefined,
        }
      })
    },
    enabled: on,
    staleTime: 60_000,
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['barter'] })
  }

  const answer = useMutation({
    mutationFn: async ({ a, accept }: { a: Admirer; accept: boolean }) => {
      const { data, error } = await respondToBarterOffer(a.id, accept)
      if (error) throw error
      return data as { id: string } | null
    },
    onSuccess: (_m, { accept }) => {
      track(accept ? 'offer_accepted' : 'offer_declined')
      if (accept) track('match_made', { via: 'admirers' })
      refresh()
    },
  })

  const goCollector = useMutation({
    mutationFn: async () => {
      const { error } = await spendOnTier('collector')
      if (error) throw error
    },
    onSuccess: () => {
      track('points_spent', { perk: 'collector', price: TIER_PRICES.collector })
      void qc.invalidateQueries({ queryKey: ['points'] })
      void qc.invalidateQueries({ queryKey: ['profile'] })
      refresh()
    },
  })

  const items = list.data ?? []
  const week = items.filter((a) => Date.now() - Date.parse(a.createdAt) < 7 * DAY).length

  return {
    shell,
    unlocked,
    items,
    week,
    isLoading: list.isLoading,
    error: list.error,
    swap: (a: Admirer) => answer.mutateAsync({ a, accept: true }),
    pass: (a: Admirer) => answer.mutate({ a, accept: false }),
    busyId: answer.isPending ? answer.variables?.a.id : undefined,
    answerError: answer.error ? barterErrorKey(answer.error as { code?: string }) : null,
    goCollector: () => goCollector.mutateAsync(),
    buying: goCollector.isPending,
    buyError: goCollector.error ? pointsErrorKey(goCollector.error as { code?: string }) : null,
    price: TIER_PRICES.collector,
  }
}

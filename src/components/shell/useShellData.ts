import { useQuery } from '@tanstack/react-query'

import { getIncomingOffers } from '@/lib/barter'
import { getProfile, getMyItems } from '@/lib/api'
import { keys } from '@/lib/cache/queryClient'
import { getBalance, getStreak } from '@/lib/points'
import { supabase } from '@/lib/supabase'
import type { Tier } from '@/lib/membership'
import { useUnread } from '@/lib/useUnread'
import { useAuthStore } from '@/store/auth'

/** Everything the V6 shell draws, with no layout in it.
 *
 *  The shell is mounted ONCE, above the router (ShellLayout), so these queries
 *  run once per session rather than once per navigation. Every key is shared
 *  with the screen that owns the same data, so a screen and the bar can never
 *  show two different numbers: ['points','balance'] with Points & Tiers,
 *  keys.profile with Profile, keys.myItems with My finds.
 */
export function useShellData() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const email = useAuthStore((s) => s.session?.user?.email) ?? ''
  const on = !!userId
  const unread = useUnread()

  /** Super and multi offers waiting on me -- the visible ones. */
  const { data: offers = 0 } = useQuery({
    queryKey: keys.barterOffersCount(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []).length
    },
    enabled: on,
    staleTime: 60_000,
  })

  /** Admirers: free likes on my finds. Private to the sender until now --
   *  049 made them last, and the Admirers page (V6 step 5) shows them. RLS
   *  lets the recipient read their own rows; head:true fetches no rows. */
  const { data: admirers = 0 } = useQuery({
    queryKey: ['barter', 'admirers-count', userId ?? ''],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('barter_offers')
        .select('id', { count: 'exact', head: true })
        .eq('to_user', userId!)
        .eq('status', 'pending')
        .eq('is_priority', false)
      if (error) throw error
      return count ?? 0
    },
    enabled: on,
    staleTime: 60_000,
  })

  const { data: profile } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getProfile(userId!)
      if (error) throw error
      return data as Record<string, unknown>
    },
    enabled: on,
    staleTime: 5 * 60_000,
  })

  const { data: items = [] } = useQuery({
    queryKey: keys.myItems(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getMyItems(userId!)
      if (error) throw error
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: on,
    staleTime: 60_000,
  })

  const { data: points = 0 } = useQuery({
    queryKey: ['points', 'balance', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getBalance(userId!)
      if (error) throw error
      return Number(data ?? 0)
    },
    enabled: on,
    staleTime: 60_000,
  })

  const { data: streak } = useQuery({
    queryKey: ['points', 'streak', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getStreak(userId!)
      if (error) throw error
      return data
    },
    enabled: on,
    staleTime: 60_000,
  })

  // A paid tier only counts while it is valid -- the same rule entitlements()
  // applies. An expired Collector is a Hunter again.
  const until = profile?.tier_valid_until ? Date.parse(String(profile.tier_valid_until)) : 0
  const rawTier = String(profile?.tier ?? 'hunter') as Tier
  const tier: Tier = rawTier !== 'hunter' && until > Date.now() ? rawTier : 'hunter'

  // The streak row is written by claim_daily_visit on app open. "Claimed" is
  // whether today's visit is already recorded. The server's "today" is
  // current_date, which is UTC on Supabase -- compared any other way, Tbilisi
  // (UTC+4) would read "unclaimed" from midnight until 04:00.
  const today = new Date().toISOString().slice(0, 10)
  const streakDays = Number(streak?.streak ?? 0)
  const claimedToday = String(streak?.last_visit ?? '') === today

  return {
    userId,
    email,
    name: String(profile?.name ?? profile?.display_name ?? ''),
    avatar: (profile?.avatar_url as string | null | undefined) ?? null,
    isStaff: Boolean(profile?.is_staff),
    tier,
    points,
    streakDays,
    claimedToday,
    offers,
    unread,
    admirers,
    liveFinds: items.filter((it) => it.status === 'active').length,
  }
}

export type ShellData = ReturnType<typeof useShellData>

/** Counts never read past 99 (Alex, 2026-09-29). */
export const cap = (n: number) => (n > 99 ? '99+' : String(n))

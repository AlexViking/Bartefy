import { supabase } from '@/lib/supabase'

/** Points — the currency until card payments exist.
 *
 *  Earned by doing what the product wants more of, spent on the same things
 *  money will buy later. `spendOnTier` writes profiles.tier and
 *  tier_valid_until, which is exactly what Stripe's checkout will write, so
 *  adding payments later is a second path to one state rather than a parallel
 *  system. See migrations 024 and 025.
 */

export type EarnReason =
  | 'list_find'
  | 'offer_accepted'
  | 'swap_completed'
  | 'referral_first_swap'
  | 'daily_visit'
  | 'backfill'

export type SpendReason =
  | 'buy_tier'
  | 'buy_boost'
  | 'buy_eyeing'
  | 'buy_radius'
  /** A super offer -- points spent to reach the top of one owner's list. */
  | 'buy_super'

export type PointReason = EarnReason | SpendReason

export interface PointEvent {
  id: number
  delta: number
  reason: PointReason
  subject: string | null
  created_at: string
}

/** What each action is worth. Mirrors public.point_value so the screen can
 *  show the table without a round trip per row; the database remains the
 *  authority that actually pays out. */
export const EARN_RATES: { reason: EarnReason; points: number }[] = [
  { reason: 'list_find', points: 20 },
  { reason: 'offer_accepted', points: 60 },
  { reason: 'swap_completed', points: 160 },
  { reason: 'referral_first_swap', points: 400 },
]

/** Listing is the only action with no counterparty, so it is the only one that
 *  can be farmed alone. The first ten listings a month earn points; listing
 *  itself stays unlimited (migration 023 removed those caps deliberately). */
export const PAID_LISTINGS_PER_MONTH = 10

/** What day N of a visit streak pays. Mirrors public.visit_value.
 *  2,3,4,5,6,7 then flat -- a perfect week is 34 points. */
export const visitValue = (streak: number) => Math.min(1 + Math.max(streak, 1), 7)
export const MAX_VISIT_VALUE = 7

/** Prices, mirroring public.tier_price and public.perk_price.
 *
 *  The ratios come from the tier sheet's credit wallet: a boost is the
 *  cheapest consumable, an unlock sits just under it, and a month of a tier is
 *  the commitment. Expressed in earned points rather than purchased credits,
 *  because there is no card payment yet. */
export const TIER_PRICES = { collector: 600, curator: 1500 } as const
export const PERK_PRICES = { boost: 75, eyeing: 50, radius: 120, super: 50 } as const
/** How long each perk lasts. `super` is 0: it is spent on ONE offer rather
 *  than opening a window, so it writes no point_grants row at all -- the
 *  priority lives on the offer itself. Listed here so a lookup cannot return
 *  undefined. */
export const PERK_DAYS = { boost: 1, eyeing: 7, radius: 7, super: 0 } as const

export type Perk = keyof typeof PERK_PRICES

export async function getBalance(userId: string) {
  return supabase.rpc('points_balance', { p_user: userId })
}

/** The ledger, newest first. Every point traces to the thing that earned it. */
export async function getLedger(userId: string, limit = 50) {
  return supabase
    .from('point_events')
    .select('id, delta, reason, subject, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function spendOnTier(tier: 'collector' | 'curator') {
  return supabase.rpc('spend_points_on_tier', { p_tier: tier })
}

export async function spendOnPerk(perk: Perk, subject?: string) {
  return supabase.rpc('spend_points_on_perk', {
    p_perk: perk,
    p_subject: subject ?? null,
  })
}

/** Live perk grants — what you have bought that has not expired. */
export async function getGrants(userId: string) {
  return supabase
    .from('point_grants')
    .select('id, perk, subject, expires_at')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
}

/** Claim today's visit. Idempotent per user per day -- the guard is a stored
 *  date, not the caller, so calling it repeatedly pays once. Safe to fire on
 *  every app open. */
export async function claimDailyVisit() {
  return supabase.rpc('claim_daily_visit')
}

export interface VisitStreak {
  last_visit: string
  streak: number
  best_streak: number
}

export async function getStreak(userId: string) {
  return supabase
    .from('visit_streaks')
    .select('last_visit, streak, best_streak')
    .eq('user_id', userId)
    .maybeSingle()
}

/** The database raises these; the screen turns them into copy. */
export function pointsErrorKey(error: { code?: string } | null): string {
  switch (error?.code) {
    case 'P0011':
      return 'points.errorNotEnough'
    case 'P0010':
      return 'points.errorNotForSale'
    case 'P0012':
      return 'points.errorWhichFind'
    case '28000':
      return 'points.errorSignedOut'
    default:
      return 'barter.errorGeneric'
  }
}

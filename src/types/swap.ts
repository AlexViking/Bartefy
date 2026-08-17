/** Shared domain types for the atomic components.
 *  Aligned with the Supabase rows in lib/api.ts, plus the fields the new flows
 *  need (see MAPPING.md - schema gaps).
 */

export interface ItemRef {
  id: string
  title: string
  /** Placeholder fill until real photography lands. */
  photoColor?: string
  photoUrl?: string
  condition?: string
  category?: string
}

export interface PersonRef {
  id: string
  name: string
  avatarUrl?: string
  rating?: number
  swapCount?: number
  verified?: boolean
  distanceLabel?: string
}

/** Extends store/swaps.ts SwapState with the states the handover flow needs. */
export type SwapStatus =
  | 'new'
  | 'chatting'
  | 'offered'
  | 'agreed'
  | 'arranged'
  | 'received_one_side'
  | 'done'
  | 'cancelled'
  | 'frozen'

export interface OfferSide {
  person: PersonRef
  items: ItemRef[]
}

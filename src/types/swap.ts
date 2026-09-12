/** Shared domain types for the atomic components.
 *  Aligned with the Supabase rows in lib/api.ts, plus the fields the new flows
 *  need (see MAPPING.md - schema gaps).
 */

export interface ItemRef {
  /** The bigint. Every FK references it -- offers, swipes, matches. */
  id: string
  /** The URL token (migration 029). Optional because a swap pair's item
   *  reference does not always carry one; a row that links out must. */
  publicId?: string
  title: string
  /** Placeholder fill until real photography lands. */
  photoColor?: string
  /** The first photo's aspect ratio from items.photo_meta, stored at upload.
   *  Null for listings created before it was written -- those learn it from
   *  the image on load, as before. */
  photoRatio?: number | null
  photoUrl?: string
  condition?: string
  category?: string
  /** Days until the listing expires. Undefined where it does not apply --
   *  someone else's find in a swap pair has no expiry worth showing you. */
  daysLeft?: number
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

/** swaps.status in Postgres is CHECK'd to four values; the UI speaks nine.
 *  The schema was never migrated to the richer flow, so every read must map
 *  in and every write must map out. Both directions live here so the inbox,
 *  the chat screen and the API layer cannot drift apart.
 */
export const STATUS_FROM_DB: Record<string, SwapStatus> = {
  proposed: 'new',
  confirmed: 'agreed',
  completed: 'done',
  cancelled: 'cancelled',
}

export const STATUS_TO_DB: Record<string, string> = {
  new: 'proposed',
  chatting: 'proposed',
  offered: 'proposed',
  agreed: 'confirmed',
  arranged: 'confirmed',
  received_one_side: 'confirmed',
  done: 'completed',
  cancelled: 'cancelled',
}

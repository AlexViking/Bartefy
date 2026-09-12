import { supabase } from './supabase'

/** The offer -> accept engine (migrations 015-017).
 *
 *  Kept apart from lib/api.ts on purpose. That file still holds the mutual-like
 *  functions -- createOffer, respondToOffer, getMySwaps -- which read the old
 *  swaps and offers tables. Both sets are live at once while the screens move
 *  across, and mixing them in one file makes it far too easy to call the wrong
 *  one. When the last screen has moved, the old ones go.
 *
 *  Every state change here is an RPC, never a table write: accepting an offer
 *  reserves two items and creates a match in one transaction, and no client
 *  should be able to do half of that.
 */

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
export type MatchStatus = 'active' | 'completed' | 'cancelled'

export type BarterOffer = {
  id: string
  from_user: string
  to_user: string
  offered_item_id: number
  wanted_item_id: number
  note: string | null
  status: OfferStatus
  created_at: string
  responded_at: string | null
}

export type BarterMatch = {
  id: string
  offer_id: string
  user_a: string
  user_b: string
  item_a: number
  item_b: number
  status: MatchStatus
  a_confirmed: boolean
  b_confirmed: boolean
  a_archived: boolean
  b_archived: boolean
  cancel_reason: string | null
  created_at: string
  completed_at: string | null
}

/** The item shape these screens need. Narrower than the full row: the offer
 *  inbox renders a title, a photo and an owner, not a whole listing. */
export type BarterItem = {
  id: number
  title: string
  images: string[]
  category: string | null
  condition: number | null
  user_id: string
}

// ── Offers ──────────────────────────────────────────────────────────────────

/** "I want your bike, here is my lamp."
 *
 *  Strictly one item for one item. The server checks that the offered item is
 *  yours and available, that the wanted item is still active, and that neither
 *  side has blocked the other -- so none of those need checking here, and a
 *  client that skipped them would simply be refused.
 */
export async function makeOffer(input: {
  offeredItemId: number
  wantedItemId: number
  note?: string
}) {
  return supabase.rpc('make_offer', {
    p_offered_item_id: input.offeredItemId,
    p_wanted_item_id: input.wantedItemId,
    p_note: input.note ?? null,
  })
}

/** The same offer, but at the top of the owner's list. Paid in points.
 *
 *  One RPC, not "spend then offer": charging the points and writing the
 *  priority onto the offer have to be the same transaction, or a failure
 *  between them takes the points and delivers nothing, and the client has no
 *  way to make that right.
 *
 *  make_super_offer calls make_offer internally rather than duplicating it, so
 *  every rule that governs an ordinary offer governs this one too. It buys
 *  ATTENTION, never the trade -- accepting stays entirely the owner's choice.
 */
export async function makeSuperOffer(input: {
  offeredItemId: number
  wantedItemId: number
  note?: string
}) {
  return supabase.rpc('make_super_offer', {
    p_offered_item_id: input.offeredItemId,
    p_wanted_item_id: input.wantedItemId,
    p_note: input.note ?? null,
  })
}

/** Accept or decline. Accepting creates the match, reserves both items and
 *  opens the chat, all in one transaction. Returns the match on accept and
 *  null on decline. */
export async function respondToBarterOffer(offerId: string, accept: boolean) {
  return supabase.rpc('respond_to_offer', {
    p_offer_id: offerId,
    p_accept: accept,
  })
}

/** Offers waiting for me to answer -- the inbox that had no screen before.
 *
 *  Both items are joined in the same round trip because the row is unreadable
 *  without them: "someone offers something for something" is not a decision
 *  anyone can make.
 */
export async function getIncomingOffers(userId: string) {
  return supabase
    .from('barter_offers')
    .select(
      `id, from_user, to_user, offered_item_id, wanted_item_id, note, status, created_at,
       offered:items!barter_offers_offered_item_id_fkey (id, public_id, title, images, category, condition, user_id),
       wanted:items!barter_offers_wanted_item_id_fkey (id, public_id, title, images, category, condition, user_id),
       sender:profiles!barter_offers_from_user_fkey (id, name, completed_trades)`,
    )
    .eq('to_user', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
}

/** What I have offered and am waiting to hear about. */
export async function getSentOffers(userId: string) {
  return supabase
    .from('barter_offers')
    .select(
      `id, from_user, to_user, offered_item_id, wanted_item_id, note, status, created_at, responded_at,
       offered:items!barter_offers_offered_item_id_fkey (id, public_id, title, images, category, condition, user_id),
       wanted:items!barter_offers_wanted_item_id_fkey (id, public_id, title, images, category, condition, user_id)`,
    )
    .eq('from_user', userId)
    .order('created_at', { ascending: false })
    .limit(50)
}

// ── Matches ─────────────────────────────────────────────────────────────────

/** Every match I am in, newest first.
 *
 *  Archived rows are filtered per side rather than by one shared flag: one
 *  person tidying away a dead match must not remove it from the other's list.
 */
export async function getMyMatches(userId: string) {
  return supabase
    .from('barter_matches')
    .select(
      `id, offer_id, user_a, user_b, item_a, item_b, status,
       a_confirmed, b_confirmed, a_archived, b_archived,
       cancel_reason, created_at, completed_at,
       itemA:items!barter_matches_item_a_fkey (id, public_id, title, images, category, condition, user_id),
       itemB:items!barter_matches_item_b_fkey (id, public_id, title, images, category, condition, user_id),
       userA:profiles!barter_matches_user_a_fkey (id, name, completed_trades),
       userB:profiles!barter_matches_user_b_fkey (id, name, completed_trades)`,
    )
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
}

/** "We met and swapped."
 *
 *  Not "I agree to trade" -- the handover has already happened. That is why the
 *  chat stays open until both sides confirm and closes afterwards. Idempotent,
 *  so a retry on a bad connection cannot forge the other side's confirmation.
 */
export async function confirmBarter(matchId: string) {
  return supabase.rpc('confirm_barter', { p_match_id: matchId })
}

/** Either side may call it off before completion, without the other agreeing.
 *  Both items go back into circulation. */
export async function cancelBarter(matchId: string, reason?: string) {
  return supabase.rpc('cancel_barter', {
    p_match_id: matchId,
    p_reason: reason ?? null,
  })
}

/** Hide a finished or cancelled match from my own list only. The column
 *  depends on which side I am, which is why this needs the match. */
export async function archiveMatch(matchId: string, isSideA: boolean) {
  return supabase
    .from('barter_matches')
    .update(isSideA ? { a_archived: true } : { b_archived: true })
    .eq('id', matchId)
    .select()
}

// ── Chat ────────────────────────────────────────────────────────────────────

export async function getMatchMessages(matchId: string) {
  return supabase
    .from('barter_messages')
    .select('id, match_id, sender_id, body, client_msg_id, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
}

/** client_msg_id is minted once per message by the caller and reused on retry,
 *  so a resend after a dropped connection updates nothing rather than posting
 *  the same line twice. */
export async function sendMatchMessage(input: {
  matchId: string
  senderId: string
  body: string
  clientMsgId: string
}) {
  return supabase
    .from('barter_messages')
    .insert({
      match_id: input.matchId,
      sender_id: input.senderId,
      body: input.body,
      client_msg_id: input.clientMsgId,
    })
    .select()
}

/** Report a listing. Separate from fileReport, which reports a PERSON
 *  mid-swap: the reasons do not overlap and neither do the moments. */
export async function reportItem(itemId: string, reason: string, note?: string) {
  return supabase.rpc('report_item', {
    p_item_id: Number(itemId),
    p_reason: reason,
    p_note: note ?? null,
  })
}

/** Another 30 days on a listing. From now, not from the old expiry. */
export async function renewItem(itemId: string) {
  return supabase.rpc('renew_item', { p_item_id: Number(itemId) })
}

// ── Errors ──────────────────────────────────────────────────────────────────

/** The SQLSTATE codes raised by migration 016, mapped to i18n keys.
 *
 *  Matching on the code rather than the message text: the messages are written
 *  for a developer reading logs, and they are not translated. P0002 in
 *  particular covers a genuinely unavailable item AND a block, deliberately --
 *  telling the two apart is exactly what would reveal the block.
 */
export const BARTER_ERROR_KEYS: Record<string, string> = {
  '28000': 'barter.errorSignedOut',
  P0001: 'barter.errorNotYourItem',
  P0002: 'barter.errorItemGone',
  P0003: 'barter.errorOwnItem',
  P0004: 'barter.errorAlreadyOffered',
  P0005: 'barter.errorNotFound',
  // 030 added suspension; 033 moved it off P0005, which already meant "not
  // found" -- a suspended account was being told the ITEM did not exist.
  P0013: 'barter.errorSuspended',
  // Not enough points for a super offer. The sheet offers the ordinary one
  // instead rather than dead-ending.
  P0011: 'barter.errorNoPoints',
  P0006: 'barter.errorAlreadyAnswered',
  P0007: 'barter.errorClosed',
  '42501': 'barter.errorNotYours',
}

/** Turn a Supabase error into a key the UI can translate. Unknown codes fall
 *  back to the generic message rather than showing raw SQL text to a person. */
export function barterErrorKey(error: { code?: string } | null | undefined): string {
  if (!error?.code) return 'barter.errorGeneric'
  return BARTER_ERROR_KEYS[error.code] ?? 'barter.errorGeneric'
}

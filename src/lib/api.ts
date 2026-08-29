import { supabase } from './supabase'
import { STATUS_TO_DB } from '@/types/swap'

// ── Auth ────────────────────────────────────────────────────────────────────

export async function requestOTP(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  return supabase.from('profiles').update(patch).eq('id', userId)
}

// ── Items ───────────────────────────────────────────────────────────────────

export async function getMyItems(userId: string) {
  return supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
}

export async function insertItem(item: {
  user_id: string
  title: string
  description: string
  /** The primary pick. Feed and search filter on this single column. */
  category: string
  /** Every category picked, primary first (migration 009). */
  categories: string[]
  condition: number
  wants_in_return: string[]
  images: string[]
  location_city: string
  status: string
  /** NOT NULL with no default in the schema — the insert fails without it. */
  expires_at: string
}) {
  return supabase.from('items').insert(item).select().single()
}

export async function deleteItem(itemId: string) {
  return supabase
    .from('items')
    .update({ status: 'deleted' })
    .eq('id', itemId)
    .select('id')
    .single()
}

// ── Uploads ─────────────────────────────────────────────────────────────────

export async function getR2UploadUrls(uploadIds: string[]) {
  return supabase.functions.invoke('get-r2-upload-urls', { body: { uploadIds } })
}

// ── Feed (edge function) ─────────────────────────────────────────────────────

export async function fetchFeed({
  city,
  lat,
  lng,
  radiusKm = 15,
  cursor = 0,
  limit = 10,
  userId,
}: {
  city?: string
  lat?: number
  lng?: number
  radiusKm?: number
  cursor?: number
  limit?: number
  userId: string
}) {
  return supabase.functions.invoke('feed', {
    body: { city, lat, lng, radius_km: radiusKm, cursor, limit, user_id: userId },
  })
}

// ── Swipes (edge function) ───────────────────────────────────────────────────

export async function recordSwipe({ targetItemId, targetOwnerId, isLike, offerItemId }: {
  targetItemId: string; targetOwnerId: string; isLike: boolean
  /** Which of my finds I am offering. Sent now so the client is ready; the
   *  deployed swipe function ignores unknown body keys, and
   *  record_swipe_and_match still chooses whichever of my items the other
   *  person liked most recently until it is migrated to accept this. */
  offerItemId?: string
}) {
  return supabase.functions.invoke('swipe', {
    body: {
      target_item_id: targetItemId,
      target_owner_id: targetOwnerId,
      is_like: isLike,
      offer_item_id: offerItemId,
    },
  })
}

// ── Swaps ───────────────────────────────────────────────────────────────────

/** Every swap you are part of, open and closed alike.
 *
 *  Closed swaps are deliberately NOT filtered out here: the inbox has a
 *  "closed" tab, and excluding them server-side left that tab permanently
 *  empty. The split between active and closed happens in useSwapsInbox.
 */
export async function getMySwaps(userId: string) {
  return supabase
    .from('swaps')
    .select('*, item_a:item_a_id(*), item_b:item_b_id(*)')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('created_at', { ascending: false })
}

/** swaps.status is CHECK'd to ('proposed','confirmed','completed','cancelled').
 *  The UI speaks a richer nine-state vocabulary that was never migrated, so a
 *  write of e.g. 'agreed' is rejected by the constraint. This maps the UI's
 *  words back onto the four the column accepts — the mirror of STATUS_FROM_DB
 *  in useSwapsInbox, and the same single place to retire once the schema
 *  catches up.
 */

export async function updateSwapStatus(
  swapId: string,
  status: string,
  cancelReason?: string | null,
) {
  const patch: Record<string, unknown> = { status: STATUS_TO_DB[status] ?? status }
  if (cancelReason) patch.cancel_reason = cancelReason
  // .select() so a rejected write surfaces as an error rather than a silent
  // no-op — a constraint violation here used to look like a dead button.
  return supabase.from('swaps').update(patch).eq('id', swapId).select()
}

/** The reviews behind someone's star average (migration 010).
 *
 *  The RPC returns only revealed ratings — blind-until-revealed is enforced in
 *  SQL, not here — along with the average and total computed from that same
 *  set, so the header can never disagree with the rows.
 */
export async function getUserReviews(userId: string, limit = 20, offset = 0) {
  return supabase.rpc('get_user_reviews', {
    p_user: userId,
    p_limit: limit,
    p_offset: offset,
  })
}

// ── Chat (server-stored) ────────────────────────────────────────────────

export async function getMessages(swapId: string) {
  return supabase.from('messages').select('*')
    .eq('swap_id', swapId).order('created_at', { ascending: true })
}

export async function sendMessage(swapId: string, senderId: string, body: string, clientMsgId: string) {
  return supabase.from('messages').insert({
    swap_id: swapId, sender_id: senderId, body, client_msg_id: clientMsgId,
  })
}

/** Messages waiting for you: unread, and not your own.
 *
 *  RLS already scopes messages to swaps you are part of, so this needs no
 *  join — `sender_id != you` is the whole filter. Counted, not fetched: the
 *  badge only ever needs the number.
 */
export async function getUnreadCount(userId: string) {
  return supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
    .neq('sender_id', userId)
}

/** Unread counts per swap, for the dot on each inbox row.
 *
 *  One request for the whole inbox rather than one per row: it selects the
 *  swap_id of every unread message addressed to you and tallies them here.
 *  RLS already narrows this to swaps you are part of, exactly as
 *  getUnreadCount relies on.
 */
export async function getUnreadBySwap(userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('swap_id')
    .is('read_at', null)
    .neq('sender_id', userId)

  if (error) return { data: null, error }

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as { swap_id: string }[]) {
    counts[row.swap_id] = (counts[row.swap_id] ?? 0) + 1
  }
  return { data: counts, error: null }
}

/** Clear the badge for one thread. The recipient-update RLS policy permits
 *  exactly this — setting read_at on messages sent TO you — so the sender_id
 *  filter is not merely an optimisation: without it every row is rejected.
 */
export async function markThreadRead(swapId: string, userId: string) {
  return supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('swap_id', swapId)
    .neq('sender_id', userId)
    .is('read_at', null)
    .select()
}

export function subscribeMessages(swapId: string, onMessage: (m: unknown) => void) {
  return supabase.channel(`messages:${swapId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `swap_id=eq.${swapId}` },
      (payload) => onMessage(payload.new))
    .subscribe()
}

// ── Ratings ─────────────────────────────────────────────────────────────────

export async function submitRating({
  swapId,
  fromUser,
  toUser,
  stars,
  tags,
  context,
}: {
  swapId: string
  fromUser: string
  toUser: string
  stars: number
  tags: string[]
  context?: string
}) {
  return supabase
    .from('ratings')
    .insert({ swap_id: swapId, from_user: fromUser, to_user: toUser, stars, tags, context })
}

// ── Item detail ────────────────────────────────────────────────────────────

/** One find, with everything the detail screen needs.
 *
 *  This used to be a PostgREST select with `owner:user_id(*)` embedded, which
 *  could never work: items.user_id references auth.users, not
 *  public.profiles, so the join failed with PGRST200 on every request and the
 *  screen hung on its loading state forever.
 *
 *  get_item_detail (migration 006) was written for exactly this and returns
 *  more besides — eyeing_count, saved_by_me, and how many of your own finds
 *  match what they are asking for.
 */
export async function getItem(itemId: string) {
  return supabase.rpc('get_item_detail', { p_item_id: Number(itemId) })
}

export async function searchItems(params: {
  query?: string
  categories?: string[]
  radiusKm?: number
  city?: string
  cursor?: number
  limit?: number
}) {
  return supabase.functions.invoke('search', { body: params })
}

export async function setItemStatus(itemId: string, status: 'active' | 'reserved' | 'paused' | 'deleted') {
  return supabase.from('items').update({ status }).eq('id', itemId)
}

// ── Saves / eyeing ──────────────────────────────────────────────────────────

export async function saveItem(userId: string, itemId: string) {
  return supabase.from('saves').upsert({ user_id: userId, item_id: itemId })
}

export async function unsaveItem(userId: string, itemId: string) {
  return supabase.from('saves').delete().eq('user_id', userId).eq('item_id', itemId)
}

export async function getEyeingPeople(itemId: string) {
  return supabase.from('saves').select('user_id, profiles:user_id(id, display_name, avatar_url)').eq('item_id', itemId)
}

// ── Offers ──────────────────────────────────────────────────────────────────

export async function createOffer(input: {
  swapId?: string
  fromUser: string
  toUser: string
  offeredItemIds: string[]
  wantedItemIds: string[]
  note?: string
  counterOf?: string
}) {
  // The deployed function is `offer`, and it reads snake_case with an action.
  return supabase.functions.invoke('offer', {
    body: {
      action: 'create',
      swap_id: input.swapId,
      to_user: input.toUser,
      offered_item_ids: input.offeredItemIds,
      wanted_item_ids: input.wantedItemIds,
      note: input.note,
      counter_of: input.counterOf,
    },
  })
}

export async function respondToOffer(offerId: string, action: 'accept' | 'decline') {
  return supabase.functions.invoke('offer', { body: { action, offer_id: offerId } })
}

// ── Meetups ─────────────────────────────────────────────────────────────────

export async function proposeMeetup(input: {
  swapId: string
  mode: 'meet' | 'post'
  placeLabel?: string
  meetAt?: string
  proposedBy: string
}) {
  return supabase.from('meetups').insert({
    swap_id: input.swapId,
    mode: input.mode,
    place_label: input.placeLabel,
    meet_at: input.meetAt,
    proposed_by: input.proposedBy,
  })
}

export async function acceptMeetup(meetupId: string) {
  return supabase.from('meetups').update({ accepted: true }).eq('id', meetupId)
}

export async function getMeetupSuggestions(swapId: string) {
  return supabase.functions.invoke('meetup', { body: { action: 'suggest', swap_id: swapId } })
}

// ── Handover ────────────────────────────────────────────────────────────────

/** The handover function takes identity from the JWT, never the body — a
 *  user_id in the payload would be a spoofing hole. */
export async function confirmReceipt(swapId: string) {
  return supabase.functions.invoke('handover', { body: { action: 'confirm', swap_id: swapId } })
}

export async function rateSwap(swapId: string, stars: number, tags: string[]) {
  return supabase.functions.invoke('handover', {
    body: { action: 'rate', swap_id: swapId, stars, tags },
  })
}

// ── Trouble ─────────────────────────────────────────────────────────────────

export async function fileReport(input: {
  swapId?: string
  fromUser: string
  aboutUser?: string
  reason: 'changed_mind' | 'no_show' | 'not_as_described' | 'unsafe' | 'asked_for_money'
  note?: string
  evidencePaths?: string[]
  block?: boolean
}) {
  // Deployed as `report`, reading snake_case. from_user comes from the JWT.
  return supabase.functions.invoke('report', {
    body: {
      swap_id: input.swapId,
      about_user: input.aboutUser,
      reason: input.reason,
      note: input.note,
      evidence_paths: input.evidencePaths,
      block: input.block,
    },
  })
}

export async function blockUser(blocker: string, blocked: string) {
  return supabase.from('blocks').upsert({ blocker, blocked }).select()
}

export async function unblockUser(blocker: string, blocked: string) {
  return supabase.from('blocks').delete().eq('blocker', blocker).eq('blocked', blocked).select()
}

/** Everyone this person has blocked, newest first. RLS scopes `blocks` to the
 *  blocker, so the filter here is belt and braces rather than load-bearing.
 *  The profile join is a plain read: profiles_public_read allows it.
 */
export async function listBlocked(blocker: string) {
  return supabase
    .from('blocks')
    .select('blocked, created_at, profile:profiles!blocked(id, name)')
    .eq('blocker', blocker)
    .order('created_at', { ascending: false })
}

// ── Membership ──────────────────────────────────────────────────────────────

export async function getMembership(userId: string) {
  return supabase.from('profiles').select('tier, tier_valid_until, spotlights_left').eq('id', userId).single()
}

export async function startCheckout(tier: 'collector' | 'curator') {
  return supabase.functions.invoke('checkout', { body: { tier } })
}

export async function buySpotlight(itemId: string) {
  return supabase.functions.invoke('checkout', { body: { product: 'spotlight', item_id: itemId } })
}

// ── Saved searches ──────────────────────────────────────────────────────────

export async function saveSearch(input: {
  userId: string
  query?: string
  categories?: string[]
  radiusKm?: number
  cadence: 'daily' | 'instant'
}) {
  return supabase.from('saved_searches').insert({
    user_id: input.userId,
    query: input.query,
    categories: input.categories,
    radius_km: input.radiusKm,
    cadence: input.cadence,
  })
}

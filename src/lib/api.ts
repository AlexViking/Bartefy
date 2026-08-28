import { supabase } from './supabase'

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
  category: string
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

export async function recordSwipe({ targetItemId, targetOwnerId, isLike }: {
  targetItemId: string; targetOwnerId: string; isLike: boolean
}) {
  return supabase.functions.invoke('swipe', {
    body: { target_item_id: targetItemId, target_owner_id: targetOwnerId, is_like: isLike },
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

export async function updateSwapStatus(
  swapId: string,
  status: string,
  cancelReason?: string | null,
) {
  const patch: Record<string, unknown> = { status }
  if (cancelReason) patch.cancel_reason = cancelReason
  return supabase.from('swaps').update(patch).eq('id', swapId)
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

export async function getItem(itemId: string) {
  return supabase
    .from('items')
    .select('*, owner:user_id(*), eyeing:item_eyeing_counts(eyeing_count)')
    .eq('id', itemId)
    .single()
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
  return supabase.functions.invoke('offer-create', { body: input })
}

export async function respondToOffer(offerId: string, action: 'accept' | 'decline') {
  return supabase.functions.invoke('offer-respond', { body: { offer_id: offerId, action } })
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
  return supabase.functions.invoke('meetup-suggestions', { body: { swap_id: swapId } })
}

// ── Handover ────────────────────────────────────────────────────────────────

export async function confirmReceipt(swapId: string, userId: string) {
  return supabase.functions.invoke('handover-confirm', { body: { swap_id: swapId, user_id: userId } })
}

// ── Trouble ─────────────────────────────────────────────────────────────────

export async function fileReport(input: {
  swapId?: string
  fromUser: string
  aboutUser?: string
  reason: 'changed_mind' | 'no_show' | 'not_as_described' | 'unsafe'
  note?: string
  evidencePaths?: string[]
  block?: boolean
}) {
  return supabase.functions.invoke('report-create', { body: input })
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

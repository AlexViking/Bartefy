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

export async function getMySwaps(userId: string) {
  return supabase
    .from('swaps')
    .select('*, item_a:item_a_id(*), item_b:item_b_id(*)')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
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

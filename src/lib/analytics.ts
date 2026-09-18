import { supabase } from '@/lib/supabase'

/** Behavioural events, batched and fire-and-forget.
 *
 *  Deliberately NOT routed through lib/outbox.ts. That queue is for mutations
 *  the user believes happened -- a swipe, a message -- so it persists to
 *  storage and retries until the server agrees. An analytics event is the
 *  opposite on every axis:
 *
 *    * it must never block or fail a user action;
 *    * it is worthless once stale, so retrying it for hours is pure cost;
 *    * losing one is acceptable. Losing a swipe is not.
 *
 *  So: in memory only, one retry, dropped on failure, and every error
 *  swallowed. If analytics is down the app must not notice.
 *
 *  THE RULE THIS FILE EXISTS TO ENFORCE: no caller ever awaits `track()`.
 */

/** Events the app is allowed to send.
 *
 *  A closed list, not a free string. Two reasons: a typo becomes a silent
 *  second series that splits a funnel in half and is invisible until someone
 *  reads a report and finds half the traffic missing; and the admin page can
 *  render a known set rather than whatever happens to have been written.
 */
export type EventName =
  // Deck
  | 'deck_viewed'
  | 'deck_emptied'
  | 'deck_widened'
  | 'card_expanded'
  // Offers
  | 'offer_sheet_opened'
  | 'offer_sheet_abandoned'
  | 'offer_sent'
  | 'offer_accepted'
  | 'offer_declined'
  // Chat
  | 'chat_opened'
  | 'message_sent'
  | 'voice_sent'
  | 'arrange_opened'
  // Listing
  | 'add_item_started'
  | 'add_item_published'
  | 'add_item_abandoned'
  // Money and membership
  | 'upgrade_sheet_opened'
  | 'points_spent'
  // Session
  | 'app_opened'
  | 'signed_up'

interface QueuedEvent {
  name: EventName
  props: Record<string, unknown>
  session_id: string
  experiment: string | null
  variant: string | null
  created_at: string
}

const MAX_BATCH = 20
const FLUSH_MS = 5000

let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let userId: string | null = null

/** One app load. Lets a funnel be followed within a visit without joining on
 *  timestamps and guessing where one session ended and the next began. */
const sessionId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random())

/** Told who is signed in. Events before this lands are dropped rather than
 *  written with a null user: events_insert_own requires user_id = auth.uid(),
 *  so an anonymous row would be rejected by RLS anyway. */
export function setAnalyticsUser(id: string | null) {
  userId = id
}

/** Variant stamping. Set by the experiment layer so every event fired while a
 *  test is live carries which arm the user is in -- without every call site
 *  having to know about experiments at all. */
let activeExperiment: { key: string; variant: 'a' | 'b' } | null = null
export function setActiveExperiment(e: { key: string; variant: 'a' | 'b' } | null) {
  activeExperiment = e
}

async function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (queue.length === 0 || !userId) return

  const batch = queue.slice(0, MAX_BATCH)
  queue = queue.slice(batch.length)

  try {
    const { error } = await supabase
      .from('events')
      .insert(batch.map((e) => ({ ...e, user_id: userId })))
    // One retry, at the back of the queue, and only if there is room. A
    // failing insert that is retried forever becomes an infinite loop of
    // writes nobody reads.
    if (error && queue.length < MAX_BATCH) queue.unshift(...batch)
  } catch {
    // Swallowed on purpose. Analytics must never surface an error to a user.
  }
}

/** Record something that happened. Never awaited, never throws.
 *
 *  Returns void rather than a promise so that awaiting it is not even
 *  expressible at a call site.
 */
export function track(name: EventName, props: Record<string, unknown> = {}): void {
  queue.push({
    name,
    props,
    session_id: sessionId,
    experiment: activeExperiment?.key ?? null,
    variant: activeExperiment?.variant ?? null,
    // Stamped when it HAPPENED, not when it is written. A batch flushed five
    // seconds later would otherwise compress five seconds of behaviour into
    // one instant and make every duration measured from it wrong.
    created_at: new Date().toISOString(),
  })

  if (queue.length >= MAX_BATCH) {
    void flush()
    return
  }
  if (!timer) timer = setTimeout(() => void flush(), FLUSH_MS)
}

/** Flush on the way out. visibilitychange, not unload: unload does not fire
 *  reliably on mobile Safari, which is where a closed tab is most likely. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
}

/** Deterministic bucketing: hash(user + experiment) rather than a coin flip.
 *
 *  This is the same technique as get_feed's shuffle (migration 041), applied
 *  to people instead of cards, and it is chosen for the same three reasons:
 *
 *    1. STABLE -- the same person always lands in the same arm, on every
 *       device, with no row to write and no lookup to miss. A stored random
 *       assignment has to be written on first view, which is a race, and read
 *       on every view, which is a request.
 *    2. INDEPENDENT -- including the experiment key means somebody in A for
 *       one test is not correlated into A for the next. Hashing the user id
 *       alone would put the same people in the same arm every time and
 *       quietly turn every experiment into a test of those same users.
 *    3. REVERSIBLE -- nothing is persisted, so changing the split changes the
 *       buckets immediately with no migration and no stale rows.
 *
 *  FNV-1a: tiny, no dependency, and good enough spread for bucketing. This is
 *  not a security boundary -- it decides which button someone sees.
 */
export function bucketFor(userId: string, key: string, splitPercent: number): 'a' | 'b' {
  const s = `${userId}:${key}`
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    // >>> 0 keeps it an unsigned 32-bit int; JS bitwise ops are signed and
    // the sign bit flipping mid-hash skews the distribution.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h % 100 < splitPercent ? 'b' : 'a'
}

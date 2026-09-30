import { useQuery } from '@tanstack/react-query'

import type { IconName } from '@/components/ui/icon'
import { getIncomingOffers, getMyMatches } from '@/lib/barter'
import { getWishlistHits } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>

export type FeedItem = {
  id: string
  kind: 'offer' | 'match' | 'cancelled' | 'completed' | 'wishlist'
  /** Title key, and the line under it. The line carries user data, so it is
   *  passed as a value rather than being part of the key. */
  titleKey: string
  detail: string
  when: string
  path: string
}

export const FEED_ICONS: Record<FeedItem['kind'], IconName> = {
  offer: 'Handshake',
  match: 'Sparkles',
  cancelled: 'ShieldAlert',
  completed: 'CircleCheck',
  /** A wishlist find. Not Sparkles, which already means a match. */
  wishlist: 'Bell',
}

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const title = (v: unknown) => String(one(v)?.title ?? '')

/** Everything waiting on you, newest first.
 *
 *  Shared by the Notifications page and the bell in the top bar, so the two
 *  can never disagree about what happened. Built from what the app already
 *  knows rather than from a notifications table: an offer sitting unanswered,
 *  a match that just opened, a swap that fell through. A real table with
 *  read/unread state belongs with push, which needs FCM v1 and does not exist
 *  yet. Deriving means it can never show something that did not happen.
 */
export function useNotificationsFeed() {
  const userId = useAuthStore((s) => s.session?.user?.id)

  return useQuery({
    queryKey: ['notifications', userId ?? ''],
    queryFn: async () => {
      const [offers, matches, hits] = await Promise.all([
        getIncomingOffers(userId!),
        getMyMatches(userId!),
        getWishlistHits(userId!),
      ])
      if (offers.error) throw offers.error
      if (matches.error) throw matches.error
      if (hits.error) throw hits.error
      const feed: FeedItem[] = []

      /* Wishlist alerts (034). Scarcity is the point, so these sort by time
         like everything else -- a new find IS the news. */
      for (const h of (hits.data ?? []) as Row[]) {
        const it = one(h.item)
        if (!it) continue
        feed.push({
          id: 'w' + String(h.id),
          kind: 'wishlist',
          titleKey: 'notif.wishlistTitle',
          detail: `${String(it.title ?? '')} · ${String(it.location_city ?? '')}`,
          when: String(h.created_at ?? ''),
          path: '/item/' + String(it.public_id ?? ''),
        })
      }

      for (const o of (offers.data ?? []) as Row[]) {
        feed.push({
          id: 'o' + String(o.id),
          kind: 'offer',
          titleKey: 'notif.offerTitle',
          detail: `${title(o.offered)} → ${title(o.wanted)}`,
          when: String(o.created_at ?? ''),
          path: '/offers',
        })
      }

      for (const m of (matches.data ?? []) as Row[]) {
        const isA = String(m.user_a) === userId
        // A row the person already tidied away should not come back as a
        // notification -- that is the opposite of archiving.
        if (isA ? m.a_archived : m.b_archived) continue

        const mine = isA ? title(m.itemA) : title(m.itemB)
        const theirs = isA ? title(m.itemB) : title(m.itemA)
        const pair = `${mine} ⇄ ${theirs}`
        const status = String(m.status ?? 'active')

        if (status === 'completed') {
          feed.push({
            id: 'c' + String(m.id), kind: 'completed', titleKey: 'notif.completedTitle',
            detail: pair, when: String(m.completed_at ?? m.created_at ?? ''),
            path: '/matches/' + m.id,
          })
        } else if (status === 'cancelled') {
          feed.push({
            id: 'x' + String(m.id), kind: 'cancelled',
            titleKey:
              m.cancel_reason === 'item_traded_elsewhere'
                ? 'notif.goneTitle'
                : 'notif.cancelledTitle',
            detail: pair, when: String(m.created_at ?? ''), path: '/matches/' + m.id,
          })
        } else {
          feed.push({
            id: 'm' + String(m.id), kind: 'match', titleKey: 'notif.matchTitle',
            detail: pair, when: String(m.created_at ?? ''), path: '/matches/' + m.id,
          })
        }
      }

      return feed.sort((a, b) => (a.when < b.when ? 1 : -1))
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}

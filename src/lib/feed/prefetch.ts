import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/cache/queryClient'
import { warmPhoto, type Photo } from '@/lib/images'

const WINDOW = 12
const REFILL_AT = 4
const WARM_AHEAD = 5

export interface FeedCard {
  id: string
  photos: Photo[]
}

/** Two jobs, both invisible when they work:
 *
 *  1. Warm the images for the next few cards, so a swipe never shows a loading
 *     state. This is the biggest perceived-speed win in the product.
 *  2. Fetch the next window before the stack runs dry - at four remaining, not
 *     at zero, and never on mount alone.
 */
export function useFeedPrefetch({
  cards,
  cursor,
  filters,
  radiusKm,
  fetchWindow,
}: {
  cards: FeedCard[]
  cursor: string | null
  filters: string[]
  radiusKm: number
  fetchWindow: (cursor: string | null, limit: number) => Promise<{ cards: FeedCard[]; cursor: string | null }>
}) {
  const qc = useQueryClient()

  // Warm images just ahead of the user.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      for (const card of cards.slice(1, 1 + WARM_AHEAD)) {
        if (cancelled) return
        if (card.photos[0]) await warmPhoto(card.photos[0], 'card')
      }
    }
    // Idle so warming never competes with the drag it exists to protect.
    const id = 'requestIdleCallback' in window ? requestIdleCallback(run) : setTimeout(run, 200)
    return () => {
      cancelled = true
      if ('cancelIdleCallback' in window) cancelIdleCallback(id as number)
      else clearTimeout(id as ReturnType<typeof setTimeout>)
    }
  }, [cards])

  // Refill the window before it empties.
  useEffect(() => {
    if (cards.length > REFILL_AT || !cursor) return
    qc.prefetchQuery({
      queryKey: [...keys.feed(filters, radiusKm), cursor],
      queryFn: () => fetchWindow(cursor, WINDOW),
    })
  }, [cards.length, cursor, filters, radiusKm, qc, fetchWindow])
}

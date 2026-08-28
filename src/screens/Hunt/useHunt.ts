import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { fetchFeed, recordSwipe } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { useHuntStore, type CardItem } from '@/store/hunt'
import { useOnboardingStore } from '@/store/onboarding'

export const HUNT_CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl']

/** All of Hunt's behaviour, with no layout in it. Both platform layouts call
 *  this, so the feed, the swipe rules and the match handling can never diverge
 *  between phone and desktop.
 */
export function useHunt() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const city = useAuthStore((s) => s.selectedCity) || 'Berlin'
  const tastes = useOnboardingStore((s) => s.tastes)

  const cards = useHuntStore((s) => s.cardQueue)
  const setCardQueue = useHuntStore((s) => s.setCardQueue)
  const removeTopCard = useHuntStore((s) => s.removeTopCard)
  const addToLikeHistory = useHuntStore((s) => s.addToLikeHistory)

  /** Onboarding's taste picker seeds the first filter set — the point of asking
   *  is that the first few cards are not random. */
  const [filters, setFilters] = useState<string[]>(() =>
    HUNT_CATEGORIES.filter((c) => tastes.includes(c.toLowerCase())),
  )
  const [radiusKm, setRadiusKm] = useState(10)
  const [matched, setMatched] = useState<CardItem | null>(null)

  const { isLoading, error } = useQuery({
    queryKey: keys.feed(filters, radiusKm),
    queryFn: async () => {
      const { data, error: feedError } = await fetchFeed({ city, radiusKm, userId: userId! })
      if (feedError) throw feedError
      const items = (data?.items ?? []) as Record<string, unknown>[]
      const shaped: CardItem[] = items.map((it) => ({
        id: String(it.id),
        title: String(it.title ?? ''),
        category: String(it.category ?? ''),
        condition: String(it.condition ?? ''),
        distance: String(it.location_city ?? city),
        owner: String(it.owner ?? 'Swapper'),
        wants: Array.isArray(it.wants) ? (it.wants as string[]) : [],
        photoColor: 'hsl(var(--illo-terracotta))',
        photoUrl:
          Array.isArray(it.photo_urls) && (it.photo_urls as string[]).length > 0
            ? String((it.photo_urls as string[])[0])
            : undefined,
        ownerId: String(it.user_id ?? ''),
        rating: it.rating != null ? Number(it.rating) : undefined,
        swapCount: it.swaps != null ? Number(it.swaps) : 0,
      }))
      setCardQueue(shaped)
      return shaped
    },
    enabled: !!userId,
    staleTime: STALE.feed,
  })

  const top = cards[0]

  const decide = async (item: CardItem, want: boolean) => {
    if (want && item.ownerId) {
      addToLikeHistory(item.id)
      const { data } = await recordSwipe({
        targetItemId: item.id,
        targetOwnerId: item.ownerId,
        isLike: true,
      })
      if (data?.matched) setMatched(item)
    }
    removeTopCard()
  }

  const toggleFilter = (c: string) =>
    setFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))

  return {
    cards,
    top,
    isLoading,
    error,
    filters,
    toggleFilter,
    radiusKm,
    widen: () => setRadiusKm((r) => Math.round(r * 2.5)),
    matched,
    dismissMatch: () => setMatched(null),
    decide,
    openItem: (id: string) => navigate('/item/' + id),
    openSwap: (id: string) => navigate('/swaps/' + id),
    goBrowse: () => navigate('/browse'),
    goAdd: () => navigate('/add'),
  }
}

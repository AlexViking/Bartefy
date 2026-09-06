import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/lib/taxonomy'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { fetchFeed, getMyItems, recordSwipe } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { useHuntStore, type CardItem } from '@/store/hunt'
import { useOnboardingStore } from '@/store/onboarding'

/** One taxonomy for the whole app — see lib/taxonomy.ts. Hunt, Browse,
 *  AddItem and onboarding all used to keep their own drifting copies. */
export const HUNT_CATEGORIES = CATEGORIES

/** One of my finds, as offered in the hunt picker. */
export interface OfferOption {
  id: string
  title: string
  photoUrl?: string
}

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
  const selectedOfferId = useHuntStore((s) => s.selectedOfferId)
  const setSelectedOfferId = useHuntStore((s) => s.setSelectedOfferId)
  const setCardQueue = useHuntStore((s) => s.setCardQueue)
  const removeTopCard = useHuntStore((s) => s.removeTopCard)
  const addToLikeHistory = useHuntStore((s) => s.addToLikeHistory)

  /** Onboarding's taste picker seeds the first filter set — the point of asking
   *  is that the first few cards are not random. */
  const [filters, setFilters] = useState<string[]>(() =>
    HUNT_CATEGORIES.filter((c) => tastes.includes(c.id)).map((c) => c.id),
  )
  const [radiusKm, setRadiusKm] = useState(10)
  const [matched, setMatched] = useState<CardItem | null>(null)

  /** The finds I could put on the table. Hunting is a trade, so which of my
   *  own items I am offering is part of the question — it was previously
   *  decided for me by whichever item the other person happened to like last. */
  const { data: myItems = [] } = useQuery({
    queryKey: keys.myItems(userId ?? ''),
    queryFn: async () => {
      const { data, error: itemsError } = await getMyItems(userId!)
      if (itemsError) throw itemsError
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: !!userId,
  })

  const offers: OfferOption[] = myItems.map((it) => ({
    id: String(it.id),
    title: String(it.title ?? ''),
    photoUrl: Array.isArray(it.images) && it.images.length > 0 ? String(it.images[0]) : undefined,
  }))

  /** Pick the first find by default, and drop a stale choice: an item that has
   *  since been swapped or deleted is no longer offerable, and leaving it
   *  selected would silently offer something the user no longer has. */
  // Depends on the joined ids rather than `offers`, which is a fresh array on
  // every render and would make this effect re-run forever.
  const offerIds = offers.map((o) => o.id).join(',')
  useEffect(() => {
    const ids = offerIds ? offerIds.split(',') : []
    if (ids.length === 0) return
    if (!selectedOfferId || !ids.includes(selectedOfferId)) {
      setSelectedOfferId(ids[0])
    }
  }, [offerIds, selectedOfferId, setSelectedOfferId])

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
        // Which of my finds I am putting up. Recorded on the swipe itself, so
        // that when the other person swipes back their match lookup can pair
        // on what I actually offered.
        offerItemId: selectedOfferId ?? undefined,
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
    offers,
    selectedOfferId,
    setSelectedOfferId,
    selectedOffer: offers.find((o) => o.id === selectedOfferId),
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

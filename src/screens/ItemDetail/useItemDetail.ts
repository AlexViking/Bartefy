import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { getItem } from '@/lib/api'
import { DEFAULT_CONDITION, categoryLabel, conditionAt, splitWants } from '@/lib/taxonomy'
import { keys, STALE } from '@/lib/cache/queryClient'
import type { ItemRef, PersonRef } from '@/types/swap'

const PLACEHOLDERS = [
  'hsl(var(--illo-terracotta))',
  'hsl(var(--illo-denim))',
  'hsl(var(--illo-sage))',
  'hsl(var(--accent))',
]

/** The find, its owner and the offer state — with no layout in it. */
export function useItemDetail() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [offerOpen, setOfferOpen] = useState(false)
  const [photo, setPhoto] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.item(itemId ?? ''),
    queryFn: async () => {
      const { data: row, error } = await getItem(itemId!)
      if (error) throw error
      return row as Record<string, unknown>
    },
    enabled: !!itemId,
    staleTime: STALE.item,
  })

  // A find that failed to load, was deleted, or never existed must say so.
  // Returning "not ready" for an error left the screen on "Just a moment…"
  // forever, which is indistinguishable from a hang.
  if (isError || (!isLoading && !data)) {
    return { ready: false as const, isLoading: false, notFound: true as const, goBack: () => navigate(-1) }
  }
  if (isLoading || !data) {
    return { ready: false as const, isLoading, notFound: false as const, goBack: () => navigate(-1) }
  }

  const photos = Array.isArray(data.images) ? (data.images as string[]) : []
  const hasRealPhotos = photos.length > 0 && photos[0]?.startsWith('http')
  const ownerData = data.owner as Record<string, unknown> | null
  // get_item_detail returns eyeing_count as a scalar, not an embedded row.

  const item = {
    id: String(data.id),
    title: String(data.title ?? ''),
    // Stored values normalise through the taxonomy: v2 rows hold categories
    // this build never defined, and they still have to render.
    category: categoryLabel(data.category),
    condition: conditionAt(Number(data.condition ?? DEFAULT_CONDITION)).label,
    description: String(data.description ?? ''),
    // get_item_detail returns `wants`, not the column name. The free-text
    // wish is stored in the same array behind a prefix; it is shown as a
    // sentence, not as a chip that looks matchable.
    wants: splitWants(data.wants).categories,
    wantsNote: splitWants(data.wants).note,
    eyeing: data.eyeing_count != null ? Number(data.eyeing_count) : 0,
    reserved: data.status === 'reserved',
  }

  const owner: PersonRef = {
    id: String(data.user_id ?? ''),
    name: String(ownerData?.name ?? ownerData?.display_name ?? 'Swapper'),
    rating: ownerData?.rating != null ? Number(ownerData.rating) : undefined,
    swapCount: ownerData?.swap_count != null ? Number(ownerData.swap_count) : 0,
    verified: Boolean(ownerData?.verified),
    distanceLabel: String(data.location_city ?? ''),
  }

  const theirItem: ItemRef = {
    id: item.id,
    title: item.title,
    photoUrl: hasRealPhotos ? photos[0] : undefined,
    photoColor: PLACEHOLDERS[0],
    condition: item.condition,
  }

  /** One list for the gallery whether the photos are real or placeholders, so
   *  neither layout has to branch on it. */
  const gallery = (hasRealPhotos ? photos : PLACEHOLDERS).map((entry, i) => ({
    url: hasRealPhotos ? entry : undefined,
    color: hasRealPhotos ? undefined : entry,
    index: i,
  }))

  return {
    ready: true as const,
    isLoading: false,
    item,
    owner,
    theirItem,
    gallery,
    photo,
    setPhoto,
    offerOpen,
    setOfferOpen,
    goBack: () => navigate(-1),
    goOwner: () => navigate('/u/' + owner.id),
  }
}

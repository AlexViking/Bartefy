import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { getItem } from '@/lib/api'
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

  const { data, isLoading } = useQuery({
    queryKey: keys.item(itemId ?? ''),
    queryFn: async () => {
      const { data: row, error } = await getItem(itemId!)
      if (error) throw error
      return row as Record<string, unknown>
    },
    enabled: !!itemId,
    staleTime: STALE.item,
  })

  if (isLoading || !data) {
    return { ready: false as const, isLoading, goBack: () => navigate(-1) }
  }

  const photos = Array.isArray(data.images) ? (data.images as string[]) : []
  const hasRealPhotos = photos.length > 0 && photos[0]?.startsWith('http')
  const ownerData = data.owner as Record<string, unknown> | null
  const eyeingData = data.eyeing as Record<string, unknown>[] | null

  const item = {
    id: String(data.id),
    title: String(data.title ?? ''),
    category: String(data.category ?? ''),
    condition: String(data.condition ?? ''),
    description: String(data.description ?? ''),
    wants: Array.isArray(data.wants_in_return) ? (data.wants_in_return as string[]) : [],
    eyeing: eyeingData?.[0]?.eyeing_count != null ? Number(eyeingData[0].eyeing_count) : 0,
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

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { searchItems } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export const BROWSE_CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']

const NEW_FOR_MS = 48 * 3600_000

export interface BrowseItem {
  id: string
  title: string
  owner: string
  distance: string
  photoUrl?: string
  photoColor: string
  isNew: boolean
}

/** Search state and results, with no layout in it. */
export function useBrowse() {
  const navigate = useNavigate()
  const city = useAuthStore((s) => s.selectedCity) || 'Berlin'
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [radiusKm, setRadiusKm] = useState(15)

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query, cats, city, radiusKm],
    queryFn: async () => {
      const { data, error } = await searchItems({
        query: query || undefined,
        categories: cats.length > 0 ? cats : undefined,
        radiusKm,
        city,
      })
      if (error) throw error
      const items = (data?.items ?? []) as Record<string, unknown>[]
      return items.map((it): BrowseItem => {
        const photos = it.image ?? it.photo_urls
        const firstPhoto = Array.isArray(photos) && photos.length > 0 ? String(photos[0]) : undefined
        const ownerObj = it.owner as Record<string, unknown> | string | undefined
        const owner =
          typeof ownerObj === 'object' && ownerObj
            ? String(ownerObj.name ?? 'Swapper')
            : String(ownerObj ?? 'Swapper')
        return {
          id: String(it.id),
          title: String(it.title ?? ''),
          owner,
          distance: String(it.location_city ?? city),
          photoUrl: firstPhoto,
          photoColor: 'hsl(var(--illo-terracotta))',
          isNew: Boolean(
            it.created_at && Date.now() - new Date(String(it.created_at)).getTime() < NEW_FOR_MS,
          ),
        }
      })
    },
  })

  return {
    query,
    setQuery,
    cats,
    toggleCat: (c: string) =>
      setCats((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c])),
    clearFilters: () => {
      setCats([])
      setQuery('')
    },
    radiusKm,
    widen: () => setRadiusKm((r) => Math.round(r * 2)),
    results,
    isLoading,
    openItem: (id: string) => navigate('/item/' + id),
  }
}

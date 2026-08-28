import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/ui/input'
import { Chip, ToneBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { searchItems } from '@/lib/api'

const CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']

interface BrowseItem {
  id: string
  title: string
  owner: string
  distance: string
  photoUrl?: string
  photoColor: string
  isNew: boolean
}

/** T3 - gallery. Swiping is discovery; this is how people look for something.
 *  Zero results is never a blank grid.
 */
export function Browse() {
  const navigate = useNavigate()
  const city = useAuthStore((s) => s.selectedCity) || 'Berlin'
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<string[]>([])

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query, cats, city],
    queryFn: async () => {
      const { data, error } = await searchItems({
        query: query || undefined,
        categories: cats.length > 0 ? cats : undefined,
        city,
      })
      if (error) throw error
      const items = (data?.items ?? []) as Record<string, unknown>[]
      return items.map((it): BrowseItem => {
        const photos = it.image ?? it.photo_urls
        const firstPhoto = Array.isArray(photos) && photos.length > 0 ? String(photos[0]) : undefined
        const ownerObj = it.owner as Record<string, unknown> | string | undefined
        const ownerName = typeof ownerObj === 'object' && ownerObj
          ? String(ownerObj.name ?? 'Swapper')
          : String(ownerObj ?? 'Swapper')
        return {
          id: String(it.id),
          title: String(it.title ?? ''),
          owner: ownerName,
          distance: String(it.location_city ?? city),
          photoUrl: firstPhoto,
          photoColor: 'hsl(var(--illo-terracotta))',
          isNew: Boolean(it.created_at && Date.now() - new Date(String(it.created_at)).getTime() < 48 * 3600_000),
        }
      })
    },
    enabled: true,
  })

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        <div className="mb-4 flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold lg:text-h2">Browse</h1>
          <Input
            placeholder="Film camera, wool coat, anything"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={cats.includes(c)}
                onClick={() => setCats((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="py-10 text-center font-body text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <EmptyState
            title="Nothing matches that yet"
            body={`Nobody within range has one right now. We can tell you the moment one appears.`}
            actionLabel="Tell me when one appears"
            secondaryLabel="Widen search"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate('/item/' + r.id)}
                  className="flex flex-col gap-2 rounded-lg border border-border/[0.14] bg-card p-3 text-left shadow-card transition-shadow duration-med ease-brand hover:shadow-float"
                >
                  <span
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm"
                    style={{ background: r.photoColor }}
                  >
                    {r.photoUrl && (
                      <img src={r.photoUrl} alt={r.title} className="h-full w-full object-cover" />
                    )}
                    {r.isNew && (
                      <ToneBadge tone="brass" className="absolute left-2 top-2">
                        New find
                      </ToneBadge>
                    )}
                  </span>
                  <span className="font-display text-base font-semibold">{r.title}</span>
                  <span className="font-body text-sm text-muted-foreground">
                    {r.owner} {'\u00b7'} {r.distance}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button variant="ghost">Save this search</Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

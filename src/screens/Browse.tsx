import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/ui/input'
import { Tag, Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']

/** T3 - gallery. Swiping is discovery; this is how people look for something.
 *  Zero results is never a blank grid.
 */
export function Browse() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<string[]>([])

  // TODO(api): searchItems({ query, categories, radiusKm, city })
  const results = Array.from({ length: 8 }).map((_, i) => ({
    id: 'r' + i,
    title: ['Pentax ME Super', 'Hardback Calvino', 'Silk scarf', 'Brass compass'][i % 4],
    owner: ['Mira K.', 'Jonas D.', 'Ana P.', 'Tom R.'][i % 4],
    distance: (i % 5) + 1 + ' km',
    photoColor: [
      'hsl(var(--illo-terracotta))',
      'hsl(var(--illo-denim))',
      'hsl(var(--illo-sage))',
      'hsl(var(--accent))',
    ][i % 4],
    isNew: i < 2,
  }))

  const filtered = results.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))

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
              <Tag
                key={c}
                active={cats.includes(c)}
                onSelect={() => setCats((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))}
              >
                {c}
              </Tag>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nothing matches that yet"
            body="Nobody within 10 km has one right now. We can tell you the moment one appears."
            actionLabel="Tell me when one appears"
            secondaryLabel="Widen to 25 km"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate('/item/' + r.id)}
                  className="flex flex-col gap-2 rounded-lg border border-border/[0.14] bg-card p-3 text-left shadow-card transition-shadow duration-med ease-brand hover:shadow-float"
                >
                  <span className="relative block aspect-[4/3] w-full rounded-sm" style={{ background: r.photoColor }}>
                    {r.isNew && (
                      <Badge tone="brass" className="absolute left-2 top-2">
                        New find
                      </Badge>
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

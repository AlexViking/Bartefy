import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/badge'
import { HuntStack } from '@/components/hunt/HuntStack'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { WantsRow } from '@/components/swap/WantsRow'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { SwapPair } from '@/components/swap/SwapPair'
import { useHuntStore, type CardItem } from '@/store/hunt'

const CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl']

/** T1 - focus + rails. Filters left, stack centre, detail right on desktop;
 *  mobile drops both rails (filters become a sheet, detail a scroll-up).
 *  The match celebration is a sheet over this screen, never its own page.
 */
export function Hunt() {
  const navigate = useNavigate()
  const cards = useHuntStore((s) => s.cardQueue)
  const removeTopCard = useHuntStore((s) => s.removeTopCard)
  const addToLikeHistory = useHuntStore((s) => s.addToLikeHistory)
  const [filters, setFilters] = useState<string[]>([])
  const [matched, setMatched] = useState<CardItem | null>(null)

  const top = cards[0]

  const decide = (item: CardItem, want: boolean) => {
    // TODO(api): recordSwipe({ targetItemId, targetOwnerId, isLike: want })
    if (want) {
      addToLikeHistory(item.id)
      // Mutual interest arrives from the swipe function's response.
      if (item.wants.length > 0 && Math.random() > 0.7) setMatched(item)
    }
    removeTopCard()
  }

  return (
    <AppShell>
      <div className="grid lg:h-[calc(100dvh-68px)] lg:grid-cols-[260px_1fr_300px]">
        {/* Left rail - filters */}
        <aside className="hidden flex-col gap-4 overflow-y-auto border-r border-border/[0.14] bg-card p-4 lg:flex">
          <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
            What you are hunting
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Tag
                key={c}
                active={filters.includes(c)}
                onSelect={() =>
                  setFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))
                }
              >
                {c}
              </Tag>
            ))}
          </div>
        </aside>

        {/* Centre - the stack */}
        <section className="flex flex-col items-center justify-center gap-4 px-5 py-6">
          {top ? (
            <HuntStack cards={cards} onDecide={decide} />
          ) : (
            <EmptyState
              title="Nothing left to hunt today"
              body="You have seen every find within 10 km. Widen the range, or list something of your own - new finds arrive daily."
              actionLabel="Widen to 25 km"
              secondaryLabel="Browse instead"
              onSecondary={() => navigate('/browse')}
            />
          )}
        </section>

        {/* Right rail - detail */}
        <aside className="hidden flex-col gap-4 overflow-y-auto border-l border-border/[0.14] bg-card p-4 lg:flex">
          {top ? (
            <>
              <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                About this find
              </span>
              <OwnerRow
                person={{ id: 'owner', name: top.owner, rating: 4.8, swapCount: 31, verified: true, distanceLabel: top.distance }}
                action="Profile"
              />
              <WantsRow wants={top.wants} matchCount={2} />
              <Button fullWidth onClick={() => navigate('/item/' + top.id)}>
                See everything
              </Button>
            </>
          ) : (
            <p className="font-body text-sm text-muted-foreground">Pick up a card to see its details.</p>
          )}
        </aside>
      </div>

      {/* Match celebration - T5 sheet over the hunt */}
      <ResponsiveSheet
        open={!!matched}
        onOpenChange={(o) => !o && setMatched(null)}
        title={'It is a Bartefy'}
        description={matched ? 'You both want what the other has.' : undefined}
        height="60%"
        footer={
          <div className="flex flex-col gap-2">
            <Button size="lg" fullWidth onClick={() => matched && navigate('/swaps/' + matched.id)}>
              Say hello
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setMatched(null)}>
              Keep hunting
            </Button>
          </div>
        }
      >
        {matched && (
          <SwapPair
            mine={{ id: 'mine', title: 'Your wool scarf', photoColor: 'hsl(var(--illo-denim))' }}
            theirs={{ id: matched.id, title: matched.title, photoColor: matched.photoColor }}
          />
        )}
      </ResponsiveSheet>
    </AppShell>
  )
}

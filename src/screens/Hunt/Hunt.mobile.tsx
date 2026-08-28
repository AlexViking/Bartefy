import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { HuntStack } from '@/components/hunt/HuntStack'
import { NextStep } from '@/components/guidance/NextStep'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/tone-badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SwapPair } from '@/components/swap/SwapPair'
import { T, useT } from '@/i18n/T'
import { HUNT_CATEGORIES, useHunt } from './useHunt'

/** Hunt, phone shape: the stack is the whole screen.
 *
 *  Filters and the find's details are both sheets rather than rails — a phone
 *  has room for one thing at a time, and that thing is the card.
 */
export default function HuntMobile() {
  const h = useHunt()
  const { t } = useT()
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <AppShell>
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <T as="h1" k="hunt.title" className="font-display text-h2 text-foreground" />
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t('browse.filters')}>
                <SlidersHorizontal aria-hidden="true" />
                {t('browse.filters')}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-hero">
              <SheetHeader>
                <SheetTitle data-i18n="hunt.filtersTitle" className="font-display text-h3">
                  {t('hunt.filtersTitle')}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-wrap gap-2 pt-4">
                {HUNT_CATEGORIES.map((c) => (
            <Chip key={c.id} active={h.filters.includes(c.id)} onClick={() => h.toggleFilter(c.id)}>
              {t(c.label)}
            </Chip>
          ))}
              </div>
              <Button
                fullWidth
                size="lg"
                className="mt-6"
                onClick={() => setFiltersOpen(false)}
                data-i18n="common.done"
              >
                {t('common.done')}
              </Button>
            </SheetContent>
          </Sheet>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-6">
          {h.isLoading ? (
            <T as="p" k="hunt.loading" className="font-body text-sm text-muted-foreground" />
          ) : h.top ? (
            <>
              <HuntStack cards={h.cards} onDecide={h.decide} />
              <T
                as="p"
                k="hunt.hintSwipe"
                className="font-body text-[13px] text-muted-foreground"
              />
            </>
          ) : (
            <EmptyState
              title="hunt.emptyTitle"
              body="hunt.emptyBody"
              bodyValues={{ radius: h.radiusKm }}
              actionLabel="hunt.widen"
              actionValues={{ radius: Math.round(h.radiusKm * 2.5) }}
              onAction={h.widen}
              secondaryLabel="hunt.browseInstead"
              onSecondary={h.goBrowse}
            />
          )}
        </section>

        {!h.isLoading && h.cards.length === 0 && (
          <div className="px-5 pb-4">
            <NextStep
              id="hunt-list-first"
              body="stuck.listFirst"
              action="onboarding.listFirst"
              onAction={h.goAdd}
            />
          </div>
        )}
      </div>

      {/* The match celebration is a sheet over the hunt, never its own page. */}
      <Sheet open={!!h.matched} onOpenChange={(o) => !o && h.dismissMatch()}>
        <SheetContent side="bottom" className="rounded-t-hero">
          <SheetHeader>
            <SheetTitle data-i18n="hunt.matchTitle" className="font-display text-h2">
              {t('hunt.matchTitle')}
            </SheetTitle>
          </SheetHeader>
          <T as="p" k="hunt.matchBody" className="pt-1 font-body text-muted-foreground" />
          {h.matched && (
            <div className="py-5">
              <SwapPair
                mine={{ id: 'mine', title: 'Your item', photoColor: 'hsl(var(--illo-denim))' }}
                theirs={{
                  id: h.matched.id,
                  title: h.matched.title,
                  photoColor: h.matched.photoColor,
                }}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              onClick={() => h.matched && h.openSwap(h.matched.id)}
              data-i18n="hunt.sayHello"
            >
              {t('hunt.sayHello')}
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={h.dismissMatch} data-i18n="hunt.keepHunting">
              {t('hunt.keepHunting')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

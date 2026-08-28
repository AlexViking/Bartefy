import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { HuntStack } from '@/components/hunt/HuntStack'
import { NextStep } from '@/components/guidance/NextStep'
import { InfoHint } from '@/components/guidance/InfoHint'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/tone-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { SwapPair } from '@/components/swap/SwapPair'
import { WantsRow } from '@/components/swap/WantsRow'
import { T, useT } from '@/i18n/T'
import { HUNT_CATEGORIES, useHunt } from './useHunt'

/** Hunt, desktop shape: filters left, stack centre, the find's details right.
 *
 *  A wide screen has room to show the decision and its context at once, so
 *  nothing is hidden behind a sheet. The match arrives as a centred dialog
 *  rather than a bottom sheet — bottom sheets on a desktop read as a phone
 *  layout that escaped.
 */
export default function HuntDesktop() {
  const h = useHunt()
  const { t } = useT()

  return (
    <AppShell>
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[260px_1fr_320px]">
        <aside className="flex flex-col gap-4 overflow-y-auto border-r border-border/[0.14] bg-card p-5">
          <div className="flex items-center gap-1.5">
            <T
              as="span"
              k="hunt.filtersTitle"
              className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            />
            <InfoHint k="help.whyWants" side="right" />
          </div>
          <div className="flex flex-wrap gap-2">
            {HUNT_CATEGORIES.map((c) => (
              <Chip key={c} active={h.filters.includes(c)} onClick={() => h.toggleFilter(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <NextStep
            id="hunt-list-first"
            body="stuck.listFirst"
            action="onboarding.listFirst"
            onAction={h.goAdd}
            className="mt-auto"
          />
        </aside>

        <section className="flex flex-col items-center justify-center gap-4 px-6 py-6">
          {h.isLoading ? (
            <T as="p" k="hunt.loading" className="font-body text-sm text-muted-foreground" />
          ) : h.top ? (
            <>
              <HuntStack cards={h.cards} onDecide={h.decide} />
              <T as="p" k="hunt.hintKeys" className="font-body text-[13px] text-muted-foreground" />
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

        <aside className="flex flex-col gap-4 overflow-y-auto border-l border-border/[0.14] bg-card p-5">
          <T
            as="span"
            k="hunt.detailTitle"
            className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
          />
          {h.top ? (
            <>
              <OwnerRow
                person={{
                  id: h.top.ownerId ?? 'owner',
                  name: h.top.owner,
                  rating: h.top.rating,
                  swapCount: h.top.swapCount ?? 0,
                  verified: false,
                  distanceLabel: h.top.distance,
                }}
                action={t('nav.profile')}
              />
              <WantsRow wants={h.top.wants} matchCount={0} />
              <Button fullWidth onClick={() => h.openItem(h.top!.id)} data-i18n="hunt.seeEverything">
                {t('hunt.seeEverything')}
              </Button>
            </>
          ) : (
            <T as="p" k="hunt.detailEmpty" className="font-body text-sm text-muted-foreground" />
          )}
        </aside>
      </div>

      <Dialog open={!!h.matched} onOpenChange={(o) => !o && h.dismissMatch()}>
        <DialogContent className="max-w-[420px] rounded-hero">
          <DialogHeader>
            <DialogTitle data-i18n="hunt.matchTitle" className="font-display text-h2">
              {t('hunt.matchTitle')}
            </DialogTitle>
            <DialogDescription data-i18n="hunt.matchBody" className="font-body text-muted-foreground">
              {t('hunt.matchBody')}
            </DialogDescription>
          </DialogHeader>
          {h.matched && (
            <div className="py-4">
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
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

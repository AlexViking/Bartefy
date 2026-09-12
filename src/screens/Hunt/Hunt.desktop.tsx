import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { WatchPrompt } from '@/components/hunt/WatchPrompt'
import { OfferSheet } from '@/components/offer/OfferSheet'
import { HuntStack } from '@/components/hunt/HuntStack'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { NextStep } from '@/components/guidance/NextStep'
import { Button } from '@/components/ui/button'
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
import { useHunt } from './useHunt'

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
      {/* Two columns, not three.
       *
       *  The filter rail was 260px of vertical chip list -- sixteen categories
       *  one per row, because a 260px column cannot wrap chips -- and with the
       *  app sidebar beside it that was 480px of chrome before the card. The
       *  categories move above the deck where they can wrap into two lines,
       *  and the deck gets the width it was missing. */}
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[1fr_340px]">
        {/* Filters and deck in one column: the chips wrap across the full
            width here instead of stacking sixteen deep in a narrow rail. */}
        <section className="flex min-h-0 flex-col overflow-y-auto px-6 py-5">
          <T as="h1" k="hunt.title" className="sr-only" />

          {/* No category rail on the deck. The pilot's Discover screen is the
              card and nothing else -- and there is nowhere else for filters to
              live now: the app does not filter at all. */}

          {/* The deck, centred in what is left. max-w keeps the card a card:
              a 900px-wide swipe card is a poster. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {h.isLoading ? (
              <T as="p" k="hunt.loading" className="font-body text-sm text-muted-foreground" />
            ) : h.top ? (
              <>
                <HuntStack cards={h.cards} onDecide={h.decide} onUndo={h.rewind} canUndo={h.canRewind} onUndoBlocked={h.rewindBlocked} onSuper={h.superTop} superPrice={h.superPrice} className="max-w-[340px]" />
                <T as="p" k="hunt.hintKeys" className="font-body text-[13px] text-muted-foreground" />
              </>
            ) : (
              <>
                <EmptyState
                  title="hunt.emptyTitle"
                  body="hunt.emptyBody"
                  bodyValues={{ radius: h.radiusKm }}
                  actionLabel="hunt.widen"
                  actionValues={{ radius: Math.round(h.radiusKm * 2.5) }}
                  onAction={h.widen}
                  secondaryLabel="hunt.reachFurther"
                  onSecondary={h.openReachPitch}
                />
                {/* Below the deck's own actions, not among them: widening
                    gets you cards now, this is for when that did not work. */}
                <WatchPrompt />
              </>
            )}
          </div>

          <NextStep
            id="hunt-list-first"
            body="stuck.listFirst"
            action="onboarding.listFirst"
            onAction={h.goAdd}
            className="mt-5"
          />
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
              <Button fullWidth onClick={() => h.openItem(h.top!.publicId)} data-i18n="hunt.seeEverything">
                {t('hunt.seeEverything')}
              </Button>
            </>
          ) : (
            <T as="p" k="hunt.detailEmpty" className="font-body text-sm text-muted-foreground" />
          )}
        </aside>
      </div>

      <OfferSheet
        open={!!h.pendingTarget}
        targetTitle={h.pendingTarget?.title ?? ''}
        mine={h.offers}
        onCancel={h.cancelOffer}
        onConfirm={h.sendOffer}
        sending={h.sending}
        errorKey={h.offerError}
        onAdd={h.goAdd}
        points={h.points}
        superPrice={h.superPrice}
        onNeedPoints={h.goPoints}
        superFirst={h.superIntent}
      />

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
                mine={{
                  id: h.selectedOffer?.id ?? 'mine',
                  // Was the bare string 'Your item' — English in JSX, and wrong
                  // besides: this is the find you chose to offer.
                  title: h.selectedOffer?.title ?? t('hunt.offerMine'),
                  photoUrl: h.selectedOffer?.photoUrl,
                  photoColor: 'hsl(var(--illo-denim))',
                }}
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
      {/* The one upgrade moment on this screen: undo pressed with nothing left
          to undo. Its free route is the truthful one -- the last pass really is
          always free -- so the sheet just closes. */}
      <UpgradeSheet
        open={h.rewindPitch}
        onOpenChange={(o) => !o && h.dismissRewindPitch()}
        moment="just_passed"
      />

      {/* Reach, asked for rather than pushed. The free widen stays the primary
          action on the empty state itself. */}
      <UpgradeSheet
        open={h.reachPitch}
        onOpenChange={(o) => !o && h.dismissReachPitch()}
        moment="stack_empty"
        onFreeRoute={() => {
          h.dismissReachPitch()
          h.widen()
        }}
      />

    </AppShell>
  )
}

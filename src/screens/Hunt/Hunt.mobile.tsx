import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { OfferSheet } from '@/components/offer/OfferSheet'
import { HuntStack } from '@/components/hunt/HuntStack'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { NextStep } from '@/components/guidance/NextStep'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SwapPair } from '@/components/swap/SwapPair'
import { T, useT } from '@/i18n/T'
import { useHunt } from './useHunt'

/** Hunt, phone shape: the stack is the whole screen.
 *
 *  No heading and no filter button. The card already says what it is, and a
 *  title reading "Today's finds" above it spent a fifth of a 390px screen
 *  restating that -- the deck is the screen. Filters are gone from the app
 *  entirely: they only ever changed the feed's query key, never its request.
 */
export default function HuntMobile() {
  const h = useHunt()
  const { t } = useT()

  return (
    <AppShell>
      {/* The deck does not scroll.
       *
       *  It was `min-h-[calc(100dvh-72px)]`, which subtracted the tab bar but
       *  not the topbar above it, so the column was always taller than the
       *  space it had and the whole page drifted under a thumb. A swipe deck
       *  that moves vertically while you are swiping horizontally fights the
       *  gesture it exists for.
       *
       *  h-full inside a min-h-0 flex parent, with overflow hidden: the card
       *  is sized by what is left rather than by a guess at the chrome. */}
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 pb-4 pt-2">
          {h.isLoading ? (
            <T as="p" k="hunt.loading" className="font-body text-sm text-muted-foreground" />
          ) : h.top ? (
            <>
              <HuntStack cards={h.cards} onDecide={h.decide} onUndo={h.rewind} canUndo={h.canRewind} onUndoBlocked={h.rewindBlocked} />
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
              secondaryLabel="hunt.reachFurther"
              onSecondary={h.openReachPitch}
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
      <OfferSheet
        open={!!h.pendingTarget}
        targetTitle={h.pendingTarget?.title ?? ''}
        mine={h.offers}
        onCancel={h.cancelOffer}
        onConfirm={h.sendOffer}
        sending={h.sending}
        errorKey={h.offerError}
        onAdd={h.goAdd}
      />

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
                mine={{
                  id: h.selectedOffer?.id ?? 'mine',
                  // Was the bare string 'Your item'. It is now the find you
                  // actually chose to offer, and falls back to translated copy
                  // rather than English in JSX.
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
        </SheetContent>
      </Sheet>
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

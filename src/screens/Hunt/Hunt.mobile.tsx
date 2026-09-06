import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { OfferSheet } from '@/components/offer/OfferSheet'
import { HuntStack } from '@/components/hunt/HuntStack'
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
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <section className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-6 pt-2">
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
    </AppShell>
  )
}

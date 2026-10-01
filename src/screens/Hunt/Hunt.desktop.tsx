import * as React from 'react'

import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { AreaChip } from '@/components/deck/AreaChip'
import { DeckActions } from '@/components/deck/DeckActions'
import { DeckStage, type DeckControl } from '@/components/deck/DeckStage'
import { ExpiringCard, TableCard, TierCard, useNeedsYou } from '@/components/deck/NeedsYou'
import { useIsWide } from '@/lib/platform'
import { useAuthStore } from '@/store/auth'
import { DEFAULT_CITY } from '@/screens/Onboarding/useOnboarding'
import { BOOST_PRICE, DeckEmpty, DiscoverOverlays, useDiscoverUi } from './DiscoverShared'
import { useHunt } from './useHunt'

/** Discover on desktop and tablet -- deck stage R1 + the right rail R1.
 *
 *  The card and its action bar always fit the window: the stage takes the
 *  height left under the top bar and the card's width follows. On a wide
 *  column the card turns landscape with its details beside the photo.
 *
 *  The rail (desktop only -- a tablet's column is too narrow for a third
 *  one) is three foldable cards: offers expiring, My table, your tier. The top
 *  bar carries the page's name and the area the deck draws from.
 */
export default function HuntDesktop() {
  const h = useHunt()
  const ui = useDiscoverUi(h)
  const deck = React.useRef<DeckControl | null>(null)
  const wide = useIsWide()
  const needs = useNeedsYou()
  const city = useAuthStore((s) => s.selectedCity) || DEFAULT_CITY

  return (
    <AppShell>
      <TopBarContext>
        <AreaChip city={city} tier={ui.shell.tier} />
      </TopBarContext>

      <div className="flex h-full min-h-0 gap-6 px-6 pb-[26px] pt-4 lg:gap-8 lg:px-8">
        <section aria-label={h.top?.title ?? ''} className="flex min-w-0 flex-1 flex-col">
          <DeckStage
            cards={h.cards}
            fitFor={h.fitFor}
            loading={h.isLoading}
            onPass={ui.onPass}
            onWant={ui.onWant}
            onOfferFit={ui.onOfferFit}
            onFull={ui.onFull}
            onReport={ui.onReport}
            empty={<DeckEmpty h={h} />}
            control={deck}
            footer={
              <DeckActions
                size="wide"
                disabled={!h.top}
                points={h.points}
                tier={ui.shell.tier}
                superPrice={h.superPrice}
                boostPrice={BOOST_PRICE}
                canUndo={h.canRewind}
                onUndo={h.canRewind ? h.rewind : (h.rewindBlocked ?? (() => {}))}
                onPass={() => deck.current?.pass()}
                onWant={() => deck.current?.want()}
                onSuper={ui.onSuper}
                onBoost={ui.onBoost}
              />
            }
          />
        </section>

        {wide && (
          <aside className="flex w-[clamp(320px,22vw,400px)] shrink-0 flex-col gap-3 overflow-y-auto pb-2">
            <ExpiringCard offers={needs.expiring} />
            <TableCard offersOn={needs.offersOn} />
            <TierCard activeSwaps={needs.activeSwaps} />
          </aside>
        )}
      </div>

      <DiscoverOverlays h={h} ui={ui} />
    </AppShell>
  )
}

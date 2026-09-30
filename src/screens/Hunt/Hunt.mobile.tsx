import * as React from 'react'

import { AppShell } from '@/components/shell/AppShell'
import { DeckActions } from '@/components/deck/DeckActions'
import { DeckStage, type DeckControl } from '@/components/deck/DeckStage'
import { BOOST_PRICE, DeckEmpty, DiscoverOverlays, useDiscoverUi } from './DiscoverShared'
import { useHunt } from './useHunt'

/** Discover on a phone -- layout C (Alex, 2026-09-29).
 *
 *  The five actions own the bottom, the card fills everything between them and
 *  the top bar, and the page never scrolls. The shell swaps its top bar for
 *  the Discover one (⋮ · Swaps · bell · You) and drops the tab bar here only;
 *  the rail's cards live in the ⋮ menu.
 */
export default function HuntMobile() {
  const h = useHunt()
  const ui = useDiscoverUi(h)
  const deck = React.useRef<DeckControl | null>(null)

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-7">
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
            allowWide={false}
          />
        </div>
        <div className="mt-2 shrink-0 border-t border-input bg-card pb-[env(safe-area-inset-bottom)]">
          <DeckActions
            size="compact"
            bare
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
            onBoost={() => void h.boostMine()}
          />
        </div>
      </div>

      <DiscoverOverlays h={h} ui={ui} />
    </AppShell>
  )
}

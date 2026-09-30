import * as React from 'react'
import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/EmptyState'
import { MatchMoment } from '@/components/deck/MatchMoment'
import { OfferComposer } from '@/components/deck/OfferComposer'
import { ReportItemSheet } from '@/components/hunt/ReportItemSheet'
import { WatchPrompt } from '@/components/hunt/WatchPrompt'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { useShellData } from '@/components/shell/useShellData'
import { useExperiment } from '@/lib/experiments'
import { PERK_PRICES } from '@/lib/points'
import type { CardItem } from '@/store/hunt'
import type { OfferOption, useHunt } from './useHunt'

type Hunt = ReturnType<typeof useHunt>

/** The state both Discover layouts share: which card's photos are open, which
 *  is being reported, and which of my finds the composer starts with. */
export function useDiscoverUi(h: Hunt) {
  const [viewer, setViewer] = React.useState<{ card: CardItem; index: number } | null>(null)
  const [reporting, setReporting] = React.useState<CardItem | null>(null)
  const [preselect, setPreselect] = React.useState<string | undefined>()
  const shell = useShellData()

  return {
    shell,
    viewer,
    reporting,
    preselect,
    onFull: (card: CardItem, index: number) => setViewer({ card, index }),
    onReport: (card: CardItem) => setReporting(card),
    onPass: (card: CardItem) => void h.decide(card, false),
    /** Put on Table: the composer, with whatever fits already picked. */
    onWant: (card: CardItem) => {
      setPreselect(h.fitFor(card)?.id)
      void h.decide(card, true)
    },
    onOfferFit: (card: CardItem, fit: OfferOption) => {
      setPreselect(fit.id)
      void h.decide(card, true)
    },
    onSuper: () => {
      setPreselect(h.fitFor(h.top)?.id)
      h.superTop()
    },
    setViewer,
    setReporting,
  }
}

type Ui = ReturnType<typeof useDiscoverUi>

/** Everything that opens over the deck. Drawn once per layout. */
export function DiscoverOverlays({ h, ui }: { h: Hunt; ui: Ui }) {
  const navigate = useNavigate()
  const photos = ui.viewer ? (ui.viewer.card.photos?.length ? ui.viewer.card.photos : ui.viewer.card.photoUrl ? [ui.viewer.card.photoUrl] : []) : []

  return (
    <>
      <OfferComposer
        open={!!h.pendingTarget}
        target={h.pendingTarget}
        mine={h.offers}
        preselect={ui.preselect}
        superFirst={h.superIntent}
        points={h.points}
        superPrice={h.superPrice}
        multiPrice={h.multiPrice}
        sending={h.sending}
        errorKey={h.offerError}
        onCancel={h.cancelOffer}
        onSend={(id, asSuper) => void h.sendOffer(id, undefined, asSuper)}
        onSendMulti={(ids) => void h.sendMultiOffer(ids)}
        onAdd={h.goAdd}
        onNeedPoints={h.goPoints}
      />

      <MatchMoment
        match={h.matched}
        onHello={(id) => {
          h.dismissMatch()
          navigate('/matches/' + id)
        }}
        onClose={h.dismissMatch}
      />

      <PhotoViewer
        open={!!ui.viewer}
        photos={photos}
        index={ui.viewer?.index ?? 0}
        onIndexChange={(i) => ui.viewer && ui.setViewer({ ...ui.viewer, index: i })}
        onClose={() => ui.setViewer(null)}
        title={ui.viewer?.card.title ?? ''}
      />

      {ui.reporting && (
        <ReportItemSheet
          open
          onOpenChange={(o) => !o && ui.setReporting(null)}
          itemId={ui.reporting.id}
          itemTitle={ui.reporting.title}
          ownerId={ui.reporting.ownerId}
          ownerName={ui.reporting.owner}
          onDone={() => {
            // A reported find leaves this deck, the way a pass does.
            const card = ui.reporting
            ui.setReporting(null)
            if (card) void h.decide(card, false)
          }}
        />
      )}

      {/* Undo pressed again with nothing left to undo: the one upgrade moment
          on this screen. The last pass stays free. */}
      <UpgradeSheet open={h.rewindPitch} onOpenChange={(o) => !o && h.dismissRewindPitch()} moment="just_passed" />
      {/* Reach, asked for rather than pushed. */}
      <UpgradeSheet
        open={h.reachPitch}
        onOpenChange={(o) => !o && h.dismissReachPitch()}
        moment="stack_empty"
        onFreeRoute={() => {
          h.dismissReachPitch()
          h.widen()
        }}
      />
    </>
  )
}

/** The deck ran out. deck_empty_cta decides the order: B leads with "tell me
 *  when one turns up", because widening does nothing when there genuinely is
 *  nothing nearby. */
export function DeckEmpty({ h }: { h: Hunt }) {
  const variant = useExperiment('deck_empty_cta')
  return (
    <div className="flex max-h-full w-full flex-col items-center gap-4 overflow-y-auto py-6">
      {variant === 'b' && <WatchPrompt />}
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
      {variant !== 'b' && <WatchPrompt />}
    </div>
  )
}

export const BOOST_PRICE = PERK_PRICES.boost

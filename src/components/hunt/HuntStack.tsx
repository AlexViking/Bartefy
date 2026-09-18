import { useEffect, useRef, useState, type ReactNode } from 'react'

import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

import { Icon } from '@/components/ui/icon'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { ReportItemSheet } from './ReportItemSheet'
import { Stamp } from '@/components/ui/stamp'
import { useT } from '@/i18n/T'
import { ActionButtons } from './ActionButtons'
import { HuntCard } from './HuntCard'
import type { CardItem } from '@/store/hunt'
import { SWIPE_COMMIT_PX, SWIPE_COMMIT_VELOCITY, settle as settleSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'


/** Stack, stamps and the pass/want actions are one organism.
 *
 *  Drag is pointer-based, so it works with a finger, a mouse and a pen. The
 *  buttons and the arrow keys do the same job — swiping is never the only way
 *  through the feed, which matters for anyone who cannot drag accurately.
 */
export function HuntStack({
  cards,
  onDecide,
  onUndo,
  canUndo = false,
  onUndoBlocked,
  onSuper,
  superPrice,
  onBoost,
  className,
  cardClassName,
  fill = false,
  wide = false,
  topSlot,
}: {
  cards: CardItem[]
  onDecide: (item: CardItem, want: boolean) => void
  onUndo?: () => void
  canUndo?: boolean
  /** Pressed undo with nothing left to undo. When given, the button stays
   *  live in that state so the press has somewhere to go -- a disabled button
   *  cannot explain why it is disabled. */
  onUndoBlocked?: () => void
  /** Send a priority offer for the top card. Omitted where it is unavailable,
   *  which removes the button rather than showing a dead one. */
  onSuper?: () => void
  superPrice?: number
  /** Put this find in front of more people, for points. The perk has existed
   *  since 024 at 75 points and no screen ever spent it -- the deck is where
   *  the wanting happens, so it lives here. Omitted where unavailable, which
   *  removes the tile rather than showing a dead one. */
  onBoost?: () => void
  className?: string
  /** Shape of the card itself, as opposed to `className` which sizes the deck
   *  around it. Desktop widens the card to 600px and turns it landscape; the
   *  phone leaves this unset and keeps the 3:4 portrait card.
   *
   *  It must reach BOTH cards below -- the top one and the one showing behind
   *  it. Passing it to the top card alone makes the next card change shape the
   *  moment the current one flies away. */
  cardClassName?: string
  /** Fill the box instead of sitting in the middle of it as a 340px card.
   *
   *  The phone deck. The card takes the whole area the shell leaves it, its
   *  details move onto the photo as an overlay, and the three action buttons
   *  float over the bottom of the card rather than sitting under it in normal
   *  flow -- which is what a swipe deck has looked like since about 2019 and
   *  is why 270px of a 844px phone was empty parchment.
   *
   *  Desktop leaves this off: there the card is a card, centred in a column
   *  with a details pane beside it. */
  fill?: boolean
  /** Content for the band across the top of a filling card.
   *
   *  A slot rather than baked-in content: this is where experiments put
   *  whatever they are trying -- a countdown, a streak, a nudge -- without
   *  HuntStack having to know what any of them are. Renders nothing, and
   *  draws no band, when empty. Only used when `fill` is set; a 340px card in
   *  a column has no room for a band and does not want one. */
  topSlot?: ReactNode
  /** The card is much wider than the photos it shows -- see HuntCard. */
  wide?: boolean
}) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)

  /** The deck takes focus on mount so the arrow keys work straight away.
   *
   *  onKeyDown lives on the card, so until something focused it the desktop
   *  hint -- "Or use the left and right arrow keys" -- was a promise the
   *  screen did not keep: you had to click the card first, and clicking it is
   *  not an obvious thing to do when the buttons are right there.
   *
   *  preventScroll because focusing an element the browser thinks is partly
   *  off-screen otherwise jumps the page to it. */
  useEffect(() => {
    // Never steal focus from someone already typing or tabbing elsewhere.
    const active = document.activeElement
    if (active && active !== document.body && active !== ref.current) return
    ref.current?.focus({ preventScroll: true })
  }, [])
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-13, 0, 13])
  const passOpacity = useTransform(x, [-140, -30, 0], [1, 0, 0])
  /** A wash across the whole card, not just the stamps. Colour arriving before
   *  you release is what tells you which way you are committing while your
   *  thumb is still down. */
  const tint = useTransform(
    x,
    [-160, 0, 160],
    ['hsl(var(--swipe-pass) / 0.22)', 'hsl(var(--swipe-pass) / 0)', 'hsl(var(--swipe-offer) / 0.22)'],
  )
  const swapOpacity = useTransform(x, [0, 30, 140], [0, 0, 1])

  const [reporting, setReporting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [viewerAt, setViewerAt] = useState(0)

  const top = cards[0]
  const behind = cards[1]

  /** Send the card off screen, THEN report the decision.
   *
   *  This used to start the animation and call x.set(0) on the very next
   *  line, so the reset raced the 280ms flight: whichever won was a matter
   *  of timing, which is why a card could freeze halfway out with its PASS
   *  stamp showing and never leave.
   *
   *  Sequenced now -- the animation's promise resolves, then the decision is
   *  reported and x is reset for the card mounting into this same element.
   *  A ref guards re-entry: two taps, or a tap landing on a keypress, would
   *  otherwise decide two cards from one gesture.
   */
  const flying = useRef(false)
  const fly = (want: boolean) => {
    if (!top || flying.current) return
    flying.current = true
    const card = top

    // A pass removes the card, so it flies off and never comes back.
    //
    // A want does NOT: under the locked rule a like IS an offer, so the swipe
    // is not finished until the person has chosen what to put up -- the card
    // has to stay while the offer sheet is open, and come back if they
    // cancel. So it springs back to centre and the sheet takes over.
    //
    // Flying it out on a want is what left a card stranded at +600 with its
    // SWAP stamp showing: nothing removed it, and nothing told this component
    // the sheet had closed, so it simply stayed there.
    if (want) {
      onDecide(card, true)
      animate(x, 0, settleSpring).then(() => {
        flying.current = false
      })
      return
    }

    animate(x, -600, { duration: 0.28, ease: [0.3, 0, 0.6, 1] }).then(() => {
      onDecide(card, false)
      x.set(0)
      flying.current = false
    })
  }

  if (!top) return null

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        // min-h-0 so the card can actually shrink to the box: a flex child
        // defaults to min-height:auto and would otherwise push its own
        // overflow through the tab bar.
        // relative: when filling, the action row below is positioned against
        // this box rather than sitting under the card in normal flow.
        fill ? 'relative h-full min-h-0 flex-1' : 'max-w-[340px]',
        className,
      )}
    >
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={`${t('hunt.hintSwipe')}. ${t('hunt.hintKeys')}`}
        className={cn(
          'relative select-none rounded-hero outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
          fill && 'min-h-0 flex-1',
        )}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') fly(false)
          if (e.key === 'ArrowRight') fly(true)
        }}
      >
        {/* The real next card, not a blank rectangle.
            
            This used to be an empty `bg-card` div, so dragging the top card
            aside revealed a featureless panel -- the deck looked like it had
            run out at every single swipe. The card behind is already in the
            queue and its photo is already decoded by the time it shows (see
            warmAhead in useHunt), so there is nothing to wait for.

            aria-hidden and pointer-events-none: it is scenery until it is the
            top card, and a screen reader announcing two listings at once
            would be worse than showing none. */}
        {behind && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 origin-center scale-[0.94] overflow-hidden rounded-hero opacity-70 shadow-card"
          >
            <HuntCard item={behind} fill={fill} wide={wide} className={cardClassName} />
          </div>
        )}
        {/* Physics ported from V5, in the order they matter:
             1. rotation derives from x, so the card pivots around a point
                below the finger -- that is what makes it feel like a card
                rather than a sliding div;
             2. the stamps fade in proportion to distance, so you know what
                releasing will do BEFORE you release;
             3. released under the threshold it springs back, over it flies.

            Commit is distance OR velocity. Distance alone means a confident
            flick that only travels 90px is ignored, which feels like the card
            stuck to your finger. */}
        <motion.div
          key={top.id}
          className={cn('relative', fill && 'h-full')}
          style={{ x, rotate, cursor: 'grab' }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          whileDrag={{ cursor: 'grabbing' }}
          onDragEnd={(_, info) => {
            const past = Math.abs(info.offset.x) > SWIPE_COMMIT_PX
            const flicked = Math.abs(info.velocity.x) > SWIPE_COMMIT_VELOCITY
            if (past || flicked) fly(info.offset.x > 0)
            else animate(x, 0, settleSpring)
          }}
        >
          <motion.div
            style={{ background: tint }}
            className="pointer-events-none absolute inset-0 z-10 rounded-hero"
          />
          <motion.div style={{ opacity: swapOpacity }} className="pointer-events-none">
            <Stamp kind="swap" visible />
          </motion.div>
          <motion.div style={{ opacity: passOpacity }} className="pointer-events-none">
            <Stamp kind="pass" visible />
          </motion.div>
          <HuntCard item={top} fill={fill} wide={wide} className={cardClassName} onExpand={(i) => { setViewerAt(i); setViewing(true) }} />
          {/* On the card, per the scope contract: the moment you notice a
              listing is wrong is the moment you are looking at it. Behind a
              menu on the detail screen, most people just swipe past instead.
              stopPropagation so tapping the flag never starts a drag. */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setReporting(true)
            }}
            aria-label={t('report.action')}
            className="absolute bottom-3 right-3 z-20 grid size-9 place-items-center rounded-pill bg-card/85 text-muted-foreground backdrop-blur-sm transition-colors hover:text-destructive"
          >
            <Icon name="ShieldAlert" size={16} />
          </button>
        </motion.div>
      </div>

      <PhotoViewer
        open={viewing}
        photos={top.photos ?? (top.photoUrl ? [top.photoUrl] : [])}
        index={viewerAt}
        onIndexChange={setViewerAt}
        onClose={() => setViewing(false)}
        title={top.title}
      />

      <ReportItemSheet
        open={reporting}
        onOpenChange={setReporting}
        itemId={top.id}
        itemTitle={top.title}
        ownerId={top.ownerId}
        ownerName={top.owner}
        onDone={() => fly(false)}
      />

      {/* The top band. Same overlay treatment as the action row below, at the
          opposite edge: a gradient so arbitrary photo content stays readable
          underneath, and pointer-events only on the children so the card can
          still be dragged from anywhere the band does not actually cover. */}
      {fill && topSlot && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 rounded-t-hero bg-gradient-to-b from-black/80 via-black/45 to-transparent px-4 pb-10 pt-4">
          {/* Same 640px column as the details below, so the two bands line up
              with each other rather than each running to its own edge. */}
          <div className={cn('flex w-full items-start justify-between gap-2 [&>*]:pointer-events-auto', wide && 'mx-auto max-w-[560px]')}>
            {topSlot}
          </div>
        </div>
      )}

      {/* Over the card when it fills the screen, under it when it does not.
          A full-bleed card with the buttons below it would give back the
          height the fill just bought. z-20 clears the card's tint and stamps
          layer (z-10), or a drag would fade the buttons out with the card. */}
      <div
        className={cn(
          'flex items-center justify-center',
          fill
            ? cn(
                'pointer-events-none absolute inset-x-0 z-20 [&>*]:pointer-events-auto',
                // Room for the price line below when there is one.
                onSuper && superPrice != null ? 'bottom-7' : 'bottom-4',
              )
            : 'mt-4',
        )}
      >
        <ActionButtons
          onPass={() => fly(false)}
          onWant={() => fly(true)}
          onUndo={onUndo ? (canUndo ? onUndo : onUndoBlocked) : undefined}
          canUndo={canUndo}
          onSuper={onSuper}
          onBoost={onBoost}
        />
      </div>

      {/* The price, under the row. On the button it would not fit; omitted
          entirely, a brass star is a mystery. */}
      {onSuper && superPrice != null && (
        <p
          data-i18n="hunt.superPrice"
          className={cn(
            'text-center font-body text-xs',
            // On the photo it needs its own contrast, not muted-foreground:
            // over a dark image that colour is unreadable, and over a light
            // one it disappears. Under the card it keeps the quiet treatment.
            fill
              ? 'pointer-events-none absolute inset-x-0 bottom-1 z-20 text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]'
              : 'mt-2 text-muted-foreground',
          )}
        >
          {t('hunt.superPrice', { price: superPrice })}
        </p>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'

import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

import { Icon } from '@/components/ui/icon'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { ReportItemSheet } from './ReportItemSheet'
import { Stamp } from '@/components/ui/stamp'
import { useT } from '@/i18n/T'
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
  className,
}: {
  cards: CardItem[]
  onDecide: (item: CardItem, want: boolean) => void
  onUndo?: () => void
  canUndo?: boolean
  /** Pressed undo with nothing left to undo. When given, the button stays
   *  live in that state so the press has somewhere to go -- a disabled button
   *  cannot explain why it is disabled. */
  onUndoBlocked?: () => void
  className?: string
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

  /** Send the card off screen, then report the decision. Declared before the
   *  early return so the hook order above it never changes. */
  const fly = (want: boolean) => {
    if (!top) return
    animate(x, want ? 600 : -600, { duration: 0.28, ease: [0.3, 0, 0.6, 1] })
    onDecide(top, want)
    // Reset for the next card, which mounts into this same element.
    x.set(0)
  }

  if (!top) return null

  return (
    <div className={cn('flex w-full max-w-[340px] flex-col', className)}>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={`${t('hunt.hintSwipe')}. ${t('hunt.hintKeys')}`}
        className="relative select-none rounded-hero outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
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
            <HuntCard item={behind} />
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
          className="relative"
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
          <HuntCard item={top} onExpand={(i) => { setViewerAt(i); setViewing(true) }} />
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

      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={t('hunt.pass')}
          onClick={() => fly(false)}
          className="flex size-[60px] items-center justify-center rounded-pill border-2 border-destructive bg-card text-destructive shadow-float transition-colors duration-fast ease-brand hover:bg-destructive/[0.06] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <X className="size-6" aria-hidden="true" />
        </button>

        {onUndo && (
          <button
            type="button"
            aria-label={t('hunt.undo')}
            onClick={canUndo ? onUndo : onUndoBlocked}
            disabled={!canUndo && !onUndoBlocked}
            className="flex size-11 items-center justify-center rounded-pill border-[1.5px] border-border/[0.14] bg-card text-muted-foreground shadow-card transition-colors duration-fast ease-brand hover:bg-foreground/[0.06] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          aria-label={t('hunt.want')}
          onClick={() => fly(true)}
          className="flex size-[60px] items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-float transition-colors duration-fast ease-brand hover:bg-[var(--green-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <Check className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

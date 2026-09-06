import { useRef } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'

import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

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
  className,
}: {
  cards: CardItem[]
  onDecide: (item: CardItem, want: boolean) => void
  onUndo?: () => void
  canUndo?: boolean
  className?: string
}) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-13, 0, 13])
  const passOpacity = useTransform(x, [-140, -30, 0], [1, 0, 0])
  const swapOpacity = useTransform(x, [0, 30, 140], [0, 0, 1])

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
        className="relative select-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded-hero"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') fly(false)
          if (e.key === 'ArrowRight') fly(true)
        }}
      >
        {behind && (
          <div className="absolute -bottom-2 left-3 right-3 top-2 rounded-hero bg-card opacity-60 shadow-card" />
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
          <motion.div style={{ opacity: swapOpacity }} className="pointer-events-none">
            <Stamp kind="swap" visible />
          </motion.div>
          <motion.div style={{ opacity: passOpacity }} className="pointer-events-none">
            <Stamp kind="pass" visible />
          </motion.div>
          <HuntCard item={top} />
        </motion.div>
      </div>

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
            onClick={onUndo}
            disabled={!canUndo}
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

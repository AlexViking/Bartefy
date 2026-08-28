import { useRef, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'

import { Stamp } from '@/components/ui/stamp'
import { useT } from '@/i18n/T'
import { HuntCard } from './HuntCard'
import type { CardItem } from '@/store/hunt'
import { cn } from '@/lib/utils'

const THRESHOLD = 0.4

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
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const width = useRef(1)
  const ref = useRef<HTMLDivElement>(null)

  const top = cards[0]
  const behind = cards[1]
  if (!top) return null

  const ratio = dx / (width.current * THRESHOLD)

  const settle = () => {
    setDragging(false)
    if (Math.abs(ratio) >= 1) onDecide(top, dx > 0)
    setDx(0)
  }

  return (
    <div className={cn('flex w-full max-w-[340px] flex-col', className)}>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={`${t('hunt.hintSwipe')}. ${t('hunt.hintKeys')}`}
        className="relative select-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded-hero"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onDecide(top, false)
          if (e.key === 'ArrowRight') onDecide(top, true)
        }}
        onPointerDown={(e) => {
          width.current = ref.current?.offsetWidth ?? 1
          startX.current = e.clientX
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => dragging && setDx(e.clientX - startX.current)}
        onPointerUp={settle}
        onPointerCancel={settle}
      >
        {behind && (
          <div className="absolute -bottom-2 left-3 right-3 top-2 rounded-hero bg-card opacity-60 shadow-card" />
        )}
        <div
          className="relative"
          style={{
            transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
            transition: dragging ? 'none' : 'transform 240ms var(--ease-out)',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
        >
          <Stamp kind="swap" visible={ratio >= 1} />
          <Stamp kind="pass" visible={ratio <= -1} />
          <HuntCard item={top} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={t('hunt.pass')}
          onClick={() => onDecide(top, false)}
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
          onClick={() => onDecide(top, true)}
          className="flex size-[60px] items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-float transition-colors duration-fast ease-brand hover:bg-[var(--green-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <Check className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

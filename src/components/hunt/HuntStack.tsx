import { useRef, useState } from 'react'
import { Stamp } from '@/components/ui/stamp'
import { Icon } from '@/components/ui/icon'
import { HuntCard } from './HuntCard'
import type { CardItem } from '@/store/hunt'

const THRESHOLD = 0.4

/** Stack, stamps and the pass/want actions are one organism.
 *  Drag is pointer-based so it works with a mouse, a finger and a pen.
 *  Keyboard: left arrow passes, right arrow wants - the feed must be usable
 *  without dragging at all.
 */
export function HuntStack({
  cards,
  onDecide,
}: {
  cards: CardItem[]
  onDecide: (item: CardItem, want: boolean) => void
}) {
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
    if (Math.abs(ratio) >= 1) {
      onDecide(top, dx > 0)
    }
    setDx(0)
  }

  return (
    <div
      className="relative w-full max-w-[340px] select-none outline-none"
      tabIndex={0}
      role="group"
      aria-label="Hunt cards. Left arrow passes, right arrow wants."
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onDecide(top, false)
        if (e.key === 'ArrowRight') onDecide(top, true)
      }}
      ref={ref}
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
          transform: 'translateX(' + dx + 'px) rotate(' + dx * 0.03 + 'deg)',
          transition: dragging ? 'none' : 'transform 240ms var(--ease-out)',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        <Stamp kind="swap" visible={ratio >= 1} />
        <Stamp kind="pass" visible={ratio <= -1} />
        <HuntCard item={top} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label="Pass"
          onClick={() => onDecide(top, false)}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[#A05340] bg-card text-[#A05340] shadow-float"
        >
          <Icon name="X" size={24} />
        </button>
        <button
          type="button"
          aria-label="Want to swap"
          onClick={() => onDecide(top, true)}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float"
        >
          <Icon name="Check" size={24} />
        </button>
      </div>
    </div>
  )
}

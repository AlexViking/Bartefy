import * as React from 'react'

import type { OfferOption } from '@/screens/Hunt/useHunt'
import type { CardItem } from '@/store/hunt'
import { DeckCard } from './DeckCard'

/** Past this many pixels a drag decides: left = Pass, right = Put on Table. */
const DECIDE_AT = 110
const EASE = 'transform 240ms cubic-bezier(0.2,0,0,1), opacity 240ms cubic-bezier(0.2,0,0,1)'

export interface DeckControl {
  pass: () => void
  want: () => void
}

/** Measure an element's box, live. */
function useBox<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, box] as const
}

/** Deck stage R1 (Alex, 2026-09-27): "I want to see the find card and under
 *  it the action bar. I do not want to scroll down to reach the action bar."
 *
 *  The card is sized from the SPACE, not the page: it fills the height this
 *  stage is given, and its width follows (a 0.78 portrait, 520px at least). The action bar is
 *  the caller's, below the stage, so card + actions always fit the window.
 *
 *  When the column is wide enough (860px) the card turns landscape with the
 *  details panel beside the photo (360px, 420px from 1200px) -- the answer to
 *  "massive empty space around cards" on big screens (2026-09-28).
 *
 *  Drag: left passes, right opens the composer (the card only leaves once the
 *  offer is sent). Keys: ← → pass / put on table, ↑ ↓ details.
 */
export function DeckStage({
  cards,
  fitFor,
  loading,
  onPass,
  onWant,
  onOfferFit,
  onFull,
  onReport,
  empty,
  allowWide = true,
  footer,
  control,
}: {
  cards: CardItem[]
  fitFor: (card: CardItem) => OfferOption | undefined
  loading: boolean
  onPass: (card: CardItem) => void
  onWant: (card: CardItem) => void
  onOfferFit: (card: CardItem, fit: OfferOption) => void
  onFull: (card: CardItem, photo: number) => void
  onReport: (card: CardItem) => void
  /** Drawn when the deck runs out. */
  empty: React.ReactNode
  /** Phones never go landscape. */
  allowWide?: boolean
  /** Drawn under the card at the card's own width (the action bar). */
  footer?: React.ReactNode
  /** Lets the action bar pass or want WITH the card's motion, the same as a
   *  drag -- a button press should not make the card simply vanish. */
  control?: React.MutableRefObject<DeckControl | null>
}) {
  const [ref, box] = useBox<HTMLDivElement>()
  const [dx, setDx] = React.useState(0)
  const [flying, setFlying] = React.useState<{ id: string; dir: -1 | 1 } | null>(null)
  const [details, setDetails] = React.useState(false)
  const drag = React.useRef<{ x: number; y: number; id: number; on: boolean } | null>(null)

  const top = cards[0]
  const next = cards[1]

  // Width from the height: a 0.78 portrait, but never under 520px (the mock's
  // --photo-w) -- on a short window the card gets squarer instead of
  // narrower, so the action bar under it keeps its full width. Never wider
  // than the column.
  const photoW = Math.max(520, box.h * 0.78)
  const wide = allowWide && box.w >= 860
  const panelW = box.w >= 1200 ? 420 : 360
  const cardW = Math.min(box.w, wide ? photoW + panelW : allowWide ? photoW : box.w)

  React.useEffect(() => {
    setDetails(false)
    setDx(0)
  }, [top?.id])

  const pass = React.useCallback(() => {
    if (!top || flying) return
    setFlying({ id: top.id, dir: -1 })
    // The card leaves on screen first, then the deck moves on.
    window.setTimeout(() => {
      setFlying(null)
      setDx(0)
      onPass(top)
    }, 200)
  }, [top, flying, onPass])

  const want = React.useCallback(() => {
    if (!top || flying) return
    setDx(0)
    onWant(top)
  }, [top, flying, onWant])

  React.useEffect(() => {
    if (control) control.current = { pass, want }
  }, [control, pass, want])

  // Keys, unless someone is typing or a dialog is open over the deck.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, [contenteditable], [role=dialog], [role=menu]')) return
      if (document.querySelector('[role=dialog][data-state=open]')) return
      if (e.key === 'ArrowLeft') pass()
      else if (e.key === 'ArrowRight') want()
      else if (e.key === 'ArrowUp' && !wide) setDetails(true)
      else if (e.key === 'ArrowDown') setDetails(false)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pass, want, wide])

  // A tap stays a tap: the photo zones, the info button and the fit pill are
  // buttons. Only past 6px does the gesture become a drag and take the
  // pointer -- capturing on pointerdown would swallow every tap on the card.
  const onPointerDown = (e: React.PointerEvent) => {
    if (details || e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const move = e.clientX - d.x
    if (!d.on) {
      if (Math.abs(move) < 6) return
      d.on = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    setDx(move)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.on) return
    const move = e.clientX - d.x
    if (move <= -DECIDE_AT) pass()
    else if (move >= DECIDE_AT) want()
    else setDx(0)
  }

  const stamp = Math.max(-1, Math.min(1, dx / DECIDE_AT))
  const topStyle: React.CSSProperties = flying
    ? { transform: `translateX(${flying.dir * 130}%) rotate(${flying.dir * 16}deg)`, opacity: 0, transition: EASE }
    : dx
      ? { transform: `translateX(${dx}px) rotate(${dx / 20}deg)`, transition: 'none' }
      : { transform: 'none', transition: EASE }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
    <div ref={ref} className="relative min-h-0 w-full flex-1">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2" style={{ width: cardW || '100%' }}>
        {loading && !top ? (
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-secondary" />
        ) : !top ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-2xl border-2 border-dashed border-input px-6 text-center">
            {empty}
          </div>
        ) : (
          <>
            {next && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ transform: 'translateY(14px) scale(.95)', transition: EASE }}
              >
                <DeckCard
                  card={next}
                  fit={fitFor(next)}
                  wide={wide}
                  panelWidth={panelW}
                  stamp={0}
                  onFull={() => {}}
                  onOfferFit={() => {}}
                  onReport={() => {}}
                  detailsOpen={false}
                  onDetails={() => {}}
                />
              </div>
            )}
            <div
              key={top.id}
              data-deck-top
              className="absolute inset-0 touch-none"
              style={topStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                drag.current = null
                setDx(0)
              }}
            >
              <DeckCard
                card={top}
                fit={fitFor(top)}
                wide={wide}
                panelWidth={panelW}
                stamp={stamp}
                onFull={(i) => onFull(top, i)}
                onOfferFit={(f) => onOfferFit(top, f)}
                onReport={() => onReport(top)}
                detailsOpen={details}
                onDetails={setDetails}
              />
            </div>
          </>
        )}
      </div>
    </div>
    {footer && (
      <div className="relative z-[1] mx-auto w-full shrink-0" style={{ maxWidth: cardW || undefined }}>
        {footer}
      </div>
    )}
    </div>
  )
}

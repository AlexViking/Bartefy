import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The deck's five actions, as glass tiles.
 *
 *  Ported from ActionButtons.svg: squircles with a backdrop blur and a
 *  coloured outline icon, replacing the solid circles the deck used before.
 *
 *  HTML BUTTONS, NOT ONE SVG. The first version drew the whole row as a single
 *  SVG and put the blur in a <foreignObject>. That is what the source file
 *  does, and on iOS Safari it fails completely: backdrop-filter inside a
 *  foreignObject blurs the layer's own contents along with what is behind it,
 *  so the tiles and their icons dissolved into the photo and the row vanished
 *  -- five coloured smudges and nothing else. Reported from a real iPhone; it
 *  renders correctly in desktop Chrome, which is why it shipped.
 *
 *  Real <button>s with CSS clip-path keep the designed shapes, put the blur on
 *  an ordinary element where every browser handles it, and bring focus, hit
 *  area and keyboard behaviour for free rather than being rebuilt out of
 *  <rect> and tabIndex.
 *
 *  The palette is deliberately NOT the three-variant button rule. That rule
 *  governs buttons in the product's chrome; the deck is a surface of its own,
 *  and a hue per action is recognisable at a glance mid-swipe without reading.
 */

/** Straight from the SVG, so a redesign can be diffed against the source. */
const COLOURS = {
  undo: '#FFBC03',
  pass: '#FE4C6A',
  super: '#21BBFF',
  want: '#44EAC5',
  boost: '#AC52E6',
} as const

type Action = keyof typeof COLOURS

/** The squircle, as a clip-path in percentages so one shape scales to any tile
 *  size. The cut corner faces OUTWARD from the centre of the row -- that is
 *  what makes five buttons read as one object -- so each tile names which of
 *  its corners is square. */
const SHAPES = {
  /** Cut at bottom-LEFT. Used by the tiles left of centre, so the flat edge
   *  faces away from the middle of the row. Getting this backwards points
   *  every cut inward and the five tiles stop reading as one object -- which
   *  is the whole reason the shapes are not plain rounded squares. */
  cutBL: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 34%)',
  /** Cut at bottom-RIGHT, for the tiles right of centre. */
  cutBR: 'polygon(0% 0%, 100% 0%, 100% 34%, 100% 100%, 0% 100%)',
  /** The small centre tile. */
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
} as const

const strokeProps = (c: string, width = 2) => ({
  stroke: c,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
})

interface Tile {
  size: number
  shape: string
  /** A clip-path cannot round corners, so the rounding is an ordinary
   *  border-radius underneath and the clip only squares off the one corner
   *  that should be square. */
  radius: number
  icon: (colour: string) => React.ReactNode
}

const TILES: Record<Action, Tile> = {
  undo: {
    size: 49,
    shape: SHAPES.cutBL,
    radius: 14,
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d="M12 15.3C16.6 15.3 20.5 17.7 22 21V20C22 14 17.6 9.1 12 8.7V4L4 12L12 20V15.3"
          {...strokeProps(c)}
        />
      </svg>
    ),
  },
  pass: {
    size: 73,
    shape: SHAPES.cutBL,
    radius: 20,
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path d="M6 6L18 18M18 6L6 18" {...strokeProps(c, 2.5)} />
      </svg>
    ),
  },
  super: {
    size: 54,
    shape: SHAPES.diamond,
    radius: 10,
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d="M12 17.3L6.2 20.5L7.4 14.5L3 10.4L9.1 9.7L12 4.2L14.9 9.7L21 10.4L16.6 14.5L17.8 20.5L12 17.3Z"
          {...strokeProps(c)}
        />
      </svg>
    ),
  },
  want: {
    size: 73,
    shape: SHAPES.cutBR,
    radius: 20,
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path d="M20 6.5L9.5 17.5L4 12" {...strokeProps(c, 2.5)} />
      </svg>
    ),
  },
  boost: {
    size: 49,
    shape: SHAPES.cutBR,
    radius: 14,
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d="M13 2L4.5 13.5H11L10 22L18.5 10.5H12L13 2Z" {...strokeProps(c)} />
      </svg>
    ),
  },
}

const ORDER: Action[] = ['undo', 'pass', 'super', 'want', 'boost']

export interface ActionButtonsProps {
  onUndo?: () => void
  onPass: () => void
  onSuper?: () => void
  onWant: () => void
  onBoost?: () => void
  /** Undo is dimmed, not removed, when there is nothing to undo: a button that
   *  vanishes shifts the other four under a thumb already moving toward one. */
  canUndo?: boolean
  className?: string
}

export function ActionButtons({
  onUndo,
  onPass,
  onSuper,
  onWant,
  onBoost,
  canUndo = false,
  className,
}: ActionButtonsProps) {
  const { t } = useT()

  const handlers: Record<Action, (() => void) | undefined> = {
    undo: onUndo,
    pass: onPass,
    super: onSuper,
    want: onWant,
    boost: onBoost,
  }
  const labels: Record<Action, string> = {
    undo: 'hunt.undo',
    pass: 'hunt.pass',
    super: 'hunt.superOfferShort',
    want: 'hunt.want',
    boost: 'hunt.boost',
  }

  return (
    <div
      role="group"
      aria-label={t('hunt.actions')}
      className={cn('flex items-center justify-center gap-2', className)}
    >
      {ORDER.map((a) => {
        const on = handlers[a]
        // An action with no handler is not drawn at all. A tile that cannot be
        // pressed is worse than a gap -- the row is still legible with four.
        if (!on) return null
        const tile = TILES[a]
        const dim = a === 'undo' && !canUndo
        return (
          <button
            key={a}
            type="button"
            onClick={on}
            aria-label={t(labels[a])}
            aria-disabled={dim || undefined}
            style={{
              width: tile.size,
              height: tile.size,
              clipPath: tile.shape,
              borderRadius: tile.radius,
              // Opaque enough to hold against a BRIGHT photo: at the source
              // file's 50% the yellow in a product shot came straight through
              // and washed the tile out.
              backgroundColor: 'rgba(20,20,20,0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            className={cn(
              'grid shrink-0 place-items-center transition-transform duration-fast ease-brand',
              'active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
              dim && 'opacity-40',
            )}
          >
            {tile.icon(COLOURS[a])}
          </button>
        )
      })}
    </div>
  )
}

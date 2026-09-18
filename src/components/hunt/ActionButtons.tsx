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

/** The real tile outlines, lifted from ActionButtons.svg and translated so
 *  each starts at its own 0,0. Used as `clip-path: path(...)`, so what renders
 *  is the designed shape exactly -- not a polygon approximating it.
 *
 *  Percentage polygons were the first attempt and they cannot express these:
 *  every corner except the cut one is genuinely ROUNDED, with its own radius,
 *  and the super tile is not a diamond but a rounded hexagon whose top and
 *  bottom points differ. Approximating that produced five shapes that were
 *  visibly not the design.
 *
 *  Because a path is in absolute units, each tile must render at the size the
 *  path was authored for -- see SIZES. */
const TILE_PATHS = {
  undo: 'M49 15.7965V40C49 44.4183 45.4183 48 41 48H16.2942C14.1751 48 12.1426 47.1593 10.6428 45.6623L2.3486 37.3841C0.845 35.8833 0 33.8462 0 31.7218V8C0 3.5817 3.5817 0 8 0H33.1941C35.3142 0 37.3475 0.8415 38.8476 2.3398L46.6535 10.1363C48.1558 11.6368 49 13.6731 49 15.7965Z',
  pass: 'M77 23.0588V68C77 72.4183 73.418 76 69 76H23.732C21.602 76 19.561 75.151 18.0592 73.6409L2.3273 57.8204C0.8367 56.3214 0 54.2934 0 52.1795V8C0 3.5817 3.5817 0 8 0H54.036C56.167 0 58.209 0.8498 59.711 2.3611L74.675 17.42C76.164 18.9188 77 20.9459 77 23.0588Z',
  super: 'M2.413 43.8921L21.643 62.0221C24.857 65.053 30.069 65.053 33.284 62.0221L52.902 43.5263C54.444 42.0726 55.311 40.1016 55.313 38.0458L55.326 25.5622C55.328 23.5012 54.461 21.5241 52.915 20.0668L34.057 2.2879C30.843 -0.743 25.63 -0.743 22.416 2.2879L2.42 21.1398C0.877 22.5941 0.01 24.5663 0.009 26.623L0.001 38.3995C0 40.4595 0.868 42.4355 2.413 43.8921Z',
  want: 'M0 23.0588V68C0 72.4183 3.582 76 8 76H53.268C55.398 76 57.439 75.151 58.941 73.6409L74.673 57.8204C76.163 56.3214 77 54.2934 77 52.1795V8C77 3.5817 73.418 0 69 0H22.964C20.833 0 18.791 0.8498 17.289 2.3611L2.325 17.42C0.836 18.9188 0 20.9459 0 23.0588Z',
  boost: 'M0 15.7965V40C0 44.4183 3.582 48 8 48H32.706C34.825 48 36.857 47.1593 38.357 45.6623L46.651 37.3841C48.155 35.8833 49 33.8462 49 31.7218V8C49 3.5817 45.418 0 41 0H15.806C13.686 0 11.652 0.8415 10.152 2.3398L2.347 10.1363C0.844 11.6368 0 13.6731 0 15.7965Z',
} as const

/** Authored size of each path, and where its TOP sits relative to the row.
 *
 *  The five are aligned along their TOPS at y=20 in the source, not along
 *  their bottoms -- undo and boost end at y=68 while the others run to y=96.
 *  An earlier read of the screenshot called this bottom-aligned and it was
 *  wrong; these numbers come from getBBox on the real paths. */
const SIZES = {
  undo: { w: 49, h: 48, top: 0 },
  pass: { w: 77, h: 76, top: 0 },
  super: { w: 55.33, h: 64.3, top: 11.2 },
  want: { w: 77, h: 76, top: 0 },
  boost: { w: 49, h: 48, top: 0 },
} as const

const strokeProps = (c: string, width = 2) => ({
  stroke: c,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
})

interface TileIcon {
  icon: (colour: string) => React.ReactNode
}

const TILES: Record<Action, TileIcon> = {
  undo: {
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
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path d="M6 6L18 18M18 6L6 18" {...strokeProps(c, 2.5)} />
      </svg>
    ),
  },
  super: {
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
    icon: (c) => (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path d="M20 6.5L9.5 17.5L4 12" {...strokeProps(c, 2.5)} />
      </svg>
    ),
  },
  boost: {
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
      // items-start plus each tile's own marginTop: the five are aligned
      // along their TOPS in the source, and the super tile alone is pushed
      // down. Measured from the paths, not read off a screenshot.
      className={cn('flex items-start justify-center gap-[7px]', className)}
    >
      {ORDER.map((a) => {
        const on = handlers[a]
        // Undo ALWAYS renders. It is the one action whose availability changes
        // from card to card, and a tile that disappears the moment there is
        // nothing to undo shifts the other four sideways under a thumb already
        // moving toward one of them -- so the button you meant to press is not
        // where it was a second ago. Disabled and dimmed instead.
        //
        // Every other action is either available for the whole session or not
        // wired at all, so dropping those is safe and keeps the row legible.
        if (!on && a !== 'undo') return null
        const tile = TILES[a]
        const size = SIZES[a]
        const disabled = a === 'undo' && (!canUndo || !on)
        return (
          <button
            key={a}
            type="button"
            onClick={on}
            disabled={disabled}
            aria-label={t(labels[a])}
            style={{
              ['--glow' as string]: COLOURS[a],
              // The authored size. A path clip is in absolute units, so the
              // element has to be exactly the box the path was drawn for.
              width: size.w,
              height: size.h,
              marginTop: size.top,
              clipPath: `path('${TILE_PATHS[a]}')`,
              // Opaque enough to hold against a BRIGHT photo: at the source
              // file's 50% the yellow in a product shot came straight through
              // and washed the tile out.
              backgroundColor: 'rgba(20,20,20,0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            className={cn(
              'grid shrink-0 place-items-center transition-transform duration-fast ease-brand',
              // The icon glows in its own colour. Two shadows: a tight one for
              // definition against a light photo, and a wide soft one for the
              // light itself -- the source does this with stdDeviation 17 on
              // the icon's own alpha.
              '[&_svg]:[filter:drop-shadow(0_0_3px_var(--glow))_drop-shadow(0_0_10px_var(--glow))]',
              'active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
              // Visibly unavailable, and actually unpressable: `disabled`
              // alone looks identical, and opacity alone still takes the tap.
              disabled && 'cursor-default opacity-40',
            )}
          >
            {tile.icon(COLOURS[a])}
          </button>
        )
      })}
    </div>
  )
}

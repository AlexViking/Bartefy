import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The deck's five actions, as glass tiles.
 *
 *  Ported from ActionButtons.svg: squircles with a backdrop blur and a
 *  coloured outline icon, rather than the solid circles the deck used before.
 *
 *  THE SHAPES ARE THE POINT. Each tile has one corner cut square while the
 *  other three stay round, and the cut corner faces outward from the centre --
 *  the two outer tiles point away, the inner ones point in. That is what makes
 *  the row read as one object instead of five buttons in a line, and it is why
 *  these are drawn as paths rather than assembled from border-radius.
 *
 *  The palette is deliberately NOT the three-variant button rule. That rule
 *  governs buttons in the product's chrome; the deck is a surface of its own
 *  and these colours were designed for it -- each action gets a hue so it can
 *  be recognised without reading anything, at a glance, mid-swipe.
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

/** viewBox 0 0 400 115, as authored. Every path below is in that space. */
const TILES: Record<Action, string> = {
  undo: 'M69 35.7965V60C69 64.4183 65.4183 68 61 68H36.2942C34.1751 68 32.1426 67.1593 30.6428 65.6623L22.3486 57.3841C20.845 55.8833 20 53.8462 20 51.7218V28C20 23.5817 23.5817 20 28 20H53.1941C55.3142 20 57.3475 20.8415 58.8476 22.3398L66.6535 30.1363C68.1558 31.6368 69 33.6731 69 35.7965Z',
  pass: 'M158.75 43.0588V88C158.75 92.4183 155.168 96 150.75 96H105.482C103.352 96 101.311 95.151 99.8095 93.6416L88.3486 82.1194C86.845 80.6103 86 78.5654 86 76.4336V31C86 26.5817 89.5817 23 94 23H139.194C141.314 23 143.348 23.8415 144.848 25.3398L156.654 37.1363C158.156 38.6368 159 40.6731 159 42.7965L158.75 43.0588Z',
  super: 'M176.063 75.0921L195.293 93.2221C198.507 96.253 203.719 96.253 206.934 93.2221L226.552 74.7263C229.816 71.6501 229.816 66.6608 226.552 63.5846L206.934 45.0888C203.719 42.0579 198.507 42.0579 195.293 45.0888L176.063 63.2188C172.799 66.295 172.799 71.2843 176.063 75.0921Z',
  want: 'M244.25 43.0588V88C244.25 92.4183 247.832 96 252.25 96H297.518C299.648 96 301.689 95.151 303.191 93.6416L314.651 82.1194C316.155 80.6103 317 78.5654 317 76.4336V31C317 26.5817 313.418 23 309 23H263.806C261.686 23 259.652 23.8415 258.152 25.3398L246.346 37.1363C244.844 38.6368 244 40.6731 244 42.7965L244.25 43.0588Z',
  boost: 'M334 35.7965V60C334 64.4183 337.582 68 342 68H366.706C368.825 68 370.857 67.1593 372.357 65.6623L380.651 57.3841C382.155 55.8833 383 53.8462 383 51.7218V28C383 23.5817 379.418 20 375 20H349.806C347.686 20 345.652 20.8415 344.152 22.3398L336.346 30.1363C334.844 31.6368 334 33.6731 334 35.7965Z',
}

/** Icon geometry, also in the 400x115 space, so an icon sits inside its tile
 *  without any per-icon offset maths. */
const ICONS: Record<Action, { d: string; width: number; fillRule?: boolean }[]> = {
  undo: [{ d: 'M43 46.329C47.594 46.329 51.499 48.692 53 52L53 50.993C53 44.977 48.579 40.07 43 39.702L43 35L35 43L43 51L43 46.333', width: 2 }],
  pass: [
    { d: 'M110.667 49.3719L128.333 67.0386', width: 2.5 },
    { d: 'M128.333 49.3719L110.667 67.0386', width: 2.5 },
  ],
  super: [{ d: 'M201.552 67.2888L196.433 69.5811L197.497 64.5073L193.638 60.7865L199.072 60.1473L201.552 55.4872L204.033 60.1473L209.466 60.7865L205.608 64.5073L206.671 69.5811L201.552 67.2888Z', width: 2, fillRule: true }],
  want: [{ d: 'M295.25 50.4791L278.75 66.5208L271.25 59.2291', width: 2.5 }],
  boost: [{ d: 'M364.823 43.575L358.812 52.258C358.261 53.053 357.014 52.664 357.014 51.696L357.014 45.973L351.989 45.973C351.193 45.973 350.724 45.079 351.178 44.424L357.189 35.741C357.74 34.946 358.987 35.335 358.987 36.303L358.987 42.026L364.012 42.026C364.807 42.026 365.276 42.92 364.823 43.575Z', width: 2, fillRule: true }],
}

/** Tap targets, in viewBox units. The drawn tiles are smaller than 44px at
 *  the sizes this renders, so each button carries a transparent rect sized
 *  for a thumb -- the shape is what you see, this is what you can hit. */
const HITBOX: Record<Action, { x: number; y: number; w: number; h: number }> = {
  undo: { x: 14, y: 14, w: 61, h: 60 },
  pass: { x: 80, y: 17, w: 85, h: 85 },
  super: { x: 168, y: 38, w: 66, h: 62 },
  want: { x: 238, y: 17, w: 85, h: 85 },
  boost: { x: 328, y: 14, w: 61, h: 60 },
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
    <svg
      viewBox="0 0 400 115"
      className={cn('h-[115px] w-full max-w-[400px] overflow-visible', className)}
      role="group"
      aria-label={t('hunt.actions')}
    >
      <defs>
        {/* One blur filter for every tile. backdropFilter is not available in
            SVG, so the glass is a real blur of what is behind, clipped to the
            tile -- which is why each tile needs its own clipPath. */}
        {ORDER.map((a) => (
          <clipPath key={a} id={`ab-clip-${a}`}>
            <path d={TILES[a]} />
          </clipPath>
        ))}
        <filter id="ab-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* A real backdrop blur behind each tile.
          
          The source file used backdrop-filter, which SVG has no equivalent
          for -- rendered as plain SVG the tiles were nearly invisible over a
          busy photo, because #222121 at 50% does not separate from anything.
          foreignObject puts an actual HTML div in the SVG's coordinate space,
          clipped to the tile's own path, so the blur is the CSS one and the
          shape is still the designed shape. Same technique the source used. */}
      {ORDER.map((a) =>
        handlers[a] ? (
          <foreignObject
            key={`blur-${a}`}
            x="0"
            y="0"
            width="400"
            height="115"
            clipPath={`url(#ab-clip-${a})`}
          >
            <div
              // @ts-expect-error -- xmlns is required inside foreignObject and
              // is not in React's HTML prop types.
              xmlns="http://www.w3.org/1999/xhtml"
              style={{ height: '100%', width: '100%', backdropFilter: 'blur(6px)' }}
            />
          </foreignObject>
        ) : null,
      )}

      {ORDER.map((a) => {
        const on = handlers[a]
        // An action with no handler is not drawn at all. Boost and super are
        // both optional, and a tile that cannot be pressed is worse than a
        // gap -- the row is still legible with four.
        if (!on) return null
        const dim = a === 'undo' && !canUndo
        const hit = HITBOX[a]
        return (
          <g key={a} className={cn('cursor-pointer', dim && 'opacity-40')}>
            {/* The glass. fill-opacity 0.5 over a blur of the photo behind,
                with a hairline edge -- straight from the source file. */}
            {/* 0.62 was still translucent enough that the bright yellow in a
                product photo came through and washed the tile out. The glass
                has to hold against ANY photo, not just a dark one. */}
            <path d={TILES[a]} fill="#141414" fillOpacity={0.78} />
            {/* A light hairline, not the source's near-black one: over a photo
                the dark edge disappeared into the tile and the shape lost its
                outline entirely. */}
            <path d={TILES[a]} stroke="#FFFFFF" strokeOpacity={0.16} fill="none" />

            {ICONS[a].map((icon, i) => (
              <path
                key={i}
                d={icon.d}
                stroke={COLOURS[a]}
                strokeWidth={icon.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                fillRule={icon.fillRule ? 'evenodd' : undefined}
                clipRule={icon.fillRule ? 'evenodd' : undefined}
                filter="url(#ab-glow)"
              />
            ))}

            {/* The tap target, last so it is on top of everything it covers.
                A real <rect> rather than pointer-events on the path: the drawn
                shapes are smaller than a thumb, and the cut corners leave gaps
                a finger lands in. */}
            <rect
              x={hit.x}
              y={hit.y}
              width={hit.w}
              height={hit.h}
              fill="transparent"
              className="cursor-pointer outline-none"
              role="button"
              tabIndex={0}
              aria-label={t(labels[a])}
              aria-disabled={dim || undefined}
              onClick={on}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  on()
                }
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}

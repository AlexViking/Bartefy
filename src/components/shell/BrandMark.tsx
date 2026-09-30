import type * as React from 'react'

import symbolUrl from '@/assets/brand/symbol.webp'
import wordmarkUrl from '@/assets/brand/wordmark.webp'
import { cn } from '@/lib/utils'

/** A brand asset drawn as a CSS mask, so one file renders in any colour.
 *
 *  The Brand Book approves four colourings (Green on white, White on green,
 *  White on ink, Ink on stone). Shipping a PNG per colouring was four files per
 *  mark; a mask filled with `currentColor` is one file each, and the dark theme
 *  gets Paper for free. Both files are the book's own masks, cropped and
 *  resized to 2x their largest use (2 KB and 6 KB).
 */
function Mask({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block bg-current', className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  )
}

/** The app icon: white symbol on a Barter Green tile, 22% radius, the symbol
 *  at 62% of the tile height (Brand Book §04). Green in both themes -- the
 *  tile is the brand, not a surface. */
export function BrandTile({ size = 48 }: { size?: 40 | 48 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[22%] bg-green text-white transition-colors duration-fast ease-brand group-hover:bg-forest"
      style={{ width: size, height: size }}
    >
      {/* The symbol is 78x120: at 62% of the tile height. */}
      <Mask src={symbolUrl} style={{ height: size * 0.62, width: size * 0.62 * (78 / 120) }} />
    </span>
  )
}

/** B | Bartefy -- the tile, a hairline, the wordmark. Only beside the full side
 *  nav; the rail, the tablet and the phone show the tile alone.
 *
 *  An exception to Brand Book §04 ("don't place the symbol next to the
 *  wordmark") that Alex chose on 2026-09-27; the hairline keeps it from
 *  reading "BBartefy". The wordmark is 100px wide, above the 80px minimum. */
export function BrandLockup({ withWord }: { withWord: boolean }) {
  return (
    <span className="flex items-center gap-4">
      <BrandTile size={48} />
      {withWord && (
        <>
          <span aria-hidden="true" className="block h-8 w-px bg-[hsl(var(--brand-word)/0.25)]" />
          <Mask
            src={wordmarkUrl}
            className="text-[hsl(var(--brand-word))]"
            // 353x96 -> 100px wide.
            style={{ width: 100, height: 100 * (96 / 353) }}
          />
        </>
      )}
    </span>
  )
}

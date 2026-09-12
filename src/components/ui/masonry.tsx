import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A column-balanced masonry grid.
 *
 *  Item photos are not one shape. Measured across the live listings: ten are
 *  3:4 portrait, five 4:3 landscape, three are phone screenshots as tall as
 *  0.45, plus a square and a wide one — the same camera held two ways, and
 *  screenshots that match neither. A single fixed box cannot serve that range.
 *  Forcing one either crops the photo (object-cover) or pillarboxes it in bars
 *  of background (object-contain); the grid showed the second, which is what
 *  made the profile look broken.
 *
 *  So the cell adapts to the photo rather than the other way round: every card
 *  is one column wide and as tall as its own image needs, and nothing is cropped
 *  or padded.
 *
 *  CSS `columns` is deliberately not used. It fills column-by-column, so cards
 *  read top-to-bottom in the wrong order and a keyboard tab moves down a column
 *  instead of across the row. This distributes children across real flex columns
 *  in DOM order instead, keeping reading order and focus order intact.
 */
export function Masonry({
  children,
  columns,
  gap = 12,
  className,
}: {
  children: ReactNode[]
  /** Column count, chosen by the caller's layout rather than a media query. */
  columns: number
  /** Pixel gutter, matched to the caller's grid gap. */
  gap?: number
  className?: string
}) {
  const items = children.filter(Boolean)
  const cols: ReactNode[][] = Array.from({ length: columns }, () => [])

  // Round-robin rather than shortest-column: without knowing each image's
  // height up front (items stores no dimensions yet) a "shortest column" pass
  // can only measure after load, which reflows the whole grid as photos arrive.
  // Round-robin is stable, gives correct left-to-right reading order, and is
  // close to balanced when heights are similar.
  items.forEach((child, i) => cols[i % columns].push(child))

  return (
    <div className={cn('flex items-start', className)} style={{ gap }}>
      {cols.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
          {col}
        </div>
      ))}
    </div>
  )
}

/** A photo that keeps its own proportions inside a masonry cell.
 *
 *  The box's height comes from the image's real aspect ratio, so there is
 *  nothing to letterbox and nothing to crop. Until the ratio is known the cell
 *  holds a 4:3 placeholder, which is the commonest landscape shape and keeps
 *  the grid from collapsing to nothing while photos load.
 *
 *  `items` does not store width/height, so the ratio has to be learned from the
 *  loaded image. Storing dimensions at upload would let the correct box be
 *  reserved before the photo arrives and remove the reflow entirely — Img
 *  already expects exactly that.
 */
export function MasonryPhoto({
  src,
  alt,
  fallbackColor,
  ratio: knownRatio,
  className,
  children,
}: {
  src?: string
  alt: string
  fallbackColor?: string
  /** The photo's aspect ratio, if the row already knows it (items.photo_meta,
   *  written at upload since this component's own TODO was finally done).
   *  Given this, the cell is the right shape on first paint and never
   *  reflows -- which is what made the grid jump as each photo landed. */
  ratio?: number | null
  className?: string
  children?: ReactNode
}) {
  const [ratio, setRatio] = useState<number | null>(knownRatio ?? null)
  /** Has the photo actually painted? Until it has, the cell shows a quiet
   *  skeleton rather than a block of colour. fallbackColor was terracotta --
   *  an illustration accent -- so a loading grid was a wall of orange
   *  rectangles that then resized. Colour reads as content; a skeleton reads
   *  as "not yet". */
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  // A cached image can finish loading before React attaches onLoad, which
  // would leave the cell stuck at the placeholder ratio. Read naturalWidth on
  // mount for that case.
  useEffect(() => {
    const el = ref.current
    // A cached image finishes before React attaches onLoad, so without this
    // it would sit at opacity 0 forever -- a blank cell where a photo the
    // browser already has should be.
    if (el?.complete && el.naturalWidth > 0) {
      setLoaded(true)
      // A known ratio is authoritative; measuring would only confirm it and
      // cost a render.
      if (!knownRatio) setRatio(el.naturalWidth / el.naturalHeight)
    }
  }, [src, knownRatio])

  return (
    <span
      className={cn(
        'relative block w-full overflow-hidden rounded-sm',
        // The skeleton IS the background until the photo paints. Once it has,
        // the shimmer stops -- an animation running under an opaque image is
        // work nobody can see.
        !loaded && 'animate-pulse bg-secondary',
        className,
      )}
      style={{
        aspectRatio: ratio ?? 4 / 3,
        // Only once loaded, and only if a colour was given: painting it
        // underneath a photo that covers it is invisible, and painting it
        // while loading is the orange-rectangle problem.
        background: loaded ? fallbackColor : undefined,
      }}
    >
      {src && (
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget
            if (!knownRatio && img.naturalWidth > 0) {
              setRatio(img.naturalWidth / img.naturalHeight)
            }
            setLoaded(true)
          }}
          // Fading in rather than appearing: with the box already the right
          // shape there is no reflow, so the only change left is the pixels.
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 240ms var(--ease-out)' }}
          // object-cover is correct here and not a regression: the box is
          // already the image's own shape, so there is nothing to crop. It
          // only guards the sub-pixel rounding between the ratio and the
          // rendered box.
          className="size-full object-cover"
        />
      )}
      {children}
    </span>
  )
}

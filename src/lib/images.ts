/** Photo variants. Generated once at upload time by the R2 worker, addressed by
 *  a content hash so every URL is immutable and cacheable forever.
 *
 *  R2 / CDN headers to set on these keys:
 *    Cache-Control: public, max-age=31536000, immutable
 */
export type Variant = 'thumb' | 'card' | 'full'

const WIDTH: Record<Variant, number> = { thumb: 200, card: 640, full: 1600 }

export interface Photo {
  /** Content-hashed base key, no extension. */
  key: string
  width: number
  height: number
  /** 16px inline placeholder, already in the JSON payload - costs no request. */
  lqip?: string
}

const CDN = import.meta.env.VITE_CDN_URL ?? ''

export const photoUrl = (photo: Photo, variant: Variant = 'card') =>
  CDN + '/' + photo.key + '_' + WIDTH[variant] + '.webp'

/** Let the browser pick by density and layout width. */
export const photoSrcSet = (photo: Photo) =>
  (['thumb', 'card', 'full'] as Variant[]).map((v) => photoUrl(photo, v) + ' ' + WIDTH[v] + 'w').join(', ')

export const aspectRatio = (photo: Photo) => photo.width / photo.height

/** Fetch and decode ahead of time so the pixels are ready before the element
 *  exists. decode() is the part that matters - a loaded-but-undecoded image
 *  still costs a frame on the main thread when it first paints.
 */
export async function warmPhoto(photo: Photo, variant: Variant = 'card') {
  const img = new Image()
  img.src = photoUrl(photo, variant)
  try {
    await img.decode()
  } catch {
    /* offline or aborted - the <Img> fallback handles it */
  }
}

/** Longest edge of a stored photo.
 *
 *  1280, not 1600: the largest a photo is ever shown is the full-screen viewer
 *  on a phone, where 1280 on the long edge already exceeds what the screen
 *  resolves. The extra pixels cost megabytes on mobile data and buy nothing
 *  anyone can see. */
const MAX_EDGE = 1280

/** Hard ceiling per stored photo.
 *
 *  This is a budget, not a hope. The bucket is metered and a listing carries
 *  up to five photos, so an encoder that "usually" produces 300 KB is not good
 *  enough -- one 12MP panorama from a phone that encodes badly is 4 MB, and
 *  five of those is a listing costing 20 MB to store and serve forever.
 *
 *  400 KB at 1280px is a good photograph. Anything above it is detail nobody
 *  looking at a second-hand chair will ever notice. */
const MAX_BYTES = 400 * 1024

/** Quality ladder. Each rung is tried in turn until one fits the budget.
 *  Starting high means a small photo keeps its quality; the lower rungs only
 *  ever run for images that genuinely need them. */
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5]

/** Last resort when even the lowest quality will not fit: shrink the pixels
 *  as well. Runs at most twice, so the floor is 1280 * 0.75 * 0.75 = 720px. */
const SHRINK_STEPS = [1, 0.75, 0.5625]

/** Re-encode a picked file to WebP, downscaling the longest edge to MAX_EDGE.
 *
 *  The R2 object key ends in `.webp`, so this is not an optimisation — an
 *  unconverted JPEG stored under that key would be served with the wrong type.
 *  Encoding happens on the client because there is no image worker yet; when
 *  the variant worker lands it takes over the resizing and this keeps only the
 *  format guarantee.
 *
 *  Throws if the file is not a decodable image, so the caller can mark that
 *  one photo failed rather than failing the whole listing.
 */
export interface EncodedPhoto {
  blob: Blob
  /** The encoded pixel dimensions, which are NOT the file's originals -- the
   *  ladder below downscales. Stored on the item so a grid can reserve the
   *  right box before the photo arrives, instead of guessing 4:3 and
   *  reflowing when it lands. */
  width: number
  height: number
}

export async function toWebP(file: File): Promise<EncodedPhoto> {
  const bitmap = await createImageBitmap(file)
  try {
    let best: Blob | null = null
    let bestW = 0
    let bestH = 0

    for (const shrink of SHRINK_STEPS) {
      const edge = MAX_EDGE * shrink
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas 2d context unavailable')
      // White underneath: a transparent PNG re-encoded to JPEG gets a black
      // background otherwise, which turns a cut-out photo into a silhouette.
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)

      for (const quality of QUALITY_STEPS) {
        const blob = await encode(canvas, quality)
        if (!blob) continue
        // Keep the smallest seen, so even a total failure to hit the budget
        // returns the best attempt rather than the first one. The dimensions
        // travel with it: they belong to THAT rung of the ladder, so tracking
        // them separately is how they stay in step with the blob.
        if (!best || blob.size < best.size) {
          best = blob
          bestW = width
          bestH = height
        }
        if (blob.size <= MAX_BYTES) return { blob, width, height }
      }
    }

    if (!best) throw new Error('image encoding failed')
    return { blob: best, width: bestW, height: bestH }
  } finally {
    bitmap.close()
  }
}

/** One encode attempt, preferring WebP and falling back honestly.
 *
 *  canvas.toBlob SILENTLY ignores a type it cannot encode and hands back a PNG
 *  -- no error, no warning, nothing at the call site. Older iOS Safari does
 *  exactly this with image/webp, which is how a 1280px photo reached the
 *  bucket at 3.4 MB: it was a lossless PNG of a photograph all along.
 *
 *  So the result's type is checked rather than trusted, and a JPEG is produced
 *  instead. A lossy JPEG beats a lossless PNG every time here: these are
 *  photographs of second-hand things, not diagrams.
 */
async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  const webp = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (webp && webp.type === 'image/webp') return webp

  return new Promise<Blob | null>((resolve) =>
    // Slightly higher than the WebP figure: JPEG needs more to reach the same
    // perceived quality, and this path only runs where WebP is unavailable.
    canvas.toBlob(resolve, 'image/jpeg', Math.min(1, quality + 0.03)),
  )
}

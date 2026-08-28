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

/** Longest edge of a stored original. Big enough for a full-screen view on a
 *  dense phone, small enough that a 12MP camera photo does not cost the user
 *  several megabytes of mobile data on the way up. */
const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82

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
export async function toWebP(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    )
    if (!blob) throw new Error('webp encoding failed')
    return blob
  } finally {
    bitmap.close()
  }
}

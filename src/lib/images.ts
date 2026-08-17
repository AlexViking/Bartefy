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

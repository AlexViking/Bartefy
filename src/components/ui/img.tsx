import { useState } from 'react'
import { cn } from '@/lib/utils'
import { aspectRatio, photoSrcSet, photoUrl, type Photo, type Variant } from '@/lib/images'

/** Every photo in the product goes through this.
 *
 *  Three guarantees:
 *  1. No layout shift - the box is reserved from the stored intrinsic size.
 *  2. Something is always on screen - the LQIP arrives inline with the JSON.
 *  3. The real photo cross-fades in, so nothing ever "pops".
 */
export function Img({
  photo,
  variant = 'card',
  alt = '',
  sizes = '(min-width: 900px) 320px, 50vw',
  priority = false,
  className,
}: {
  photo?: Photo
  variant?: Variant
  alt?: string
  sizes?: string
  /** True only for the top hunt card and the item-detail hero. */
  priority?: boolean
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)

  if (!photo) {
    return <div className={cn('w-full bg-secondary', className)} style={{ aspectRatio: 4 / 3 }} />
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-secondary', className)}
      style={{
        aspectRatio: aspectRatio(photo),
        backgroundImage: photo.lqip ? 'url(' + photo.lqip + ')' : undefined,
        // 'contain' to match the photo above it. With object-contain the
        // letterboxed strips would otherwise show a cropped, zoomed LQIP that
        // does not line up with the real image behind it.
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <img
        src={photoUrl(photo, variant)}
        srcSet={photoSrcSet(photo)}
        sizes={sizes}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-contain transition-opacity duration-med ease-brand',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

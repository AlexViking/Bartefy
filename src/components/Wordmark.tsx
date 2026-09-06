import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The brand lockup.
 *
 *  The asset used to be RGB with a baked-in white background, so on green it
 *  could only be set as type — an opaque rectangle reads as a white box, and
 *  the old `brightness-0 invert` trick made that worse rather than better. It
 *  has had a real alpha channel since the logo was redrawn, so both surfaces
 *  now get the actual mark.
 */
export function Wordmark({
  on = 'light',
  className,
}: {
  /** Which surface it sits on. Kept because the sizes differ: the dark
   *  surfaces are headers and panels, where the lockup sits smaller. */
  on?: 'light' | 'dark'
  className?: string
}) {
  const { t } = useT()

  return (
    <img
      src={logoUrl}
      alt={t('brand.name')}
      // draggable={false} because dragging the logo out of the page is a
      // desktop-browser default that has no meaning in an app.
      draggable={false}
      // Sized by width, not height. The lockup is nearly 2:1, so a height
      // that suited the old type treatment rendered the mark too small to
      // read — the wordmark inside it is a fraction of the asset's height.
      className={cn('h-auto select-none', on === 'dark' ? 'w-[190px]' : 'w-[210px]', className)}
    />
  )
}

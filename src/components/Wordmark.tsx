import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The brand lockup.
 *
 *  The logo asset is RGB with no alpha — it carries a baked-in white
 *  background — so it can only sit on a light surface. The old
 *  `brightness-0 invert` trick turned that opaque rectangle into a white box
 *  rather than a white logo.
 *
 *  On green we therefore set the wordmark as type, which is what the brand
 *  book calls for anyway. Replace `onDark` with a real transparent SVG when
 *  one exists; nothing else needs to change.
 */
export function Wordmark({
  on = 'light',
  className,
}: {
  /** Which surface it sits on. */
  on?: 'light' | 'dark'
  className?: string
}) {
  const { t } = useT()

  if (on === 'dark') {
    return (
      <span
        className={cn(
          'font-display text-[34px] font-bold leading-none tracking-tight text-primary-foreground',
          className,
        )}
      >
        {t('brand.name')}
      </span>
    )
  }

  return <img src={logoUrl} alt={t('brand.name')} className={cn('h-14 w-fit', className)} />
}

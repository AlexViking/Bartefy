import logoUrl from '@/assets/bartefy-logo-lockup.webp'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The brand lockup.
 *
 *  The asset has a real alpha channel, but its wordmark is drawn in Bartefy
 *  green — so on a green surface the type disappears and only the illustrations
 *  around it survive. Transparency was never the problem there; contrast is.
 *
 *  So `on="dark"` still sets the brand as type, and the auth screens moved the
 *  lockup to the parchment side rather than fighting it. Replace the dark
 *  branch with a light-on-dark artwork if one is ever drawn.
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

  if (on === 'dark') {
    return (
      <span
        className={cn(
          'select-none font-display text-[34px] font-bold leading-none tracking-tight text-primary-foreground',
          className,
        )}
      >
        {t('brand.name')}
      </span>
    )
  }

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
      //
      // The dark-theme filter lifts the artwork off a dark ground. The type in
      // the asset is Bartefy green, which sits at roughly 2:1 against #121210
      // and reads as a smudge; brightening and slightly desaturating restores
      // it without needing a second asset drawn light-on-dark. Replace this
      // with that asset if one is ever made.
      className={cn(
        'h-auto w-[190px] select-none',
        '[html[data-theme=dark]_&]:brightness-[1.55] [html[data-theme=dark]_&]:saturate-[0.85]',
        className,
      )}
    />
  )
}

import { Icon } from '@/components/ui/icon'
import { useT } from '@/i18n/T'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/** One tap, two states. There is a third preference -- "system" -- but it does
 *  not get a third position in the control: a three-way cycle makes people tap
 *  twice to reach the theme they can already see they want. "system" is where
 *  everyone starts and is reachable from Settings; this only ever pins.
 *
 *  The icon shows the theme you would switch TO, not the one you are in, so it
 *  reads as an action rather than a status light.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const { t } = useT()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(next === 'dark' ? 'theme.switchToDark' : 'theme.switchToLight')}
      className={cn(
        'flex size-11 items-center justify-center rounded-pill text-muted-foreground',
        'transition-colors duration-fast ease-brand hover:bg-foreground/[0.06] hover:text-primary',
        className,
      )}
    >
      <Icon name={next === 'dark' ? 'Moon' : 'Sun'} size={20} />
    </button>
  )
}

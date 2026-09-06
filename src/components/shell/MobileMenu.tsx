import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T, useT } from '@/i18n/T'
import { signOut } from '@/lib/api'
import { resetLocal } from '@/lib/resetLocal'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { DESTINATIONS } from '@/navigation/destinations'

/** The phone's menu, and everything that is not a destination.
 *
 *  The topbar was carrying a language picker, a theme toggle and an avatar
 *  next to a search box on a 390px screen -- four controls competing for the
 *  width of a thumb, none of them things people touch more than once. They
 *  belong here, where there is room to label them and no cost to being one tap
 *  further away.
 *
 *  Sign out is here too. It was buried in Settings, which meant leaving took
 *  three taps through a screen full of things you were not looking for.
 */
export function MobileMenu({
  open,
  onOpenChange,
  isStaff,
  badges,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isStaff: boolean
  badges: { offers: number; unread: number }
  /** Shown at the top so the menu says whose account this is. */
  name: string
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

  const rows = DESTINATIONS.filter((d) => !d.staffOnly || isStaff)

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  const out = async () => {
    onOpenChange(false)
    await resetLocal({ signOut })
    navigate('/')
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="nav.menu">
      {/* Whose account. Without it the menu is a list of verbs belonging to
          nobody, and on a shared phone that matters. */}
      <button
        type="button"
        onClick={() => go('/profile')}
        className="mb-3 flex w-full items-center gap-3 rounded-card border-[1.5px] border-border/[0.14] bg-card p-3 text-left transition-colors hover:border-primary/40"
      >
        <UserAvatar name={name} size="md" />
        {/* An email address is user data: no translation key on this line. */}
        <span className="min-w-0 flex-1 truncate font-body text-body text-foreground">
          {name}
        </span>
        <Icon name="ChevronRight" size={16} className="shrink-0 text-muted-foreground" />
      </button>

      <nav className="flex flex-col gap-1">
        {rows.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/')
          const count =
            item.badge === 'offers' ? badges.offers : item.badge === 'unread' ? badges.unread : 0
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.path)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-hit w-full items-center gap-3 rounded-card px-3 py-3 text-left',
                'transition-colors duration-fast ease-brand',
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary',
              )}
            >
              <Icon name={item.icon} size={20} className="shrink-0" />
              <span data-i18n={item.label} className="flex-1 font-display text-[15px] font-semibold">
                {t(item.label)}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    'grid min-w-5 place-items-center rounded-pill px-1.5 py-0.5 font-body text-[10px] font-bold',
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-accent text-accent-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Preferences, not destinations -- so they are rows that change
          something in place rather than rows that take you somewhere. */}
      <div className="mt-3 flex flex-col gap-1 border-t border-border/[0.14] pt-3">
        <button
          type="button"
          onClick={toggle}
          className="flex min-h-hit w-full items-center gap-3 rounded-card px-3 py-3 text-left text-foreground transition-colors hover:bg-secondary"
        >
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} className="shrink-0" />
          <span
            data-i18n={theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark'}
            className="flex-1 font-display text-[15px] font-semibold"
          >
            {t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}
          </span>
        </button>

        <div className="flex min-h-hit items-center gap-3 rounded-card px-3 py-2">
          <Icon name="Info" size={20} className="shrink-0 text-foreground" />
          <T
            as="span"
            k="theme.language"
            className="flex-1 font-display text-[15px] font-semibold text-foreground"
          />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="mt-3 border-t border-border/[0.14] pt-3">
        <button
          type="button"
          onClick={out}
          className="flex min-h-hit w-full items-center gap-3 rounded-card px-3 py-3 text-left text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
        >
          <Icon name="ArrowLeft" size={20} className="shrink-0" />
          <span data-i18n="settings.signOut" className="flex-1 font-display text-[15px] font-semibold">
            {t('settings.signOut')}
          </span>
        </button>

        {/* The build, so a bug report can say which one. Small and quiet:
            it is for the one conversation a month where it matters. */}
        <p className="px-3 pt-2 text-center font-body text-xs text-muted-foreground">
          {`v${__APP_VERSION__} · ${__APP_COMMIT__}`}
        </p>
      </div>
    </ResponsiveSheet>
  )
}

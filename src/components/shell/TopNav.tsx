import { useLocation, useNavigate } from 'react-router'

import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useAuthStore } from '@/store/auth'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Desktop navigation. The same four destinations in the same order as the
 *  mobile tab bar, so muscle memory survives moving between devices.
 */
export function TopNav({
  city = 'Berlin',
  radiusKm = 10,
  unreadSwaps = 0,
}: {
  city?: string
  radiusKm?: number
  /** Mirrors TabBar: a dot on Swaps when messages are waiting. */
  unreadSwaps?: number
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useT()
  const session = useAuthStore((s) => s.session)
  const email = session?.user?.email ?? ''

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/[0.14] bg-popover px-7 py-2">
      <div className="flex items-center gap-[30px]">
        <button type="button" onClick={() => navigate('/hunt')} aria-label={t('brand.name')}>
          <img src={logoUrl} alt={t('brand.name')} className="h-[52px]" />
        </button>
        <nav className="flex items-center gap-[30px]">
          {DESTINATIONS.map((d) => {
            const active = pathname.startsWith(d.path)
            const labelKey = `nav.${d.id}`
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(d.path)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative border-b-[2.5px] pb-[3px] font-display text-base font-semibold',
                  'transition-colors duration-fast ease-brand',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:text-primary',
                )}
              >
                <span data-i18n={labelKey}>{t(labelKey)}</span>
                {d.id === 'swaps' && unreadSwaps > 0 && (
                  <span
                    className="absolute -right-2.5 top-0 size-2 rounded-pill bg-accent"
                    aria-label={t('swaps.unread', { count: unreadSwaps })}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="flex min-h-hit items-center gap-1.5 rounded-pill border-[1.5px] border-border/[0.14] bg-card px-3.5 font-body text-sm text-foreground"
        >
          <Icon name="MapPin" size={15} className="text-primary" />
          {city} {'·'} {t('common.km', { count: radiusKm })}
          <Icon name="ChevronDown" size={13} className="text-muted-foreground" />
        </button>
        <LanguageSwitcher />
        <Button onClick={() => navigate(ADD_DESTINATION.path)} data-i18n="nav.add">
          {t('nav.add')}
        </Button>
        {/* Settings used to live only as a chip inside Profile, which people
            did not find — a gear in the bar is where anyone looks for it. The
            mobile tab bar has no room for a fifth destination, so Profile
            keeps its chip as the phone route in. */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label={t('settings.title')}
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          className={cn(
            'flex size-11 items-center justify-center rounded-pill transition-colors duration-fast ease-brand',
            pathname.startsWith('/settings')
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-primary',
          )}
        >
          <Icon name="Settings" size={20} />
        </button>
        <UserAvatar
          name={email || 'Swapper'}
          size="md"
          className="cursor-pointer"
          onClick={() => navigate('/profile')}
        />
      </div>
    </header>
  )
}

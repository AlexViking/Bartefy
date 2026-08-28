import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Mobile navigation. Four destinations with the brass Add in the middle,
 *  every target at least 44px, thumb-reachable at the bottom of the screen.
 */
export function TabBar({ unreadSwaps = 0 }: { unreadSwaps?: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useT()
  const [first, second] = [DESTINATIONS.slice(0, 2), DESTINATIONS.slice(2)]

  const tab = (d: (typeof DESTINATIONS)[number]) => {
    const active = pathname.startsWith(d.path)
    const labelKey = `nav.${d.id}`
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => navigate(d.path)}
        aria-label={t(labelKey)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex h-11 min-w-11 flex-col items-center justify-center gap-px rounded-pill px-2.5',
          'transition-colors duration-fast ease-brand',
          active ? 'bg-primary-foreground/[0.16]' : 'bg-transparent',
        )}
      >
        <Icon
          name={d.icon}
          size={22}
          className={active ? 'text-primary-foreground' : 'text-primary-foreground/60'}
        />
        <span
          data-i18n={labelKey}
          className={cn(
            'font-display text-[10px] font-semibold leading-none',
            active ? 'text-primary-foreground' : 'text-primary-foreground/60',
          )}
        >
          {t(labelKey)}
        </span>
        {d.id === 'swaps' && unreadSwaps > 0 && (
          <span
            className="absolute right-1 top-0.5 size-2 rounded-pill bg-accent"
            aria-label={t('swaps.unread', { count: unreadSwaps })}
          />
        )}
      </button>
    )
  }

  return (
    <div className="px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5">
      <nav className="flex items-center justify-around rounded-pill bg-primary px-2 py-1.5 shadow-float">
        {first.map(tab)}
        <button
          type="button"
          onClick={() => navigate(ADD_DESTINATION.path)}
          aria-label={t('nav.add')}
          className="flex size-11 items-center justify-center rounded-pill bg-accent text-accent-foreground shadow-card"
        >
          <Icon name="Plus" size={22} />
        </button>
        {second.map(tab)}
      </nav>
    </div>
  )
}

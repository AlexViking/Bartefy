import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { DESTINATIONS } from '@/navigation/destinations'

/** What the phone's burger opens.
 *
 *  The tab bar holds four destinations plus Add, which is all a thumb can
 *  reach comfortably -- so Settings and Moderation have nowhere to live on a
 *  phone. This is where they live. It lists everything, not only the overflow:
 *  a menu that omits the items already in the tab bar makes people hunt for
 *  the one they can see.
 */
export function MobileMenu({
  open,
  onOpenChange,
  isStaff,
  badges,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isStaff: boolean
  badges: { offers: number; unread: number }
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const rows = DESTINATIONS.filter((d) => !d.staffOnly || isStaff)

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="nav.menu">
      <nav className="flex flex-col gap-1 py-1">
        {rows.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/')
          const count =
            item.badge === 'offers' ? badges.offers : item.badge === 'unread' ? badges.unread : 0
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onOpenChange(false)
                navigate(item.path)
              }}
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
    </ResponsiveSheet>
  )
}

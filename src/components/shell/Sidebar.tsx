import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router'

import { Wordmark } from '@/components/Wordmark'
import { Icon } from '@/components/ui/icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/i18n/T'
import { spring, tween } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DESTINATIONS } from '@/navigation/destinations'

/** The desktop navigation: a collapsible left rail, replacing the horizontal
 *  top nav.
 *
 *  The active pill is ONE element that slides between rows rather than fading
 *  in and out of each -- that continuity is most of what makes the rail feel
 *  alive rather than switched. framer-motion's layoutId does the work; two
 *  separate elements cross-fading looks like a bug by comparison.
 *
 *  Collapsed, labels become tooltips rather than disappearing: an icon rail
 *  nobody can read is a puzzle, not a navigation.
 */
export function Sidebar({
  collapsed,
  onToggleCollapse,
  isStaff,
  badges,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  isStaff: boolean
  badges: { offers: number; unread: number }
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const rows = DESTINATIONS.filter((d) => !d.staffOnly || isStaff)

  return (
    <motion.nav
      animate={{ width: collapsed ? 68 : 224 }}
      transition={spring.gentle}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col gap-1 border-r border-border/[0.14] bg-card/40 p-3 md:flex"
    >
      <div className="mb-2 flex h-11 items-center gap-2 px-1">
        {/* The lockup, not type. It disappears when collapsed rather than
            shrinking to an illegible smudge -- the rail is 68px there and the
            mark is nearly 2:1. */}
        {!collapsed && <Wordmark className="w-[112px]" />}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
          className="ml-auto grid size-8 place-items-center rounded-card-sm text-muted-foreground transition-colors duration-fast hover:bg-secondary hover:text-foreground"
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={spring.gentle}
            className="flex"
          >
            <Icon name="ChevronLeft" size={16} />
          </motion.span>
        </button>
      </div>

      {rows.map((item) => {
        const active = pathname === item.path || pathname.startsWith(item.path + '/')
        const count = item.badge === 'offers' ? badges.offers : item.badge === 'unread' ? badges.unread : 0

        const row = (
          <button
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 w-full items-center gap-3 rounded-card px-3 text-left outline-none',
              'transition-colors duration-fast ease-brand',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                transition={spring.pop}
                className="absolute inset-0 rounded-card bg-primary"
              />
            )}
            <span className="relative z-10 flex">
              <Icon name={item.icon} size={20} strokeWidth={active ? 2.4 : 2} />
            </span>
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -6 : 0 }}
              transition={tween.fast}
              data-i18n={item.label}
              className="relative z-10 truncate font-display text-[15px] font-semibold"
            >
              {t(item.label)}
            </motion.span>
            {count > 0 && (
              <motion.span
                layout
                transition={spring.pop}
                className={cn(
                  'relative z-10 ml-auto grid min-w-5 place-items-center rounded-pill px-1.5 py-0.5 font-body text-[10px] font-bold',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-accent text-accent-foreground',
                  collapsed && 'absolute right-1 top-1 ml-0',
                )}
              >
                {count}
              </motion.span>
            )}
          </button>
        )

        return collapsed ? (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="right">{t(item.label)}</TooltipContent>
          </Tooltip>
        ) : (
          <div key={item.id}>{row}</div>
        )
      })}
    </motion.nav>
  )
}

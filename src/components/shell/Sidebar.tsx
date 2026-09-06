import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router'

import { Wordmark } from '@/components/Wordmark'
import { Icon } from '@/components/ui/icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/i18n/T'
import { spring, tween } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ADD_DESTINATION, DESTINATIONS } from '@/navigation/destinations'

/** The desktop navigation: a collapsible left rail, replacing the horizontal
 *  top nav.
 *
 *  AppShell is rendered inside each screen rather than above the router, so a
 *  navigation unmounts this component and mounts a new one. framer-motion
 *  treats a fresh mount as an entrance and replays whatever is in `animate`,
 *  so nothing here may animate a layout property: the rail's width is a CSS
 *  transition (see below), and every framer animation left is on transform or
 *  opacity and carries `initial={false}`.
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
  /** The tab bar's three, then everything else under a rule. Desktop has the
   *  vertical room to show Profile, Settings and Moderation outright rather
   *  than hiding them behind the avatar as the phone does. */
  const primary = rows.filter((d) => d.onTabBar)
  const secondary = rows.filter((d) => !d.onTabBar)

  return (
    /* Width is a CSS transition on a plain <nav>, not a framer spring.
     *
     * Two reasons, and the second is the bug you can see:
     *
     * 1. `width` is a layout property. A spring on it re-lays out the entire
     *    page on every frame of the animation -- the same rule that already
     *    banned animating fontSize and height in this codebase.
     *
     * 2. AppShell renders inside each screen rather than above the router, so
     *    every navigation unmounts this component and mounts a new one. A
     *    framer `animate` on a fresh mount is an entrance: it re-runs from
     *    whatever it considers the start, which made the rail visibly contract
     *    and spring back out on each click. `initial={false}` suppresses that
     *    for a mount React reuses -- but this component is genuinely new each
     *    time, so there is nothing for framer to diff against and the guard
     *    does not help.
     *
     * A CSS transition has no concept of an entrance. The element renders at
     * whatever width its class says and only animates when that class changes,
     * which is exactly the behaviour wanted. */
    <nav
      style={{ width: collapsed ? 68 : 224 }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col gap-1 border-r border-border/[0.14] bg-card/40 p-3 [transition:width_240ms_var(--ease-out)] md:flex"
    >
      <div className={cn('mb-2 flex h-11 items-center gap-2', collapsed ? 'justify-center' : 'px-1')}>
        {/* The lockup, not type. It disappears when collapsed rather than
            shrinking to an illegible smudge -- the rail is 68px there and the
            mark is nearly 2:1. */}
        {!collapsed && <Wordmark className="w-[112px]" />}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
          className={cn(
            'grid size-8 place-items-center rounded-card-sm text-muted-foreground transition-colors duration-fast hover:bg-secondary hover:text-foreground',
            // ml-auto only makes sense with the wordmark beside it; alone in a
            // 68px rail it pinned the chevron to the right edge.
            !collapsed && 'ml-auto',
          )}
        >
          <motion.span
            initial={false}
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={spring.gentle}
            className="flex"
          >
            <Icon name="ChevronLeft" size={16} />
          </motion.span>
        </button>
      </div>

      {[primary, secondary].map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {/* A hairline, not a heading: the split is Discover/Matches/My Items
              against the rest, and naming that grouping would say less than
              the gap already does. */}
          {gi === 1 && group.length > 0 && (
            <span aria-hidden="true" className="my-1.5 h-px bg-border/[0.14]" />
          )}
          {group.map((item) => {
        const active = pathname === item.path || pathname.startsWith(item.path + '/')
        const count = item.badge === 'offers' ? badges.offers : item.badge === 'unread' ? badges.unread : 0

        const row = (
          <button
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 items-center rounded-card-lg outline-none',
              'transition-colors duration-fast ease-brand',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring',
              // Collapsed the row is a 44px square centred in the rail, not a
              // full-width row with left padding: px-3 put the glyph at x=12
              // of a 44px track, so both the icon and the pill behind it sat
              // left of centre and the whole strip looked nudged.
              collapsed
                ? 'w-11 shrink-0 justify-center self-center'
                : 'w-full gap-3 px-3 text-left',
            )}
          >
            {/* The pill is plain: it appears and disappears with the row it
                belongs to. It used to be one shared element sliding between
                rows on a layoutId, which animated the *background* -- the
                whole green block travelled up and down the rail on every
                click. The motion belongs on the icon, which is the thing
                being selected. */}
            {active && (
              <span aria-hidden="true" className="absolute inset-0 rounded-card-lg bg-primary" />
            )}
            <motion.span
              className="relative z-10 flex"
              initial={false}
              animate={{ scale: active ? 1.12 : 1 }}
              whileTap={{ scale: 0.92 }}
              transition={spring.pop}
            >
              <Icon name={item.icon} size={20} strokeWidth={active ? 2.4 : 2} />
              {/* Collapsed, the count rides the icon itself. Anchored to the
                  row it sat against a 44px box the 20px glyph is centred in,
                  so it floated clear of the thing it counts. */}
              {collapsed && count > 0 && (
                <span
                  className={cn(
                    'absolute -right-2 -top-2 grid size-4 place-items-center rounded-pill',
                    'font-body text-[9px] font-bold ring-2 ring-card',
                    active
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-accent text-accent-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </motion.span>
            {/* Unmounted when collapsed, not faded: a zero-opacity label still
                claims width, which would stretch the 44px square back into a
                lopsided row. The tooltip carries the name there instead. */}
            {!collapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: 1 }}
                transition={tween.fast}
                data-i18n={item.label}
                className="relative z-10 truncate font-display text-[15px] font-semibold"
              >
                {t(item.label)}
              </motion.span>
            )}
            {/* Expanded, the count sits at the end of the row. The collapsed
                one lives on the icon above. */}
            {!collapsed && count > 0 && (
              <span
                className={cn(
                  'relative z-10 ml-auto grid min-w-5 place-items-center rounded-pill px-1.5 py-0.5 font-body text-[10px] font-bold',
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

        return collapsed ? (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="right">{t(item.label)}</TooltipContent>
          </Tooltip>
        ) : (
          <div key={item.id}>{row}</div>
        )
          })}
        </div>
      ))}

      {/* Listing a find, pinned to the foot as the desktop wireframe draws it.
          Until now ADD_DESTINATION was consumed only by TabBar, which is not
          mounted at this width -- so the app's primary creative action had no
          entry point on desktop at all. */}
      {(() => {
        const addBtn = (
          <button
            type="button"
            onClick={() => navigate(ADD_DESTINATION.path)}
            aria-label={t('nav.add')}
            className={cn(
              'mt-auto flex h-11 shrink-0 items-center rounded-pill bg-accent',
              'font-display text-[15px] font-semibold text-accent-foreground shadow-card outline-none',
              'transition-colors duration-fast ease-brand hover:bg-accent/90',
              'focus-visible:ring-2 focus-visible:ring-ring',
              // Collapsed the rail is 68px with 12px of padding each side, so
              // a full-width button was wider than the space and the glyph got
              // clipped at the edge. Square and self-centred instead.
              collapsed ? 'size-11 justify-center self-center' : 'gap-3 px-3',
            )}
          >
            <Icon name="Plus" size={20} strokeWidth={2.4} />
            {/* Unmounted rather than faded to zero: an invisible label still
                claims width, which is what pushed the glyph out of a 44px
                button. */}
            {!collapsed && (
              <span data-i18n="nav.add" className="truncate">
                {t('nav.add')}
              </span>
            )}
          </button>
        )
        return collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{addBtn}</TooltipTrigger>
            <TooltipContent side="right">{t('nav.add')}</TooltipContent>
          </Tooltip>
        ) : (
          addBtn
        )
      })()}
    </nav>
  )
}

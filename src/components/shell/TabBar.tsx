import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { TAB_DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The phone's navigation: Deck, Matches, the brass Add, Profile.
 *
 *  Four things, as the wireframe draws it. Everything else -- settings,
 *  moderation, language, theme, signing out -- lives in the burger, because a
 *  thumb reaches about four targets across the bottom of a phone and a fifth
 *  makes all five worse.
 */
export function TabBar({
  unreadSwaps = 0,
  offers = 0,
}: {
  unreadSwaps?: number
  offers?: number
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useT()

  /** All three destinations, then Add.
   *
   *  Add cannot be centred with three tabs: two on one side and one on the
   *  other never balances, and the last attempt left it 48px off. Rather than
   *  fake a centre with an empty column -- which shoved every tab left --
   *  the button sits at the end, where its size and colour already mark it as
   *  a different kind of thing from a destination. */
  const tabs = TAB_DESTINATIONS

  const tab = (d: (typeof TAB_DESTINATIONS)[number]) => {
    const active = pathname.startsWith(d.path)
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => navigate(d.path)}
        aria-label={t(d.label)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // flex-1 basis-0 so every tab claims the same width whatever its
          // label says. Sized by content, "Discover" pushes the others aside
          // and the whole row leans.
          'relative flex h-11 flex-1 basis-0 flex-col items-center justify-center gap-px rounded-pill px-0.5',
          'transition-colors duration-fast ease-brand',
          active ? 'bg-primary-foreground/[0.16]' : 'bg-transparent',
        )}
      >
        <Icon
          name={d.icon}
          size={21}
          className={active ? 'text-primary-foreground' : 'text-primary-foreground/60'}
        />
        <span
          data-i18n={d.label}
          className={cn(
            // Truncate rather than clip: a label out of room should end in an
            // ellipsis, not be sliced mid-letter.
            'max-w-full truncate font-display text-[10px] font-semibold leading-none',
            active ? 'text-primary-foreground' : 'text-primary-foreground/60',
          )}
        >
          {t(d.label)}
        </span>
        {d.id === 'matches' && unreadSwaps + offers > 0 && (
          <span
            className="absolute right-1 top-0.5 size-2 rounded-pill bg-accent"
            aria-label={t('swaps.unread', { count: unreadSwaps + offers })}
          />
        )}
      </button>
    )
  }

  return (
    <div className="px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5">
      {/* Flex with equal-basis tabs, not a grid with a spacer column.
          The grid needed an empty trailing column to centre Add, and that
          column shoved every tab left -- Discover and Matches bunched at one
          end with Profile stranded at the other. Three equal tabs followed by
          the button sit evenly with no spacer at all. */}
      <nav className="flex items-center gap-1 rounded-pill bg-primary px-2 py-1.5 shadow-float">
        {tabs.map(tab)}
        <button
          type="button"
          onClick={() => navigate(ADD_DESTINATION.path)}
          aria-label={t('nav.add')}
          className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-foreground shadow-card"
        >
          <Icon name="Plus" size={24} />
        </button>
      </nav>
    </div>
  )
}

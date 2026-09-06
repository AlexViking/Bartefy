import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { TAB_DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The phone's navigation: Discover, Matches, the brass Add, My Items.
 *
 *  Four slots with Add third, which is how the wireframe draws it. The
 *  previous bar had three destinations with Add appended fourth and sitting
 *  off to one side -- not a styling problem but a counting one: an odd number
 *  of destinations has no middle to put a centre action in. Profile moved
 *  behind the avatar to make the count even, and Add now centres with no
 *  spacer column and no special case.
 *
 *  Everything that is not one of these four -- Profile, Settings, Moderation,
 *  language, theme, signing out -- is in the menu behind the burger.
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

  const tab = (d: (typeof TAB_DESTINATIONS)[number]) => {
    // Exact match, or a child path. startsWith alone lit Discover up on
    // every route beginning with "/d", and marked two tabs active at once
    // wherever one destination's path prefixed another's.
    const active = pathname === d.path || pathname.startsWith(d.path + '/')

    /** Offers are a decision waiting on you; unread messages are not. The bar
     *  has room for one mark per tab, so an offer wins: it is the one that
     *  goes stale. */
    const waitingOffers = d.badge === 'unread' ? offers : 0
    const waitingUnread = d.badge === 'unread' ? unreadSwaps : 0
    const marked = waitingOffers + waitingUnread > 0

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
        {marked && (
          <span
            className={cn(
              // Anchored to the icon, not the tab box. Pinned to the tab's
              // right edge it drifted into the gap beside the Add button and
              // read as belonging to neither -- a flex-1 tab is much wider
              // than the glyph it centres.
              'absolute left-1/2 top-0.5 ml-2 rounded-pill',
              // An offer is a ring around the dot -- readable at 8px without
              // needing a second colour the palette does not have.
              waitingOffers > 0
                ? 'size-2.5 bg-accent ring-2 ring-primary'
                : 'size-2 bg-primary-foreground/70',
            )}
            aria-label={
              waitingOffers > 0
                ? t('swaps.offersWaiting', { count: waitingOffers })
                : t('swaps.unread', { count: waitingUnread })
            }
          />
        )}
      </button>
    )
  }

  return (
    <div className="px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5">
      <nav className="flex items-center gap-1 rounded-pill bg-primary px-2 py-1.5 shadow-float">
        {/* The three destinations, then Add at the end. Add is not a
            destination -- it opens a flow and comes back -- and its size and
            colour already say so, so it reads as the row's action rather than
            a fourth place to be. */}
        {TAB_DESTINATIONS.map(tab)}
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

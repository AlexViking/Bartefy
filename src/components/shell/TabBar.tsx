import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { TAB_DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Mobile navigation. Four destinations with the brass Add in the middle,
 *  every target at least 44px, thumb-reachable at the bottom of the screen.
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
  // Two tabs, the Add button, then the rest -- so Add sits in the middle
  // column of five rather than off to one side. With three destinations that
  // is Discover | Matches | + | Profile | (spacer), and the spacer keeps the
  // button on the true centre line instead of leaning right.
  const [first, second] = [TAB_DESTINATIONS.slice(0, 2), TAB_DESTINATIONS.slice(2)]

  const tab = (d: (typeof TAB_DESTINATIONS)[number]) => {
    const active = pathname.startsWith(d.path)
    const labelKey = d.label
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => navigate(d.path)}
        aria-label={t(labelKey)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // w-full inside its grid column rather than min-w + padding: the
          // padding was squeezing the longest label ("Discover") until it
          // clipped, and the fix is to let the column decide the width.
          'relative flex h-11 w-full flex-col items-center justify-center gap-px rounded-pill px-1',
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
            // Truncate rather than clip: a label that runs out of room should
            // end in an ellipsis, not be cut mid-letter.
            'max-w-full truncate font-display text-[10px] font-semibold leading-none',
            active ? 'text-primary-foreground' : 'text-primary-foreground/60',
          )}
        >
          {t(labelKey)}
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
      {/* A five-column grid, not justify-around.
       *
       *  justify-around distributes the free space around each child, so a
       *  fixed 44px Add button between four flexible tabs is never actually
       *  centred -- it sits wherever the surrounding widths leave it, and the
       *  two halves of the bar look mismatched. Equal columns put it exactly
       *  in the middle whatever the labels say, in any language. */}
      <nav className="grid grid-cols-5 items-center rounded-pill bg-primary px-1.5 py-1.5 shadow-float">
        {first.map(tab)}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate(ADD_DESTINATION.path)}
            aria-label={t('nav.add')}
            className="flex size-11 items-center justify-center rounded-pill bg-accent text-accent-foreground shadow-card"
          >
            <Icon name="Plus" size={22} />
          </button>
        </div>
        {second.map(tab)}
        {/* Balances the row: three destinations plus Add is four cells in a
            five-column grid, and without this the button drifts right of
            centre. Empty rather than a fifth destination, because the
            wireframe's bar is Deck / Matches / + / Profile and nothing else. */}
        {second.length < 2 && <span aria-hidden="true" />}
      </nav>
    </div>
  )
}

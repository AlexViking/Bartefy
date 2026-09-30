import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { ADD_PATH, TAB_DESTINATIONS, isActive } from '@/navigation/destinations'
import { cap, type ShellData } from './useShellData'

const TAB = 'group flex h-full flex-col items-center justify-center gap-1 outline-none'

/** V6 phone tab bar: Discover · Swaps · ＋Add · Finds · You.
 *
 *  Add is the raised Coral circle in the middle -- the one action that makes
 *  something rather than going somewhere. "You" is the avatar and opens the
 *  You sheet (account, Points & Tiers, Admirers, Profile, Settings, language,
 *  theme, sign out). Every other phone page keeps this bar; Discover's own
 *  phone layout (no bar, ⋮ menu) arrives with the deck in step 3.
 */
export function TabBar({ data, onYou, youOpen }: { data: ShellData; onYou: () => void; youOpen: boolean }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [discover, swaps, finds] = TAB_DESTINATIONS
  const swapsN = data.offers + data.unread

  const tab = (d: typeof discover, badge?: number) => {
    const on = isActive(d, pathname)
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => navigate(d.path)}
        aria-current={on ? 'page' : undefined}
        className={TAB}
      >
        <span
          className={cn(
            'relative grid h-8 w-14 place-items-center rounded-pill transition-colors duration-fast ease-brand',
            on ? 'bg-selected text-primary' : 'text-muted-foreground group-active:bg-secondary',
          )}
        >
          <Icon name={d.icon} size={24} />
          {!!badge && (
            <span className="absolute -top-1 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-coral px-1 text-[10px] font-bold leading-none text-ink ring-2 ring-card">
              {cap(badge)}
            </span>
          )}
        </span>
        <span
          data-i18n={d.tab}
          className={cn('text-[11px] leading-[14px]', on ? 'font-bold text-primary' : 'font-semibold text-muted-foreground')}
        >
          {t(d.tab!)}
        </span>
      </button>
    )
  }

  return (
    <nav
      aria-label={t('shell.navLabel')}
      className="z-40 shrink-0 bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(0,0,0,0.07)]"
    >
      <div className="grid h-16 grid-cols-5">
        {tab(discover)}
        {tab(swaps, swapsN)}
        <button type="button" onClick={() => navigate(ADD_PATH)} aria-label={t('shell.addFind')} className={TAB}>
          <span className="-mt-6 grid size-14 place-items-center rounded-pill bg-coral text-ink shadow-[0_6px_16px_rgba(238,139,106,0.4)] ring-4 ring-card">
            <Icon name="Plus" size={28} />
          </span>
          <span data-i18n="shell.tab_add" className="text-[11px] font-semibold leading-[14px] text-muted-foreground">
            {t('shell.tab_add')}
          </span>
        </button>
        {tab(finds)}
        <button type="button" onClick={onYou} aria-expanded={youOpen} className={TAB}>
          <span
            className={cn(
              'relative grid h-8 w-14 place-items-center rounded-pill transition-colors duration-fast ease-brand',
              youOpen && 'bg-selected',
            )}
          >
            <UserAvatar name={data.name || data.email} src={data.avatar} size="xs" tone="accent" />
            {data.admirers > 0 && (
              <span className="absolute -top-1 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-coral px-1 text-[10px] font-bold leading-none text-ink ring-2 ring-card">
                {cap(data.admirers)}
              </span>
            )}
          </span>
          <span
            data-i18n="shell.tab_you"
            className={cn('text-[11px] leading-[14px]', youOpen ? 'font-bold text-primary' : 'font-semibold text-muted-foreground')}
          >
            {t('shell.tab_you')}
          </span>
        </button>
      </div>
    </nav>
  )
}

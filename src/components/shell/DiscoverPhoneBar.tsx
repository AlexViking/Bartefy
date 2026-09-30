import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ExpiringCard, TableCard, TierCard, useNeedsYou } from '@/components/deck/NeedsYou'
import { T, useT } from '@/i18n/T'
import { TIER_PRICES } from '@/lib/points'
import { cn } from '@/lib/utils'
import { ADD_PATH, DESTINATIONS, isActive } from '@/navigation/destinations'
import { BrandTile } from './BrandMark'
import { BellPanel } from './ShellPanels'
import { ShellSheet } from './ShellSheet'
import { cap, type ShellData } from './useShellData'

/** Discover on a phone -- layout C, decided 2026-09-29 ("C for sure").
 *
 *  The five actions own the bottom, the card fills the rest, the page never
 *  scrolls, and the tab bar steps aside. The top bar, from the RIGHT:
 *  ⋮ menu · Swaps (messages) · Notifications · You -- the B on the left.
 *  The ⋮ menu holds the navigation first, with Points, then what the desktop
 *  rail shows (offers expiring, My table, the tier), then Settings.
 *
 *  ONLY Discover. Every other phone page keeps the tab bar.
 */
export function DiscoverPhoneBar({ data, onYou }: { data: ShellData; onYou: () => void }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [bell, setBell] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const needs = useNeedsYou()
  const waiting = data.offers + data.unread
  const urgent = needs.expiring.length > 0

  // The Needs you cards navigate on their own; leaving the page closes both.
  React.useEffect(() => {
    setMenu(false)
    setBell(false)
  }, [pathname])

  const go = (to: string) => {
    setMenu(false)
    setBell(false)
    navigate(to)
  }

  const iconBtn = 'relative grid size-11 shrink-0 place-items-center rounded-pill text-foreground active:bg-secondary'
  const count = (n: number, tone = 'bg-coral text-ink') => (
    <span className={cn('grid h-5 min-w-[22px] place-items-center rounded-pill px-1.5 text-[11px] font-bold leading-none', tone)}>{cap(n)}</span>
  )

  const badgeFor = (id: string) =>
    id === 'swaps' && waiting > 0
      ? count(waiting)
      : id === 'finds' && data.liveFinds > 0
        ? count(data.liveFinds, 'bg-mint text-forest')
        : id === 'admirers' && data.admirers > 0
          ? count(data.admirers, 'bg-sun text-ink')
          : id === 'points'
            ? <span className="font-display text-[14px] font-bold tabular-nums text-foreground">{data.points} <span className="text-[11px] text-muted-foreground">{t('shell.pts')}</span></span>
            : null

  return (
    <header className="relative z-40 flex h-14 w-full shrink-0 items-center gap-1 bg-card/95 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => navigate('/discover')}
        aria-label={t('shell.brandHome')}
        className="group rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BrandTile size={40} />
      </button>
      <span className="flex-1" />

      <button type="button" onClick={onYou} aria-label={t('shell.tab_you')} className={iconBtn}>
        <UserAvatar name={data.name || data.email} src={data.avatar} size="sm" tone="accent" />
      </button>
      <button
        type="button"
        onClick={() => setBell(true)}
        aria-label={waiting ? t('shell.bellTip', { n: waiting }) : t('notif.title')}
        className={iconBtn}
      >
        <Icon name="Bell" size={24} />
        {waiting > 0 && <span className="absolute right-2.5 top-2 size-2.5 rounded-pill bg-coral ring-2 ring-card" />}
      </button>
      <button type="button" onClick={() => navigate('/matches')} aria-label={t('shell.nav_swaps')} className={iconBtn}>
        <Icon name="MessageSquareText" size={24} />
        {data.unread > 0 && (
          <span className="absolute -right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-coral px-1 text-[10px] font-bold leading-none text-ink ring-2 ring-card">
            {cap(data.unread)}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label={urgent ? t('dmenu.labelUrgent', { n: needs.expiring.length }) : t('dmenu.title')}
        className={cn(iconBtn, '-mr-1')}
      >
        <Icon name="EllipsisVertical" size={26} />
        {urgent && <span className="absolute right-2.5 top-2 size-2.5 rounded-pill bg-coral ring-2 ring-card" />}
      </button>

      <ShellSheet open={bell} onOpenChange={setBell} title="notif.title">
        <BellPanel onGo={go} />
      </ShellSheet>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent
          side="right"
          className="w-[86%] max-w-[340px] gap-0 overflow-y-auto border-0 bg-card p-0 pb-[max(12px,env(safe-area-inset-bottom))] [&>button]:hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetTitle className="sr-only">{t('dmenu.title')}</SheetTitle>
          <div>
            <div className="flex h-14 items-center justify-between pl-5 pr-2">
              <T as="p" k="dmenu.title" className="font-display text-headline-sm text-foreground" />
              <button
                type="button"
                onClick={() => setMenu(false)}
                aria-label={t('common.close')}
                className="grid size-11 place-items-center rounded-pill hover:bg-secondary"
              >
                <Icon name="X" size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 px-3">
              <button
                type="button"
                onClick={() => go(ADD_PATH)}
                className="mb-2 flex h-12 items-center justify-center gap-2 rounded-card bg-coral font-body text-[15px] font-bold text-ink"
              >
                <Icon name="CirclePlus" size={22} />
                <T as="span" k="shell.addFind" />
              </button>
              {DESTINATIONS.map((d) => {
                const on = isActive(d, pathname)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => go(d.path)}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'flex h-12 items-center gap-3 rounded-card px-3 text-left text-[15px]',
                      on ? 'bg-selected font-bold text-primary' : 'text-foreground active:bg-background',
                    )}
                  >
                    <Icon name={d.icon} size={22} />
                    <T as="span" k={d.label} className="flex-1" />
                    {badgeFor(d.id)}
                  </button>
                )
              })}
            </div>

            {data.tier === 'hunter' && (
              <button
                type="button"
                onClick={() => go('/points')}
                className="mx-4 mt-2 block w-[calc(100%-2rem)] rounded-card bg-background px-4 py-3 text-left"
              >
                <span className="flex items-center justify-between">
                  <span className="font-body text-label-lg text-foreground">
                    {data.points >= TIER_PRICES.collector
                      ? t('shell.pointsEnough')
                      : t('dmenu.toCollector', { n: TIER_PRICES.collector - data.points })}
                  </span>
                  <Icon name="ArrowRight" size={18} className="text-primary" />
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-pill bg-secondary">
                  <span
                    className="block h-full rounded-pill bg-sun"
                    style={{ width: `${Math.min(100, Math.round((data.points / TIER_PRICES.collector) * 100))}%` }}
                  />
                </span>
              </button>
            )}

            <div className="mx-5 my-3 h-px bg-input" />
            <T as="p" k="dmenu.needsYou" className="px-5 pb-2 font-body text-label-sm uppercase text-muted-foreground" />
            <div className="flex flex-col gap-3 px-4">
              <ExpiringCard offers={needs.expiring} />
              <TableCard offersOn={needs.offersOn} />
              <TierCard activeSwaps={needs.activeSwaps} />
            </div>

            <div className="mx-5 my-3 h-px bg-input" />
            <button type="button" onClick={() => go('/settings')} className="mx-3 flex h-12 w-[calc(100%-1.5rem)] items-center gap-3 rounded-card px-3 text-left text-[15px] text-foreground active:bg-background">
              <Icon name="Settings" size={22} />
              <T as="span" k="nav.settings" className="flex-1" />
              <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

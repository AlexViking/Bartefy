import * as React from 'react'
import { useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/i18n/T'
import { visitValue } from '@/lib/points'
import { cn } from '@/lib/utils'
import { AccountMenu } from './AccountMenu'
import { BrandLockup, BrandTile } from './BrandMark'
import { BellPanel, PointsPanel, StreakPanel, streakWeekDay } from './ShellPanels'
import { ShellSheet } from './ShellSheet'
import type { ShellData } from './useShellData'

export type ShellPlatform = 'phone' | 'tablet' | 'desktop'

export const TOPBAR_CONTEXT_ID = 'shell-topbar-context'

type PanelId = 'streak' | 'points' | 'bell'

const CHIP =
  'inline-flex h-9 items-center gap-1.5 rounded-pill px-3 ring-1 ring-inset outline-none ' +
  'transition-[background-color,box-shadow] duration-200 ease-brand focus-visible:ring-2 focus-visible:ring-ring/50'
const chipTone = (open: boolean) =>
  open ? 'bg-card ring-input shadow-sm' : 'bg-background ring-transparent hover:bg-secondary hover:ring-input'

/** V6 top bar -- topbar R2, approved 2026-09-27.
 *
 *  Brand on the left, in the same column as the side nav; live status and the
 *  account on the right. Nothing that navigates lives here (that is the side
 *  nav's job) except the brand, which goes to Discover.
 *
 *    hover -> a one-line tooltip          (desktop, tablet)
 *    click -> a popover under the trigger (desktop, tablet)
 *          -> a bottom sheet              (phone: no hover, no room)
 *
 *  Sizes: desktop 80px tall with the 48px B tile, tablet 64px, phone 56px with
 *  a 40px tile. The phone has no account button -- "You" is in the tab bar.
 */
export function TopBar({
  data,
  platform,
  navWidth,
  withWord,
}: {
  data: ShellData
  platform: ShellPlatform
  /** Width of the side nav under the brand (256 / 72), so the B sits in the
   *  nav's column and anything after it starts on the content's left edge. */
  navWidth: number
  /** B | Bartefy beside the full side nav; the B alone otherwise. */
  withWord: boolean
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const phone = platform === 'phone'
  const [open, setOpen] = React.useState<PanelId | null>(null)

  const onGo = (to: string) => {
    setOpen(null)
    navigate(to)
  }

  const day = streakWeekDay(data.streakDays)
  const streakTip = data.claimedToday
    ? t('shell.streakTip', { day, pts: visitValue(data.streakDays) })
    : t('shell.streakTipWaiting', { day })
  const waiting = data.offers + data.unread

  const panels: Record<PanelId, { tip: string; width: string; title: string; body: React.ReactNode }> = {
    streak: { tip: streakTip, width: 'w-[360px]', title: 'shell.streakSheet', body: <StreakPanel data={data} onGo={onGo} /> },
    points: { tip: t('shell.pointsTip', { n: data.points }), width: 'w-[340px]', title: 'shell.nav_points', body: <PointsPanel data={data} onGo={onGo} /> },
    bell: {
      tip: waiting ? t('shell.bellTip', { n: waiting }) : t('notif.title'),
      width: 'w-[380px]',
      title: 'notif.title',
      body: <BellPanel onGo={onGo} />,
    },
  }

  const triggers: Record<PanelId, React.ReactNode> = {
    streak: (
      <button
        type="button"
        aria-label={streakTip}
        className={cn(CHIP, chipTone(open === 'streak'))}
        onClick={phone ? () => setOpen('streak') : undefined}
      >
        <Icon name="Flame" size={18} className="fill-current text-primary" />
        <span className="font-display text-ticker tabular-nums text-foreground">{data.streakDays}</span>
        {!phone && (
          <span className="ml-0.5 flex items-center gap-1" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <span
                key={d}
                className={cn(
                  'size-1.5 rounded-pill',
                  d < day && 'bg-sun',
                  d === day && (data.claimedToday ? 'bg-primary' : 'ring-[1.5px] ring-inset ring-primary'),
                  d > day && 'bg-input',
                )}
              />
            ))}
          </span>
        )}
      </button>
    ),
    points: (
      <button
        type="button"
        aria-label={t('shell.pointsTip', { n: data.points })}
        className={cn(CHIP, chipTone(open === 'points'))}
        onClick={phone ? () => setOpen('points') : undefined}
      >
        <Icon name="Coins" size={18} className={data.points < 50 ? 'text-muted-foreground' : 'text-foreground'} />
        <span className="font-display text-ticker tabular-nums text-foreground">{data.points}</span>
        <span className="font-body text-label-sm text-muted-foreground">{t('shell.pts')}</span>
      </button>
    ),
    bell: (
      <button
        type="button"
        aria-label={waiting ? t('shell.bellTip', { n: waiting }) : t('notif.title')}
        className={cn(
          'relative grid size-10 place-items-center rounded-pill outline-none transition-colors duration-200 ease-brand focus-visible:ring-2 focus-visible:ring-ring/50',
          open === 'bell' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
        onClick={phone ? () => setOpen('bell') : undefined}
      >
        <Icon name="Bell" size={22} />
        {waiting > 0 && (
          <span aria-hidden="true" className="absolute right-2 top-2 size-2.5 rounded-pill bg-coral ring-2 ring-card" />
        )}
      </button>
    ),
  }

  const ids: PanelId[] = ['streak', 'points', 'bell']

  return (
    <header
      className={cn(
        'relative z-40 flex w-full shrink-0 items-center justify-between bg-card/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl',
        phone ? 'h-14 gap-2 px-4' : platform === 'tablet' ? 'h-16 gap-3 pr-6' : 'h-20 gap-4 pr-8',
      )}
    >
      <div
        className="shrink-0"
        // The brand slot is as wide as the nav below it: 16px in beside the
        // full nav, 12px over the rail (a 48px item centred in 72px).
        style={phone ? undefined : { width: navWidth, paddingLeft: navWidth > 72 ? 16 : 12 }}
      >
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label={t('shell.brandHome')}
          className="group flex items-center rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {phone ? <BrandTile size={40} /> : <BrandLockup withWord={withWord} />}
        </button>
      </div>

      {/* The page's own context (Discover: its name and the area chip). A
          page fills it with <TopBarContext>; empty everywhere else. Starts on
          the content's left edge, because the brand slot is as wide as the
          nav below it. */}
      {!phone && <div id={TOPBAR_CONTEXT_ID} className="flex min-w-0 flex-1 items-center gap-3 pl-4" />}

      <div className={cn('flex shrink-0 items-center', phone ? 'gap-1.5' : 'gap-2')}>
        {ids.map((id) =>
          phone ? (
            <React.Fragment key={id}>{triggers[id]}</React.Fragment>
          ) : (
            <Popover key={id} open={open === id} onOpenChange={(o) => setOpen(o ? id : null)}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>{triggers[id]}</PopoverTrigger>
                </TooltipTrigger>
                {/* No tooltip over an open panel -- it would cover it. */}
                {open !== id && <TooltipContent side="bottom">{panels[id].tip}</TooltipContent>}
              </Tooltip>
              <PopoverContent
                align="end"
                sideOffset={8}
                // Radix focuses the first control on open, which drew a focus
                // ring on the footer link nobody had reached yet.
                onOpenAutoFocus={(e) => e.preventDefault()}
                className={cn(panels[id].width, 'overflow-hidden rounded-card border-input p-0 shadow-[0_16px_40px_rgba(31,27,24,0.18)]')}
              >
                {panels[id].body}
              </PopoverContent>
            </Popover>
          ),
        )}
        {!phone && <AccountMenu data={data} compact={platform === 'tablet'} />}
      </div>

      {phone &&
        ids.map((id) => (
          <ShellSheet key={id} open={open === id} onOpenChange={(o) => setOpen(o ? id : null)} title={panels[id].title}>
            {panels[id].body}
          </ShellSheet>
        ))}
    </header>
  )
}

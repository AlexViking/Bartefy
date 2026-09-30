import { useEffect, useState } from 'react'

import { Icon, type IconName } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { FEED_ICONS, useNotificationsFeed } from '@/lib/notificationsFeed'
import { EARN_RATES, TIER_PRICES, visitValue } from '@/lib/points'
import { cn } from '@/lib/utils'
import type { ShellData } from './useShellData'

/** The bodies behind the four things on the right of the top bar.
 *
 *  Topbar R2 (Alex, 2026-09-27): hover shows a one-line tooltip, a click opens
 *  the organism behind the chip -- a popover under it on desktop and tablet, a
 *  bottom sheet on a phone. These are that organism, drawn once and mounted by
 *  either container, so the two can never drift apart.
 */

/** A row at the foot of a panel that goes somewhere. */
function FootLink({ k, to, onGo }: { k: string; to: string; onGo: (to: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onGo(to)}
      className="flex w-full items-center justify-between border-t border-input px-4 py-3 text-left font-body text-label-lg text-primary transition-colors duration-fast ease-brand hover:bg-background"
    >
      <T as="span" k={k} />
      <Icon name="ArrowRight" size={18} />
    </button>
  )
}

/** Time until the server's next day. The streak's "today" is current_date on
 *  Supabase, which is UTC, so the countdown runs to UTC midnight. */
function useUntilNextDay() {
  const calc = () => {
    const now = new Date()
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    const mins = Math.max(0, Math.floor((next - now.getTime()) / 60_000))
    return { h: Math.floor(mins / 60), m: mins % 60 }
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const id = window.setInterval(() => setLeft(calc()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return left
}

/** Where the person is in their current week of the streak, 1..7. */
export function streakWeekDay(streakDays: number) {
  return streakDays > 0 ? ((streakDays - 1) % 7) + 1 : 1
}

/** #03 streak, popover size. Seven tiles, today filled, done days ticked. */
export function StreakPanel({ data, onGo }: { data: ShellData; onGo: (to: string) => void }) {
  const { t } = useT()
  const left = useUntilNextDay()
  const n = data.streakDays
  const day = streakWeekDay(n)
  // Values for this week of the run: day 8 onwards pays the flat 7.
  const base = Math.max(0, n - day)
  const value = (d: number) => visitValue(base + d)
  const week = [1, 2, 3, 4, 5, 6, 7].reduce((sum, d) => sum + value(d), 0)

  const title = n <= 1 ? t('shell.streakFirst') : t('shell.streakTitle', { n })
  return (
    <div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-selected text-primary">
            <Icon name="Flame" size={22} filled />
          </span>
          <div className="min-w-0">
            <p className="font-display text-headline-sm text-foreground">{title}</p>
            <p className="font-body text-body-sm text-muted-foreground">
              {data.claimedToday ? (
                <>
                  <span className="font-semibold text-primary">
                    {t('shell.streakClaimed', { pts: value(day) })}
                  </span>{' '}
                  {day < 7 && t('shell.streakTomorrow', { pts: value(day + 1) })}
                </>
              ) : (
                t('shell.streakWaiting')
              )}
            </p>
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const done = d < day || (d === day && data.claimedToday)
            const today = d === day
            return (
              <li
                key={d}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-0.5 rounded-lg',
                  today && data.claimedToday && 'bg-primary text-primary-foreground',
                  today && !data.claimedToday && 'bg-card text-primary ring-2 ring-inset ring-primary',
                  !today && done && 'bg-background text-muted-foreground',
                  !today && !done && 'bg-background/70 text-muted-foreground/70',
                )}
              >
                <span className="text-[10px] font-bold leading-none tracking-[0.05em]">
                  {today ? t('shell.streakToday') : t('shell.streakDayShort', { n: d })}
                </span>
                <Icon
                  name={today ? 'Flame' : done ? 'CircleCheck' : d === 7 ? 'Star' : 'Lock'}
                  size={18}
                  filled={today}
                  className={cn(!today && done && 'text-primary')}
                />
                <span className="font-display text-[12px] font-bold leading-none tabular-nums">
                  +{value(d)}
                </span>
              </li>
            )
          })}
        </ol>

        <p className="mt-3 font-body text-body-sm text-muted-foreground">
          {t('shell.streakNext', { h: left.h, m: left.m, week })}
        </p>
      </div>
      <FootLink k="shell.streakSeeAll" to="/points" onGo={onGo} />
    </div>
  )
}

const EARN_ICONS: Record<string, IconName> = {
  list_find: 'ImagePlus',
  offer_accepted: 'Handshake',
  swap_completed: 'CircleCheck',
  referral_first_swap: 'UserPlus',
}

/** Points wallet, popover size: balance, the road to Collector, and the ways
 *  to earn -- the same numbers as lib/points.ts, which mirrors the database. */
export function PointsPanel({ data, onGo }: { data: ShellData; onGo: (to: string) => void }) {
  const { t } = useT()
  const goal = TIER_PRICES.collector
  const toGo = Math.max(0, goal - data.points)
  const pct = Math.min(100, Math.round((data.points / goal) * 100))

  return (
    <div>
      <div className="p-4">
        <T as="p" k="shell.pointsYour" className="font-body text-label-sm uppercase text-muted-foreground" />
        <p className="mt-1 flex items-baseline gap-1.5">
          <Icon name="Coins" size={24} className="self-center text-foreground" />
          <span className="font-display text-headline-lg tabular-nums text-foreground">{data.points}</span>
          <T as="span" k="shell.pts" className="font-body text-label-md text-muted-foreground" />
        </p>
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-pill bg-secondary">
            <div className="h-full rounded-pill bg-sun" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 font-body text-body-sm text-muted-foreground">
            {toGo > 0 ? t('shell.pointsMore', { n: toGo }) : t('shell.pointsEnough')}
          </p>
        </div>

        <T as="p" k="shell.pointsEarn" className="mb-1 mt-4 font-body text-label-sm uppercase text-muted-foreground" />
        <ul className="flex flex-col">
          <li className="flex items-center gap-3 py-1.5">
            <Icon name="Flame" size={18} className="text-muted-foreground" />
            <T as="span" k="shell.earnVisit" className="flex-1 font-body text-body-sm text-foreground" />
            <span className="font-display text-ticker text-primary">+2–7</span>
          </li>
          {EARN_RATES.map((r) => (
            <li key={r.reason} className="flex items-center gap-3 py-1.5">
              <Icon name={EARN_ICONS[r.reason] ?? 'Star'} size={18} className="text-muted-foreground" />
              <T as="span" k={`points.earn_${r.reason}`} className="flex-1 font-body text-body-sm text-foreground" />
              <span className="font-display text-ticker text-primary">+{r.points}</span>
            </li>
          ))}
        </ul>
      </div>
      <FootLink k="shell.pointsOpen" to="/points" onGo={onGo} />
    </div>
  )
}

/** The bell: the newest four things from the same feed as /notifications. */
export function BellPanel({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useT()
  const { data: rows = [], isLoading, isError } = useNotificationsFeed()
  const top = rows.slice(0, 4)

  return (
    <div>
      <div className="px-4 pb-2 pt-4">
        <T as="p" k="notif.title" className="font-display text-headline-sm text-foreground" />
      </div>
      {isLoading ? (
        <T as="p" k="common.loading" className="px-4 pb-4 font-body text-body-sm text-muted-foreground" />
      ) : isError ? (
        <T as="p" k="shell.bellError" className="px-4 pb-4 font-body text-body-sm text-foreground" />
      ) : top.length === 0 ? (
        <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center">
          <span className="grid size-12 place-items-center rounded-pill bg-background text-muted-foreground">
            <Icon name="Bell" size={24} />
          </span>
          <T as="p" k="shell.bellEmptyTitle" className="mt-3 font-body text-label-lg text-foreground" />
          <T as="p" k="shell.bellEmptyBody" className="mt-1 font-body text-body-sm text-muted-foreground" />
        </div>
      ) : (
        <ul className="flex flex-col pb-1">
          {top.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onGo(n.path)}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors duration-fast ease-brand hover:bg-background"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-secondary text-muted-foreground">
                  <Icon name={FEED_ICONS[n.kind]} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span data-i18n={n.titleKey} className="block font-body text-label-lg text-foreground">
                    {t(n.titleKey)}
                  </span>
                  {/* Listing titles: user data, no key on this line. */}
                  <span className="block truncate font-body text-body-sm text-muted-foreground">{n.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FootLink k="shell.bellAll" to="/notifications" onGo={onGo} />
    </div>
  )
}

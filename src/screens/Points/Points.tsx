import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { useShellData } from '@/components/shell/useShellData'
import { streakWeekDay } from '@/components/shell/ShellPanels'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { getProfile } from '@/lib/api'
import { keys } from '@/lib/cache/queryClient'
import { useIsDesktop } from '@/lib/platform'
import {
  EARN_RATES,
  getGrants,
  getLedger,
  PAID_LISTINGS_PER_MONTH,
  PERK_DAYS,
  PERK_PRICES,
  pointsErrorKey,
  spendOnPerk,
  spendOnTier,
  TIER_PRICES,
  visitValue,
} from '@/lib/points'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>
type Tab = 'earn' | 'tiers' | 'perks' | 'history'
const DAY = 86_400_000

const REASON_ICON: Record<string, IconName> = {
  list_find: 'ImagePlus',
  offer_accepted: 'Handshake',
  swap_completed: 'CircleCheck',
  referral_first_swap: 'UserPlus',
  daily_visit: 'Flame',
  buy_tier: 'Star',
  buy_boost: 'Zap',
  buy_radius: 'Compass',
  buy_eyeing: 'Heart',
  buy_super: 'Rocket',
  buy_multi: 'Stacks',
  backfill: 'Coins',
  admin_grant: 'Award',
}

/** Points & tiers (proposal B). Points are the currency until payments exist
 *  (2026-09-06): earned by what grows the market, spent on what money will
 *  buy later. Left: the balance and the ways to earn. Right: Tiers · Perks ·
 *  History. A phone puts the four in tabs. Membership and Invite fold in here. */
export default function Points() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const desktop = useIsDesktop()
  const shell = useShellData()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const q = new URLSearchParams(useLocation().search).get('tab') as Tab | null
  const tab: Tab = q && ['earn', 'tiers', 'perks', 'history'].includes(q) ? q : desktop ? 'tiers' : 'earn'
  const setTab = (next: Tab) => navigate(`/points?tab=${next}`, { replace: true })
  const [error, setError] = React.useState<string | null>(null)

  const { data: ledger = [] } = useQuery({
    queryKey: ['points', 'ledger', userId ?? ''],
    queryFn: async () => {
      const { data, error: e } = await getLedger(userId!, 100)
      if (e) throw e
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
  })
  const { data: grants = [] } = useQuery({
    queryKey: ['points', 'grants', userId ?? ''],
    queryFn: async () => {
      const { data, error: e } = await getGrants(userId!)
      if (e) throw e
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
  })
  const { data: profile } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error: e } = await getProfile(userId!)
      if (e) throw e
      return data as Row
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['points'] })
    void qc.invalidateQueries({ queryKey: ['profile'] })
  }
  const buyTier = useMutation({
    mutationFn: async (tier: 'collector' | 'curator') => {
      const { error: e } = await spendOnTier(tier)
      if (e) throw e
    },
    onSuccess: () => {
      setError(null)
      refresh()
    },
    onError: (e: { code?: string }) => setError(pointsErrorKey(e)),
  })
  const buyRadius = useMutation({
    mutationFn: async () => {
      const { error: e } = await spendOnPerk('radius')
      if (e) throw e
    },
    onSuccess: () => {
      setError(null)
      refresh()
    },
    onError: (e: { code?: string }) => setError(pointsErrorKey(e)),
  })

  const now = Date.now()
  const month = new Date().toISOString().slice(0, 7)
  const listedThisMonth = ledger.filter((r) => r.reason === 'list_find' && String(r.created_at).startsWith(month)).length
  const earnedWeek = ledger
    .filter((r) => Number(r.delta) > 0 && now - Date.parse(String(r.created_at)) < 7 * DAY)
    .reduce((s, r) => s + Number(r.delta), 0)
  const radiusGrant = grants.find((g) => g.perk === 'radius')
  const code = profile?.referral_code ? String(profile.referral_code) : ''
  const link = code ? `https://bartefy.com/signup?invite=${code}` : ''
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })
  /** Today, Yesterday, else the date (the mock's history). */
  const when = (iso: string) => {
    const d = new Date(iso)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    if (d >= start) return t('pts.today')
    if (d.getTime() >= start.getTime() - DAY) return t('pts.yesterday')
    return date(iso)
  }
  // Which of my finds a row is about: list_find's subject is the item id,
  // a boost's is "itemId:time". Live finds only -- a paused one just shows
  // the date. Titles are user data.
  const findTitle = new Map(shell.table.map((f) => [f.id, f.title]))
  const aboutFind = (r: Row) => {
    const reason = String(r.reason)
    if (reason !== 'list_find' && reason !== 'buy_boost') return ''
    return findTitle.get(String(r.subject ?? '').split(':')[0]) ?? ''
  }
  const boostGrant = grants.find((g) => g.perk === 'boost')
  // "Daily visit · day 4": the day of the run each visit was, counted over
  // consecutive dates (a visit's subject is its date; a gap starts again).
  const visitDay = new Map<string, number>()
  {
    let prev = 0
    let run = 0
    for (const r of ledger.filter((x) => x.reason === 'daily_visit').sort((a, b) => String(a.subject).localeCompare(String(b.subject)))) {
      const day = Date.parse(String(r.subject))
      run = prev && day - prev === DAY ? run + 1 : 1
      prev = day
      visitDay.set(String(r.id), run)
    }
  }

  const copyInvite = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t('pts.copied'))
    } catch {
      toast(link)
    }
  }

  // ── left: the wallet and the ways to earn ──
  const day = streakWeekDay(shell.streakDays)
  const base = Math.max(0, shell.streakDays - day)
  const wallet = (
    <div className="flex flex-col">
      <div className="px-5 pb-5 pt-5">
        <p className="flex items-center gap-2 font-body text-label-sm uppercase text-muted-foreground">
          <Icon name="Coins" size={16} />
          <T as="span" k="shell.pointsYour" />
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[56px] font-bold leading-none tabular-nums text-foreground">{shell.points}</span>
          <span className="font-body text-body-md text-muted-foreground">{t('shell.pts')}</span>
          {earnedWeek > 0 && (
            <span className="ml-auto inline-flex h-7 items-center rounded-pill bg-mint px-2.5 font-body text-label-md text-forest">
              {t('pts.earnedWeek', { n: earnedWeek })}
            </span>
          )}
        </div>
        {shell.tier === 'hunter' && (
          <div className="mt-4">
            <div className="flex justify-between font-body text-body-sm">
              <span className="text-foreground">
                {shell.points >= TIER_PRICES.collector ? t('shell.pointsEnough') : t('pts.toCollector', { n: TIER_PRICES.collector - shell.points })}
              </span>
              <span className="tabular-nums text-muted-foreground">{Math.min(shell.points, TIER_PRICES.collector)} / {TIER_PRICES.collector}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-secondary">
              <div className="h-full rounded-pill bg-primary" style={{ width: `${Math.min(100, (shell.points / TIER_PRICES.collector) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-input px-5 py-4">
        <T as="p" k="shell.pointsEarn" className="mb-1 font-body text-label-sm uppercase text-muted-foreground" />
        <ul className="divide-y divide-input">
          {EARN_RATES.map((r) => (
            <li key={r.reason} className="flex gap-3 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
                <Icon name={REASON_ICON[r.reason]} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <T as="span" k={`points.earn_${r.reason}`} className="font-body text-label-lg text-foreground" />
                  <span className="font-display text-ticker text-primary">+{r.points}</span>
                </div>
                <T as="p" k={`pts.how_${r.reason}`} className="font-body text-[12px] leading-4 text-muted-foreground" />
                {r.reason === 'list_find' && (
                  <>
                    <p className="mt-1 font-body text-[12px] text-muted-foreground">
                      {t('pts.listedMonth', { n: Math.min(listedThisMonth, PAID_LISTINGS_PER_MONTH), max: PAID_LISTINGS_PER_MONTH })}
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-pill bg-secondary">
                      <div className="h-full rounded-pill bg-primary" style={{ width: `${Math.min(100, (listedThisMonth / PAID_LISTINGS_PER_MONTH) * 100)}%` }} />
                    </div>
                  </>
                )}
                {r.reason === 'referral_first_swap' && link && (
                  <Button variant="ghost" size="sm" onClick={() => void copyInvite()} className="mt-2">
                    <Icon name="UserPlus" size={16} />
                    <T as="span" k="pts.copyInvite" />
                  </Button>
                )}
              </div>
            </li>
          ))}
          <li className="flex gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
              <Icon name="Flame" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <T as="span" k="pts.visitTitle" className="font-body text-label-lg text-foreground" />
                <span className="font-display text-ticker text-primary">+2–7</span>
              </div>
              <p className="font-body text-[12px] leading-4 text-muted-foreground">{t('pts.visitDay', { day })}</p>
              <div className="mt-2 flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const done = d < day || (d === day && shell.claimedToday)
                  return (
                    <span
                      key={d}
                      className={cn(
                        'grid size-7 place-items-center rounded-md text-[11px] font-bold',
                        d === day ? 'bg-primary text-primary-foreground' : done ? 'bg-sun text-ink' : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {d === day ? <Icon name="Flame" size={14} /> : done ? <Icon name="Check" size={14} /> : `+${visitValue(base + d)}`}
                    </span>
                  )
                })}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )

  // ── right: tiers ──
  const tierCard = (id: 'hunter' | 'collector' | 'curator') => {
    const mine = shell.tier === id
    const price = id === 'hunter' ? 0 : TIER_PRICES[id]
    const lines = t(`pts.tierLines_${id}`).split('|')
    return (
      <div key={id} className={cn('flex flex-col rounded-card p-5 ring-1', mine ? 'bg-selected/40 ring-2 ring-primary' : 'bg-card ring-input')}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-headline-md text-foreground">{t(`shell.tier_${id}`)}</p>
          {mine && <T as="span" k="pts.yours" className="rounded-pill bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-foreground" />}
        </div>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="font-display text-[28px] font-bold leading-8 tabular-nums text-foreground">{id === 'hunter' ? t('pts.free') : price.toLocaleString(lang)}</span>
          {id !== 'hunter' && <span className="font-body text-body-sm text-muted-foreground">{t('pts.per30')}</span>}
        </p>
        <T as="p" k={`pts.tierBlurb_${id}`} className="mt-2 font-body text-body-sm text-muted-foreground" />
        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {lines.map((l) => (
            <li key={l} className="flex gap-2 font-body text-body-sm text-foreground">
              <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-primary" />
              {l}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          {mine ? (
            <span className="flex h-11 items-center justify-center gap-2 rounded-card bg-background font-body text-label-lg text-muted-foreground">
              <Icon name="Check" size={16} />
              <T as="span" k="pts.yourTier" />
            </span>
          ) : id === 'hunter' ? null : shell.points >= price ? (
            <Button fullWidth onClick={() => buyTier.mutate(id)} disabled={buyTier.isPending}>
              {t('pts.redeem', { n: price.toLocaleString(lang) })}
            </Button>
          ) : (
            <>
              <span className="flex h-11 items-center justify-center gap-2 rounded-card font-body text-label-lg text-muted-foreground ring-1 ring-input">
                <Icon name="Lock" size={16} />
                {t('pts.more', { n: (price - shell.points).toLocaleString(lang) })}
              </span>
              <p className="mt-2 text-center font-body text-[12px] text-muted-foreground">{t('pts.redeemAt', { n: price.toLocaleString(lang) })}</p>
            </>
          )}
        </div>
      </div>
    )
  }
  const tiers = (
    <div className="flex flex-col gap-4">
      <div className={cn('grid gap-3', desktop ? 'grid-cols-3' : 'grid-cols-1')}>{(['hunter', 'collector', 'curator'] as const).map(tierCard)}</div>
      <p className="flex gap-2 font-body text-body-sm text-muted-foreground">
        <Icon name="ShieldCheck" size={18} className="shrink-0 text-primary" />
        <T as="span" k="pts.alwaysFree" />
      </p>
    </div>
  )

  // ── right: perks ── (the mock: two columns of cards in both sections)
  const perkCard = (
    icon: IconName,
    title: string,
    body: string,
    price: number,
    action: React.ReactNode,
    opts: { active?: React.ReactNode } = {},
  ) => (
    <article className="flex items-start gap-4 rounded-card p-4 ring-1 ring-input">
      <span className={cn('grid size-11 shrink-0 place-items-center rounded-card', opts.active ? 'bg-sun/70 text-ink' : 'bg-background text-muted-foreground')}>
        <Icon name={icon} size={22} filled />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-body text-label-lg text-foreground">{title}</span>
          <span className="whitespace-nowrap font-display text-[13px] font-bold text-foreground">{t('pts.ptsN', { n: price })}</span>
        </div>
        <p className="font-body text-body-sm text-muted-foreground">{body}</p>
        {opts.active}
        <div className="mt-2">{action}</div>
      </div>
    </article>
  )
  const boostOn = boostGrant
    ? (() => {
        const hours = Math.max(1, Math.round((Date.parse(String(boostGrant.expires_at)) - now) / 3_600_000))
        const title = findTitle.get(String(boostGrant.subject ?? '').split(':')[0])
        return (
          <p className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-pill bg-sun/50 px-2.5 text-[12px] font-semibold text-ink">
            <Icon name="Clock" size={14} />
            {title ? t('pts.boostOn', { title, h: hours }) : t('pts.boostOnAny', { h: hours })}
          </p>
        )
      })()
    : undefined
  const perks = (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <p className="font-body text-label-sm uppercase tracking-wider text-muted-foreground">{t('pts.turnOnHere', { n: PERK_DAYS.radius })}</p>
        <div className={cn('grid gap-3', desktop ? 'grid-cols-2' : 'grid-cols-1')}>
          {perkCard(
            'Compass',
            t('pts.huntFurther'),
            t('pts.huntFurtherBody'),
            PERK_PRICES.radius,
            radiusGrant ? (
              <span className="inline-flex h-8 items-center rounded-pill bg-mint px-3 font-body text-label-md text-forest">
                {t('pts.onUntil', { date: date(String(radiusGrant.expires_at)) })}
              </span>
            ) : (
              <Button
                variant="ghost"
                className="h-9 min-h-0 rounded-lg border-0 bg-transparent px-3.5 font-body text-label-md text-primary ring-1 ring-inset ring-primary/50 hover:bg-selected"
                onClick={() => buyRadius.mutate()}
                disabled={buyRadius.isPending || shell.points < PERK_PRICES.radius}
              >
                {shell.points < PERK_PRICES.radius ? t('pts.more', { n: PERK_PRICES.radius - shell.points }) : t('pts.turnOn', { n: PERK_DAYS.radius })}
              </Button>
            ),
          )}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <T as="p" k="pts.inTheMoment" className="font-body text-label-sm uppercase tracking-wider text-muted-foreground" />
        <div className={cn('grid gap-3', desktop ? 'grid-cols-2' : 'grid-cols-1')}>
          {perkCard('Zap', t('pts.boost'), t('pts.boostBody'), PERK_PRICES.boost, <Link k="pts.fromFinds" onClick={() => navigate('/items')} />, { active: boostOn })}
          {perkCard('Rocket', t('composer.super'), t('pts.superBody'), PERK_PRICES.super, <Link k="pts.whenYouOffer" onClick={() => navigate('/discover')} />)}
          {perkCard('Stacks', t('pts.multi'), t('pts.multiBody'), PERK_PRICES.multi, <Link k="pts.whenYouOffer" onClick={() => navigate('/discover')} />)}
        </div>
      </section>
    </div>
  )

  // ── right: history ──
  const [filter, setFilter] = React.useState<'all' | 'in' | 'out'>('all')
  const rows = ledger.filter((r) => (filter === 'all' ? true : filter === 'in' ? Number(r.delta) > 0 : Number(r.delta) < 0))
  const history = (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['all', 'in', 'out'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="inline-flex h-8 items-center rounded-pill bg-card px-3 font-body text-label-md text-muted-foreground ring-1 ring-inset ring-input aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:ring-ink"
          >
            {t(`pts.filter_${f}`)}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <T as="p" k="pts.noHistory" className="py-6 font-body text-body-sm text-muted-foreground" />
      ) : (
        // The mock: one bordered list; earned rows wear Mint with a Forest
        // icon and a green amount, spent rows stay grey.
        <ul className="flex flex-col divide-y divide-input rounded-card ring-1 ring-input">
          {rows.map((r) => {
            const earned = Number(r.delta) > 0
            const about = aboutFind(r)
            return (
              <li key={String(r.id)} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', earned ? 'bg-mint text-forest' : 'bg-background text-muted-foreground')}>
                  <Icon name={REASON_ICON[String(r.reason)] ?? 'Coins'} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-body text-label-lg text-foreground" data-i18n={`points.reason_${String(r.reason)}`}>
                    {visitDay.has(String(r.id))
                      ? t('pts.historyVisitDay', { n: visitDay.get(String(r.id)) ?? 1 })
                      : t(`points.reason_${String(r.reason)}`)}
                  </span>
                  <span className="block truncate font-body text-[12px] text-muted-foreground">
                    {[when(String(r.created_at)), about].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className={cn('whitespace-nowrap font-display text-[14px] font-bold tabular-nums', earned ? 'text-primary' : 'text-muted-foreground')}>
                  {earned ? '+' : '−'}
                  {Math.abs(Number(r.delta))} {t('shell.pts')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const tabIds: Tab[] = desktop ? ['tiers', 'perks', 'history'] : ['earn', 'tiers', 'perks', 'history']
  const tabBar = (
    <div role="tablist" className="flex gap-6 border-b border-input px-1">
      {tabIds.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={cn(
            '-mb-px border-b-2 px-1 pb-2.5 pt-1 font-body text-label-lg transition-colors',
            tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`pts.tab_${id}`)}
        </button>
      ))}
    </div>
  )
  const body = tab === 'earn' ? wallet : tab === 'tiers' ? tiers : tab === 'perks' ? perks : history
  const errorLine = error && <p role="alert" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(error)}</p>

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="shell.nav_points" className="shrink-0 font-display text-headline-md text-foreground" />
      </TopBarContext>
      {desktop ? (
        <div className="flex h-full min-h-0 gap-6 px-6 py-4 lg:px-8">
          <div className="w-[clamp(340px,26vw,420px)] shrink-0 overflow-y-auto rounded-card bg-card ring-1 ring-input">{wallet}</div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-card ring-1 ring-input">
            <div className="shrink-0 px-5 pt-4">{tabBar}</div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
              {errorLine}
              {tab === 'earn' ? tiers : body}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-6 pt-3">
          <T as="h1" k="shell.nav_points" className="font-display text-[24px] font-bold leading-8 text-foreground" />
          {tab !== 'earn' && (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[32px] font-bold tabular-nums text-foreground">{shell.points}</span>
              <span className="font-body text-body-sm text-muted-foreground">{t('shell.pts')}</span>
            </div>
          )}
          {tabBar}
          {errorLine}
          <div className={cn(tab === 'earn' && '-mx-4')}>{body}</div>
        </div>
      )}
    </AppShell>
  )
}

function Link({ k, onClick }: { k: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-body text-label-md text-primary hover:underline">
      <T as="span" k={k} />
      <Icon name="ArrowRight" size={14} />
    </button>
  )
}

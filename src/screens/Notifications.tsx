import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/EmptyState'
import { useNeedsYou } from '@/components/deck/NeedsYou'
import { formatLeft } from '@/components/offer/ExpiryCountdown'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { Icon, type IconName } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { FEED_ICONS, useNotificationsFeed, type FeedItem } from '@/lib/notificationsFeed'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useMyFinds, SOON_DAYS } from '@/screens/MyFinds/useMyFinds'
import { useSwapsDesk } from '@/screens/Swaps/useSwapsDesk'

const DAY = 86_400_000
const TONE: Record<FeedItem['kind'], string> = {
  offer: 'bg-coral text-ink',
  match: 'bg-mint text-forest',
  completed: 'bg-mint text-forest',
  cancelled: 'bg-secondary text-muted-foreground',
  wishlist: 'bg-sky text-ink',
}

/** Notifications (proposal B): everything that happened, by day, and -- on
 *  the right -- what needs you now.
 *
 *  The feed is derived from what the app knows (offers, matches, wishlist
 *  hits), not a notifications table, so it has no read/unread state yet: the
 *  mock's Unread filter and "Mark all read" wait for that table, which comes
 *  with push. Nothing here pretends otherwise.
 */
export default function Notifications() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const { data: rows = [], isLoading, isError } = useNotificationsFeed()

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - DAY).toDateString()
  const bucket = (iso: string) => {
    const d = new Date(iso).toDateString()
    return d === today ? 'today' : d === yesterday ? 'yesterday' : 'earlier'
  }
  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map((g) => ({ g, items: rows.filter((r) => bucket(r.when) === g) }))
    .filter((x) => x.items.length > 0)
  const time = (iso: string) =>
    bucket(iso) === 'earlier'
      ? new Date(iso).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })
      : new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })

  const list = isLoading ? (
    <T as="p" k="common.loading" className="p-5 font-body text-body-sm text-muted-foreground" />
  ) : isError ? (
    <T as="p" k="shell.bellError" className="m-5 rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink" />
  ) : rows.length === 0 ? (
    <div className="py-10">
      <EmptyState title="notif.emptyTitle" body="notif.emptyBody" />
    </div>
  ) : (
    <div className="flex flex-col">
      {groups.map(({ g, items }) => (
        <section key={g}>
          <T as="p" k={`notif.day_${g}`} className="px-5 pb-1 pt-4 font-body text-label-sm uppercase text-muted-foreground" />
          <ul>
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => navigate(n.path)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-background"
                >
                  <span className="relative size-12 shrink-0">
                    {n.photo ? (
                      <img alt="" className="size-12 rounded-lg object-cover" src={n.photo} />
                    ) : (
                      <span className="block size-12 rounded-lg bg-secondary" />
                    )}
                    <span className={cn('absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-pill ring-2 ring-card', TONE[n.kind])}>
                      <Icon name={FEED_ICONS[n.kind]} size={13} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span data-i18n={n.titleKey} className="block truncate font-body text-label-lg text-foreground">
                      {t(n.titleKey)}
                    </span>
                    {/* Listing titles are user data. */}
                    <span className="block truncate font-body text-body-sm text-muted-foreground">{n.detail}</span>
                  </span>
                  <span className="shrink-0 font-body text-[12px] text-muted-foreground">{time(n.when)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="notif.title" className="shrink-0 font-display text-headline-md text-foreground" />
      </TopBarContext>
      {desktop ? (
        <div className="flex h-full min-h-0 gap-6 px-6 py-4 lg:px-8">
          <div className="min-w-0 flex-1 overflow-y-auto rounded-card bg-card pb-3 ring-1 ring-input">{list}</div>
          <aside className="w-[340px] shrink-0 self-start rounded-card bg-card p-4 ring-1 ring-input">
            <NeedsNow />
          </aside>
        </div>
      ) : (
        <div className="flex flex-col pb-6 pt-3">
          <T as="h1" k="notif.title" className="px-4 font-display text-[24px] font-bold leading-8 text-foreground" />
          <div className="px-4 pt-3">
            <NeedsNow compact />
          </div>
          {list}
        </div>
      )}
    </AppShell>
  )
}

/** What needs you now: offers running out, swaps waiting on your confirm,
 *  finds about to leave the deck. Each goes straight to where it is done. */
function NeedsNow({ compact = false }: { compact?: boolean }) {
  const { t } = useT()
  const navigate = useNavigate()
  const needs = useNeedsYou()
  const desk = useSwapsDesk()
  const finds = useMyFinds()
  const turn = desk.groups.find((g) => g.id === 'turn')?.items ?? []
  const soon = finds.leavingSoon

  const items: { icon: IconName; tone: string; title: string; sub: string; to: string }[] = []
  if (needs.expiring.length) {
    const first = needs.expiring[0]
    items.push({
      icon: 'AlarmClock',
      tone: 'bg-coral text-ink',
      title: t('notif.needOffers', { count: needs.expiring.length }),
      sub: t('notif.needOffersSub', { who: first.who, left: formatLeft(Date.parse(first.expiresAt) - Date.now(), t) }),
      to: '/matches',
    })
  }
  if (turn.length) {
    items.push({ icon: 'CircleCheck', tone: 'bg-mint text-forest', title: t('notif.needConfirm', { count: turn.length }), sub: t('notif.needConfirmSub'), to: '/matches/' + turn[0].id })
  }
  if (soon.length) {
    items.push({
      icon: 'Clock',
      tone: 'bg-sun text-ink',
      title: t('notif.needLeaving', { title: soon[0].title, count: soon[0].daysLeft ?? SOON_DAYS }),
      sub: t('notif.needLeavingSub'),
      to: '/items/' + soon[0].publicId,
    })
  }

  if (compact) {
    return items.length ? (
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {items.map((i) => (
          <button key={i.title} type="button" onClick={() => navigate(i.to)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill px-3 font-body text-label-md', i.tone)}>
            <Icon name={i.icon} size={14} />
            {i.title}
          </button>
        ))}
      </div>
    ) : null
  }

  return (
    <>
      <T as="p" k="notif.needsNow" className="mb-3 font-body text-label-sm uppercase text-muted-foreground" />
      {items.length === 0 ? (
        <T as="p" k="notif.needsNothing" className="font-body text-body-sm text-muted-foreground" />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.title}>
              <button type="button" onClick={() => navigate(i.to)} className="flex w-full items-center gap-3 rounded-card p-3 text-left ring-1 ring-input hover:bg-background">
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', i.tone)}>
                  <Icon name={i.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-body text-label-lg text-foreground">{i.title}</span>
                  <span className="block truncate font-body text-[12px] text-muted-foreground">{i.sub}</span>
                </span>
                <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 font-body text-[12px] text-muted-foreground">
        {t('notif.pushIn')}{' '}
        <button type="button" onClick={() => navigate('/settings?s=notifications')} className="text-primary hover:underline">
          {t('nav.settings')}
        </button>
      </p>
    </>
  )
}

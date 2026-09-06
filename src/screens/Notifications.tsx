import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Icon, type IconName } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { getIncomingOffers, getMyMatches } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown>

type Feed = {
  id: string
  kind: 'offer' | 'match' | 'cancelled' | 'completed'
  /** Title key, and the line under it. The line carries user data, so it is
   *  passed as a value rather than being part of the key. */
  titleKey: string
  detail: string
  when: string
  path: string
}

const ICONS: Record<Feed['kind'], IconName> = {
  offer: 'Heart',
  match: 'Sparkles',
  cancelled: 'ShieldAlert',
  completed: 'Check',
}

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const title = (v: unknown) => String(one(v)?.title ?? '')

/** Everything waiting on you, in one place.
 *
 *  Built from what the app already knows rather than from a notifications
 *  table: an offer sitting unanswered, a match that just opened, a swap that
 *  fell through because the other person traded elsewhere. Those are the four
 *  events the wireframe names, and all four are derivable today.
 *
 *  A real table with read/unread state belongs with push, which needs FCM v1
 *  and does not exist yet. Deriving now means the screen is honest -- it can
 *  never show a notification for something that did not happen.
 */
export default function Notifications() {
  const { t } = useT()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['notifications', userId ?? ''],
    queryFn: async () => {
      const [offers, matches] = await Promise.all([
        getIncomingOffers(userId!),
        getMyMatches(userId!),
      ])
      const feed: Feed[] = []

      for (const o of (offers.data ?? []) as Row[]) {
        feed.push({
          id: 'o' + String(o.id),
          kind: 'offer',
          titleKey: 'notif.offerTitle',
          detail: `${title(o.offered)} → ${title(o.wanted)}`,
          when: String(o.created_at ?? ''),
          path: '/offers',
        })
      }

      for (const m of (matches.data ?? []) as Row[]) {
        const isA = String(m.user_a) === userId
        // A row the person already tidied away should not come back as a
        // notification -- that is the opposite of archiving.
        if (isA ? m.a_archived : m.b_archived) continue

        const mine = isA ? title(m.itemA) : title(m.itemB)
        const theirs = isA ? title(m.itemB) : title(m.itemA)
        const pair = `${mine} ⇄ ${theirs}`
        const status = String(m.status ?? 'active')

        if (status === 'completed') {
          feed.push({
            id: 'c' + String(m.id), kind: 'completed', titleKey: 'notif.completedTitle',
            detail: pair, when: String(m.completed_at ?? m.created_at ?? ''),
            path: '/matches/' + m.id,
          })
        } else if (status === 'cancelled') {
          feed.push({
            id: 'x' + String(m.id), kind: 'cancelled',
            titleKey:
              m.cancel_reason === 'item_traded_elsewhere'
                ? 'notif.goneTitle'
                : 'notif.cancelledTitle',
            detail: pair, when: String(m.created_at ?? ''), path: '/matches/' + m.id,
          })
        } else {
          feed.push({
            id: 'm' + String(m.id), kind: 'match', titleKey: 'notif.matchTitle',
            detail: pair, when: String(m.created_at ?? ''), path: '/matches/' + m.id,
          })
        }
      }

      return feed.sort((a, b) => (a.when < b.when ? 1 : -1))
    },
    enabled: !!userId,
  })

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <T as="h1" k="notif.title" className="mb-4 font-display text-h2 text-foreground" />

        {isLoading ? (
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        ) : rows.length === 0 ? (
          <EmptyState title="notif.emptyTitle" body="notif.emptyBody" />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => navigate(n.path)}
                  className={cn(
                    'flex w-full animate-rise-in items-center gap-3 rounded-card border-[1.5px] border-border/[0.14] bg-card p-3 text-left',
                    'transition-colors duration-fast ease-brand hover:border-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-pill',
                      n.kind === 'cancelled' ? 'bg-secondary' : 'bg-primary/[0.10]',
                    )}
                  >
                    <Icon
                      name={ICONS[n.kind]}
                      size={18}
                      className={n.kind === 'cancelled' ? 'text-muted-foreground' : 'text-primary'}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      data-i18n={n.titleKey}
                      className="block font-display text-[15px] font-semibold text-foreground"
                    >
                      {t(n.titleKey)}
                    </span>
                    {/* Listing titles: user data, no key on this line. */}
                    <span className="block truncate font-body text-sm text-muted-foreground">
                      {n.detail}
                    </span>
                  </span>
                  <Icon name="ChevronRight" size={16} className="shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}

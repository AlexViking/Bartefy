import { useNavigate } from 'react-router'

import { AppShell } from '@/components/shell/AppShell'
import { PageBody } from '@/components/shell/PageBody'
import { PageHeader } from '@/components/shell/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { FEED_ICONS, useNotificationsFeed } from '@/lib/notificationsFeed'
import { cn } from '@/lib/utils'

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

  const { data: rows = [], isLoading } = useNotificationsFeed()

  return (
    <AppShell>
      <PageBody>
        <PageHeader title="notif.title" />

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
                      name={FEED_ICONS[n.kind]}
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
      </PageBody>
    </AppShell>
  )
}

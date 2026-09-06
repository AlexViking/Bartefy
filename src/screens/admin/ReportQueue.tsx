import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Chip, ToneBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useReportQueue, type QueueStatus } from './useReportQueue'

const STATUSES: QueueStatus[] = ['open', 'reviewing', 'resolved']

/** Back-office. Two queues: reports a person filed, and items the AI check
 *  held before publishing.
 *
 *  Three things were wrong with this screen before and are fixed here:
 *  it rendered a hardcoded array, it had no staff gate at all, and it used
 *  AppShell hideNav with no back control -- so anyone who reached it was
 *  trapped with no way out but the browser's back button.
 *
 *  Nothing is decided automatically. Every outcome is a person pressing a
 *  button, which is the rule, not an implementation shortcut.
 */
export function ReportQueue() {
  const q = useReportQueue()
  const { t } = useT()
  const isDesktop = useIsDesktop()

  // Distinguished from "not staff" on purpose: showing the refusal while the
  // answer is still in flight tells a moderator they have no access every
  // single time they open the page.
  if (q.checkingStaff) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center p-8">
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!q.isStaff) {
    return (
      <AppShell>
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 px-4 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-secondary">
            <Icon name="ShieldAlert" size={24} className="text-muted-foreground" />
          </span>
          <T as="h1" k="admin.noAccessTitle" className="font-display text-h3 text-foreground" />
          <T
            as="p"
            k="admin.noAccessBody"
            className="font-body text-body text-muted-foreground"
          />
          <Button variant="ghost" onClick={q.goBack} data-i18n="common.back">
            {t('common.back')}
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        {/* A back control, which this screen did not have. hideNav plus no
            back is a room with no door. */}
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" pill onClick={q.goBack} aria-label={t('common.back')}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <T as="h1" k="admin.title" className="font-display text-h2 text-foreground" />
        </div>
        <T as="p" k="admin.subtitle" className="mb-4 font-body text-sm text-muted-foreground" />

        {/* Held items first: an item sitting here is invisible to its owner
            and to everyone else, so it is the more urgent of the two lists. */}
        {q.held.length > 0 && (
          <section className="mb-6">
            <T
              as="h2"
              k="admin.heldTitle"
              className="mb-2 font-display text-h3 text-foreground"
            />
            <ul className="flex flex-col gap-2">
              {q.held.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-card border-[1.5px] border-border/[0.14] bg-card p-3"
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="size-14 rounded-card-sm object-cover" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-card-sm bg-secondary">
                      <Icon name="Package" size={18} className="text-muted-foreground" />
                    </span>
                  )}
                  {/* A listing title is user data: no data-i18n. */}
                  <span className="min-w-0 flex-1 truncate font-body text-body text-foreground">
                    {item.title}
                  </span>
                  <Button
                    size="sm"
                    disabled={q.busy}
                    onClick={() => q.publishItem(item.id)}
                    data-i18n="admin.publish"
                  >
                    {t('admin.publish')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={q.busy}
                    onClick={() => q.removeItem(item.id)}
                    data-i18n="admin.remove"
                  >
                    {t('admin.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mb-4 flex gap-2">
          {STATUSES.map((s) => (
            <Chip key={s} active={q.status === s} onClick={() => q.setStatus(s)}>
              {t('admin.status_' + s)}
            </Chip>
          ))}
        </div>

        {q.isLoading ? (
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        ) : q.rows.length === 0 ? (
          <EmptyState title="admin.emptyTitle" body="admin.emptyBody" />
        ) : (
          <div className={cn('grid gap-4', isDesktop && 'grid-cols-[320px_1fr]')}>
            <ul className="flex flex-col gap-2">
              {q.rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => q.select(r.id)}
                    className={cn(
                      'w-full rounded-card p-3 text-left transition-colors duration-fast ease-brand',
                      q.current?.id === r.id
                        ? 'border-2 border-primary bg-popover'
                        : 'border-[1.5px] border-border/[0.14] bg-card hover:bg-popover',
                    )}
                  >
                    <span
                      data-i18n={'admin.reason_' + r.reason}
                      className="block truncate font-display text-[15px] font-semibold text-foreground"
                    >
                      {t('admin.reason_' + r.reason)}
                    </span>
                    <span className="mt-1 block font-body text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {q.current && (
              <section className="flex flex-col gap-4 rounded-card border-[1.5px] border-border/[0.14] bg-card p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2
                    data-i18n={'admin.reason_' + q.current.reason}
                    className="font-display text-h3 text-foreground"
                  >
                    {t('admin.reason_' + q.current.reason)}
                  </h2>
                  <ToneBadge tone={q.current.status === 'open' ? 'brass' : 'quiet'}>
                    {t('admin.status_' + q.current.status)}
                  </ToneBadge>
                </div>

                {q.current.note && (
                  // The reporter's own words. Never stamped with a key, and
                  // never summarised: a moderator needs what was actually said.
                  <p className="rounded-card-sm bg-popover p-3 font-body text-body text-foreground">
                    {q.current.note}
                  </p>
                )}

                {q.current.evidence.length > 0 && (
                  <div>
                    <T
                      as="span"
                      k="admin.evidence"
                      className="mb-2 block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
                    />
                    <ul className="flex flex-wrap gap-2">
                      {q.current.evidence.map((path) => (
                        <li
                          key={path}
                          className="rounded-card-sm bg-popover px-2 py-1 font-body text-xs text-muted-foreground"
                        >
                          {path}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {q.current.status === 'open' && (
                    <Button
                      disabled={q.busy}
                      onClick={() => q.current && q.review(q.current.id)}
                      data-i18n="admin.markReviewing"
                    >
                      {t('admin.markReviewing')}
                    </Button>
                  )}
                  {q.current.status !== 'resolved' && (
                    <Button
                      variant="ghost"
                      disabled={q.busy}
                      onClick={() => q.current && q.resolve(q.current.id)}
                      data-i18n="admin.markResolved"
                    >
                      {t('admin.markResolved')}
                    </Button>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

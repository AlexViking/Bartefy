import { useState } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { PageBody } from '@/components/shell/PageBody'
import { PageHeader, PageTabs } from '@/components/shell/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Chip, ToneBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useReportQueue, type QueueStatus } from './useReportQueue'

const STATUSES: QueueStatus[] = ['open', 'reviewing', 'resolved']

/** Which queue is open. Items first: since migration 028 no listing reaches a
 *  deck until someone approves it here, so that is the job this screen exists
 *  for. Reports are the older, rarer half. */
type Pane = 'items' | 'reports'

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
  const [pane, setPane] = useState<Pane>('items')
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
      <PageBody variant="wide">
        {/* No back arrow: Moderation is a rail destination like every other
            screen, and the two lists are tabs rather than one page stacked on
            another. Items first -- since migration 028 nothing reaches a deck
            until someone here approves it, so that queue is the job. */}
        <PageHeader
          title="admin.title"
          subtitle="admin.subtitle"
          tabs={
            <PageTabs
              tabs={[
                { id: 'items' as const, label: 'admin.tabItems' },
                { id: 'reports' as const, label: 'admin.tabReports' },
              ]}
              value={pane}
              onChange={setPane}
            />
          }
        />

        {pane === 'items' && (
          <section className="mb-6">
            {q.uploads.length === 0 ? (
              <EmptyState title="admin.itemsEmptyTitle" body="admin.itemsEmptyBody" />
            ) : (
              <ul className="flex flex-col gap-2">
                {q.uploads.map((item) => {
                  const hidden = item.moderationStatus === 'held'
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 rounded-card border-[1.5px] border-border/[0.14] bg-card p-3',
                        // A hidden listing is dimmed rather than removed from
                        // the list: a moderator needs to see what they hid in
                        // order to put it back.
                        hidden && 'opacity-60',
                      )}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="size-14 rounded-card-sm object-cover" />
                      ) : (
                        <span className="flex size-14 items-center justify-center rounded-card-sm bg-secondary">
                          <Icon name="Package" size={18} className="text-muted-foreground" />
                        </span>
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          {/* A listing title is user data: no data-i18n. */}
                          <span className="min-w-0 truncate font-body text-body text-foreground">
                            {item.title}
                          </span>
                          {hidden && (
                            <ToneBadge tone="brass">{t('admin.heldBadge')}</ToneBadge>
                          )}
                        </span>
                        {/* When it was uploaded. The whole reason this feed is
                            newest-first is that recency is what a moderator is
                            acting on. */}
                        <time
                          dateTime={item.createdAt}
                          className="font-body text-xs text-muted-foreground"
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </time>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => q.openItem(item.publicId)}
                        data-i18n="admin.view"
                      >
                        {t('admin.view')}
                      </Button>
                      {hidden ? (
                        <Button
                          size="sm"
                          disabled={q.busy}
                          onClick={() => q.restoreItem(item.id)}
                          data-i18n="admin.restore"
                        >
                          {t('admin.restore')}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={q.busy}
                          onClick={() => q.hideItem(item.id)}
                          className="text-destructive"
                          data-i18n="admin.hide"
                        >
                          {t('admin.hide')}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {pane === 'reports' && (
        <>
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
        </>
        )}
      </PageBody>
    </AppShell>
  )
}

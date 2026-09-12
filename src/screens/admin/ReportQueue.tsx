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
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useReportQueue, type HeldItem, type QueueStatus } from './useReportQueue'

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
  /** Which upload is open in the right-hand pane. Defaults to the newest,
   *  because an empty pane beside a full list reads as broken. */
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected =
    q.uploads.find((u) => u.id === selectedId) ?? q.uploads[0] ?? null
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
          q.uploads.length === 0 ? (
            <EmptyState title="admin.itemsEmptyTitle" body="admin.itemsEmptyBody" />
          ) : (
            /* Two panes, like the swaps inbox: the queue stays put on the left
               while the find being judged opens on the right. A single-column
               list left ~900px of empty row per item and still did not say who
               uploaded anything -- which is the one question a moderator has. */
            <div className={cn('grid gap-5', isDesktop && 'grid-cols-[minmax(320px,420px)_1fr]')}>
              <ul className="flex min-w-0 flex-col gap-2">
                {q.uploads.map((item) => {
                  const hidden = item.moderationStatus === 'held'
                  const active = selected?.id === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          'flex w-full min-w-0 items-center gap-3 rounded-card border-[1.5px] bg-card p-3 text-left transition-colors',
                          active ? 'border-primary' : 'border-border/[0.14] hover:border-primary/40',
                          hidden && 'opacity-60',
                        )}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" className="size-14 shrink-0 rounded-card-sm object-cover" />
                        ) : (
                          <span className="flex size-14 shrink-0 items-center justify-center rounded-card-sm bg-secondary">
                            <Icon name="Package" size={18} className="text-muted-foreground" />
                          </span>
                        )}
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex min-w-0 items-center gap-2">
                            {/* A listing title is user data: no data-i18n. */}
                            <span className="min-w-0 truncate font-body text-body text-foreground">
                              {item.title}
                            </span>
                            {hidden && <ToneBadge tone="brass">{t('admin.heldBadge')}</ToneBadge>}
                          </span>
                          {/* Who listed it, on the row itself -- the question
                              this screen exists to answer. */}
                          <span className="truncate font-body text-xs text-muted-foreground">
                            {item.owner?.name || t('swaps.someone')} ·{' '}
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {isDesktop && (
                <section className="min-w-0">
                  {selected ? (
                    <ItemPane item={selected} q={q} />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8">
                      <EmptyState title="admin.pickTitle" body="admin.pickBody" />
                    </div>
                  )}
                </section>
              )}
            </div>
          )
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

/** One upload, judged.
 *
 *  Everything a moderator needs to decide, in the order they need it: the
 *  photos, what it claims to be, and WHO listed it -- with a way through to
 *  that person's other finds. One bad listing is a mistake; the same account
 *  three times is a pattern, and the queue could not show that before.
 */
function ItemPane({ item, q }: { item: HeldItem; q: ReturnType<typeof useReportQueue> }) {
  const { t } = useT()
  const hidden = item.moderationStatus === 'held'

  return (
    <div className="flex flex-col gap-4 rounded-card border-[1.5px] border-border/[0.14] bg-card p-5">
      {item.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {item.images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              className="h-48 shrink-0 rounded-card-sm object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {/* User data: no data-i18n. */}
          <h2 className="min-w-0 truncate font-display text-h3 text-foreground">{item.title}</h2>
          {hidden && <ToneBadge tone="brass">{t('admin.heldBadge')}</ToneBadge>}
        </div>
        <time
          dateTime={item.createdAt}
          className="font-body text-xs text-muted-foreground"
        >
          {new Date(item.createdAt).toLocaleString()}
        </time>
      </div>

      {item.description && (
        <p className="whitespace-pre-wrap font-body text-sm text-muted-foreground">
          {item.description}
        </p>
      )}

      {/* The uploader, and the signals that decide whether this is one bad
          listing or a bad account. */}
      {item.owner && <UploaderPane owner={item.owner} q={q} />}

      <div className="flex flex-wrap items-center gap-2 border-t border-border/[0.14] pt-4">
        <Button variant="ghost" size="sm" onClick={() => q.openItem(item.publicId)} data-i18n="admin.view">
          {t('admin.view')}
        </Button>
        {hidden ? (
          <Button size="sm" disabled={q.busy} onClick={() => q.restoreItem(item.id)} data-i18n="admin.restore">
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
      </div>
    </div>
  )
}

/** Who listed it, and everything that says whether they are a problem.
 *
 *  The name falls back to the email: profiles.name is optional at signup, so
 *  "Someone" was accurate data and useless to a moderator.
 */
function UploaderPane({
  owner,
  q,
}: {
  owner: NonNullable<HeldItem['owner']>
  q: ReturnType<typeof useReportQueue>
}) {
  const { t } = useT()
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const suspended = !!owner.suspendedAt
  const label = owner.name || owner.email || t('swaps.someone')

  return (
    <div className="flex flex-col gap-3 rounded-card bg-secondary/60 p-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={label} size="md" tone={suspended ? 'quiet' : 'accent'} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            {/* A person's name or address: user data, never a key. */}
            <span className="min-w-0 truncate font-body text-sm text-foreground">{label}</span>
            {suspended && <ToneBadge tone="brass">{t('admin.suspended')}</ToneBadge>}
          </span>
          {owner.name && owner.email && (
            <span className="truncate font-body text-xs text-muted-foreground">{owner.email}</span>
          )}
          <span data-i18n="barter.trustScore" className="font-body text-xs text-muted-foreground">
            {t('barter.trustScore', { count: owner.trades })}
            {owner.city ? ' \u00b7 ' + owner.city : ''}
          </span>
        </span>
        <Button variant="ghost" size="sm" onClick={() => q.openProfile(owner.id)} data-i18n="admin.viewProfile">
          {t('admin.viewProfile')}
        </Button>
      </div>

      {/* The pattern, in one row: a count is what separates a mistake from a
          habit, and none of it was visible before. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/[0.14] pt-2">
        <span data-i18n="admin.statItems" className="font-body text-xs text-muted-foreground">
          {t('admin.statItems', { count: owner.itemsTotal })}
        </span>
        {owner.signedUpAt && (
          <span data-i18n="admin.statJoined" className="font-body text-xs text-muted-foreground">
            {t('admin.statJoined', { date: new Date(owner.signedUpAt).toLocaleDateString() })}
          </span>
        )}
        {owner.itemsHidden > 0 && (
          <span data-i18n="admin.statHidden" className="font-body text-xs text-accent-foreground">
            {t('admin.statHidden', { count: owner.itemsHidden })}
          </span>
        )}
        {owner.blockedBy > 0 && (
          <span data-i18n="admin.statBlocked" className="font-body text-xs text-destructive">
            {t('admin.statBlocked', { count: owner.blockedBy })}
          </span>
        )}
        {owner.reportsAbout > 0 && (
          <span data-i18n="admin.statReports" className="font-body text-xs text-destructive">
            {t('admin.statReports', { count: owner.reportsAbout })}
          </span>
        )}
      </div>

      {suspended ? (
        <Button size="sm" disabled={q.suspending} onClick={() => q.reinstateUser(owner.id)} data-i18n="admin.reinstate">
          {t('admin.reinstate')}
        </Button>
      ) : confirm ? (
        <div className="flex flex-col gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('admin.suspendReason')}
            maxLength={200}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={q.suspending}
              onClick={() => {
                q.suspendUser(owner.id, reason)
                setConfirm(false)
                setReason('')
              }}
              data-i18n="admin.suspendConfirm"
            >
              {t('admin.suspendConfirm')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)} data-i18n="common.cancel">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-destructive"
          onClick={() => setConfirm(true)}
          data-i18n="admin.suspend"
        >
          {t('admin.suspend')}
        </Button>
      )}
    </div>
  )
}

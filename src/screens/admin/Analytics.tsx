import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { AppShell } from '@/components/shell/AppShell'
import { PageBody } from '@/components/shell/PageBody'
import { PageHeader, PageTabs } from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Icon } from '@/components/ui/icon'
import { ToneBadge } from '@/components/ui/tone-badge'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { EVENT_NAMES } from '@/lib/analytics'
import { MIN_PER_ARM, useAnalytics, type Pane } from './useAnalytics'

const PANES: Pane[] = ['funnel', 'events', 'experiments']

/** Back office, second queue: what people actually do.
 *
 *  Sibling of ReportQueue -- same shell, same staff gate, same tab strip. The
 *  numbers all come from SECURITY DEFINER RPCs that check is_staff in SQL, so
 *  this screen is a renderer and never a security boundary.
 */
export function Analytics() {
  const a = useAnalytics()
  const { t } = useT()
  const navigate = useNavigate()

  if (a.checkingStaff) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center p-8">
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!a.isStaff) {
    return (
      <AppShell>
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 px-4 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-secondary">
            <Icon name="ShieldAlert" size={24} className="text-muted-foreground" />
          </span>
          <T as="h1" k="admin.noAccessTitle" className="font-display text-h3 text-foreground" />
          <T as="p" k="admin.noAccessBody" className="font-body text-body text-muted-foreground" />
          <Button variant="ghost" onClick={() => navigate('/hunt')} data-i18n="common.back">
            {t('common.back')}
          </Button>
        </div>
      </AppShell>
    )
  }

  const top = a.funnel[0]?.users ?? 0

  return (
    <AppShell>
      <PageBody variant="wide">
        <PageHeader
          title="analytics.title"
          subtitle="analytics.subtitle"
          tabs={
            <PageTabs
              tabs={PANES.map((p) => ({ id: p, label: `analytics.tab_${p}` }))}
              value={a.pane}
              onChange={a.setPane}
            />
          }
        />

        {/* ── Funnel ─────────────────────────────────────────────────── */}
        {a.pane === 'funnel' && (
          <div className="flex flex-col gap-6">
            {a.retention && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile value={a.retention.dau} label="analytics.dau" />
                <Tile value={a.retention.wau} label="analytics.wau" />
                <Tile value={a.retention.mau} label="analytics.mau" />
                <Tile value={a.retention.streak_2plus} label="analytics.streaks" />
              </div>
            )}

            <section className="rounded-card border border-border/[0.14] bg-card p-5">
              <T as="h2" k="analytics.funnelTitle" className="font-display text-h3 text-foreground" />
              <T as="p" k="analytics.funnelHelp" className="mb-4 font-body text-sm text-muted-foreground" />

              <div className="flex flex-col gap-2.5">
                {a.funnel.map((s, i) => {
                  const prev = i > 0 ? a.funnel[i - 1].users : null
                  // Change against the step before, not against the top: a
                  // funnel that only ever shows "% of signups" hides WHICH
                  // step is the leak.
                  //
                  // A step can GO UP. These are per-step user sets, not one
                  // cohort walking through in order -- someone can match
                  // without ever swiping, because the other person made the
                  // offer. Showing only losses left those steps blank, which
                  // read as a rendering bug; the sign is drawn either way,
                  // red for a loss and quiet for a gain.
                  const delta = prev != null ? s.users - prev : 0
                  const pct = top > 0 ? Math.round((s.users / top) * 100) : 0
                  return (
                    <div key={s.step} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          data-i18n={`analytics.step_${s.step}`}
                          className="font-body text-sm text-foreground"
                        >
                          {t(`analytics.step_${s.step}`)}
                        </span>
                        <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-foreground">
                          {s.users}
                          {delta !== 0 && (
                            <span
                              className={cn(
                                'ml-2 font-body text-xs font-normal',
                                delta < 0 ? 'text-destructive' : 'text-muted-foreground',
                              )}
                            >
                              {delta < 0 ? `−${-delta}` : `+${delta}`}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-pill bg-secondary">
                        <div
                          className="h-full rounded-pill bg-primary transition-[width] duration-slow ease-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-card border border-border/[0.14] bg-card p-5">
              <T as="h2" k="analytics.activityTitle" className="mb-4 font-display text-h3 text-foreground" />
              <Spark rows={a.activity} />
            </section>
          </div>
        )}

        {/* ── Events ─────────────────────────────────────────────────── */}
        {a.pane === 'events' && (
          <section className="rounded-card border border-border/[0.14] bg-card p-5">
            {a.events.length === 0 ? (
              <T as="p" k="analytics.noEvents" className="font-body text-sm text-muted-foreground" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/[0.14]">
                    <Th k="analytics.colEvent" />
                    <Th k="analytics.colTotal" right />
                    <Th k="analytics.colPeople" right />
                  </tr>
                </thead>
                <tbody>
                  {a.events.map((e) => (
                    <tr key={e.name} className="border-b border-border/[0.08] last:border-0">
                      {/* An event name is data from the log, not copy. */}
                      <td className="py-2.5 font-body text-sm text-foreground">{e.name}</td>
                      <td className="py-2.5 text-right font-body text-sm tabular-nums text-foreground">{e.total}</td>
                      <td className="py-2.5 text-right font-body text-sm tabular-nums text-muted-foreground">{e.users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── Experiments ────────────────────────────────────────────── */}
        {a.pane === 'experiments' && (
          <div className="flex flex-col gap-4">
            <NewExperiment onCreate={a.create} error={a.createError} busy={a.saving} />

            {a.experiments.length === 0 && (
              <section className="rounded-card border border-border/[0.14] bg-card p-5">
                <T as="p" k="analytics.noExperiments" className="font-body text-sm text-muted-foreground" />
              </section>
            )}

            {a.experiments.map((e) => {
              const selected = e.key === a.activeKey
              return (
                <section
                  key={e.key}
                  className="rounded-card border border-border/[0.14] bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Experiment key and goal are data, not copy. */}
                      <h2 className="font-display text-h3 text-foreground">{e.key}</h2>
                      <p className="font-body text-sm text-muted-foreground">
                        <T as="span" k="analytics.goalIs" />{' '}
                        <span className="text-foreground">{e.goal_event}</span>
                        {' · '}
                        <T as="span" k="analytics.splitIs" values={{ pct: e.split }} />
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ToneBadge tone={e.status === 'running' ? 'green' : 'quiet'}>
                        {t(`analytics.status_${e.status}`)}
                      </ToneBadge>
                      {e.status !== 'running' ? (
                        <Button
                          size="sm"
                          disabled={a.saving}
                          onClick={() => a.setStatus(e.key, 'running')}
                        >
                          <T as="span" k="analytics.start" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={a.saving}
                          onClick={() => a.setStatus(e.key, 'stopped')}
                        >
                          <T as="span" k="analytics.stop" />
                        </Button>
                      )}
                      {e.status !== 'running' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={a.saving}
                          aria-label={t('analytics.remove')}
                          onClick={() => a.remove(e.key)}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <SplitControl
                    value={e.split}
                    busy={a.saving}
                    onChange={(v) => a.setSplit(e.key, v)}
                  />

                  {!selected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 self-start"
                      onClick={() => a.setSelectedKey(e.key)}
                    >
                      <T as="span" k="analytics.seeResults" />
                    </Button>
                  ) : (
                    <Results rows={a.results} />
                  )}
                </section>
              )
            })}
          </div>
        )}
      </PageBody>
    </AppShell>
  )
}

/** Create an experiment without touching SQL.
 *
 *  The goal is picked from EVENT_NAMES rather than typed: a goal that does not
 *  match an event the app actually fires produces a test that can never
 *  convert, and the number it shows -- 0% on both arms -- looks like a real
 *  result rather than a typo.
 */
function NewExperiment({
  onCreate,
  error,
  busy,
}: {
  onCreate: (i: { key: string; goal_event: string; split: number; description: string }) => void
  error: string | null
  busy: boolean
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [goal, setGoal] = useState<string>(EVENT_NAMES[0])
  const [split, setSplit] = useState(50)
  const [description, setDescription] = useState('')

  if (!open) {
    return (
      <Button variant="ghost" className="self-start" onClick={() => setOpen(true)}>
        <Icon name="Plus" size={16} />
        <T as="span" k="analytics.newExperiment" />
      </Button>
    )
  }

  const submit = () => {
    if (!key.trim()) return
    onCreate({ key, goal_event: goal, split, description })
    setKey('')
    setDescription('')
    setOpen(false)
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border/[0.14] bg-card p-5">
      <T as="h2" k="analytics.newExperiment" className="font-display text-h3 text-foreground" />

      <label className="flex flex-col gap-1">
        <T as="span" k="analytics.keyLabel" className="font-body text-sm text-muted-foreground" />
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="deck_empty_cta"
          maxLength={64}
        />
        <T as="span" k="analytics.keyHelp" className="font-body text-xs text-muted-foreground" />
      </label>

      <label className="flex flex-col gap-1">
        <T as="span" k="analytics.goalLabel" className="font-body text-sm text-muted-foreground" />
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="min-h-hit rounded-card-sm border border-border/[0.14] bg-background px-3 font-body text-sm text-foreground"
        >
          {EVENT_NAMES.map((n) => (
            /* Event names are identifiers the code fires, not copy. */
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <T as="span" k="analytics.whatLabel" className="font-body text-sm text-muted-foreground" />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('analytics.whatPlaceholder')}
          maxLength={200}
        />
      </label>

      <SplitControl value={split} busy={busy} onChange={setSplit} />

      {error && (
        <p role="alert" className="font-body text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button disabled={busy || !key.trim()} onClick={submit}>
          <T as="span" k="analytics.createIt" />
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          <T as="span" k="common.cancel" />
        </Button>
      </div>
    </section>
  )
}

/** How many people see B.
 *
 *  Safe to move on a running test -- assignment is hashed, so there is no
 *  stored allocation to rewrite. Some people do cross arms when it moves,
 *  which is fine for ramping a rollout and dishonest for chasing a result;
 *  the helper text says so rather than leaving it to be discovered.
 */
function SplitControl({
  value,
  onChange,
  busy,
}: {
  value: number
  onChange: (v: number) => void
  busy: boolean
}) {
  const { t } = useT()
  const [local, setLocal] = useState(value)

  // Follow the server when it changes underneath (another tab, a refetch),
  // but never while dragging -- that would fight the thumb.
  useEffect(() => setLocal(value), [value])

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <T as="span" k="analytics.splitLabel" className="font-body text-sm text-muted-foreground" />
        <span className="font-display text-sm font-semibold tabular-nums text-foreground">
          {t('analytics.splitValue', { a: 100 - local, b: local })}
        </span>
      </div>
      <Slider
        value={[local]}
        min={0}
        max={100}
        step={5}
        disabled={busy}
        onValueChange={(v) => setLocal(v[0] ?? 0)}
        // Commit on release, not on every frame: dragging 0 -> 50 would
        // otherwise be ten writes and ten refetches.
        onValueCommit={(v) => onChange(v[0] ?? 0)}
        aria-label={t('analytics.splitLabel')}
      />
    </div>
  )
}

function Tile({ value, label }: { value: number; label: string }) {
  const { t } = useT()
  return (
    <div className="rounded-card border border-border/[0.14] bg-card p-4">
      <span className="block font-display text-2xl font-bold leading-none tabular-nums text-foreground">
        {value}
      </span>
      <span
        data-i18n={label}
        className="mt-1 block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
      >
        {t(label)}
      </span>
    </div>
  )
}

function Th({ k, right = false }: { k: string; right?: boolean }) {
  const { t } = useT()
  return (
    <th
      data-i18n={k}
      className={cn(
        'pb-2 font-display text-caption uppercase tracking-[0.12em] text-muted-foreground',
        right ? 'text-right' : 'text-left',
      )}
    >
      {t(k)}
    </th>
  )
}

/** Daily totals as bars. Deliberately not a charting library: four series of
 *  at most 30 points does not justify the bundle, and the scale rule below is
 *  the only thing that actually matters. */
function Spark({ rows }: { rows: { day: string; swipes: number; offers: number; items: number; events: number }[] }) {
  const { t } = useT()
  if (rows.length === 0) {
    return <T as="p" k="analytics.noActivity" className="font-body text-sm text-muted-foreground" />
  }
  // One shared maximum across all four series, so the bars are comparable to
  // each other. Scaling each series to its own peak would draw 2 offers the
  // same height as 40 swipes.
  const max = Math.max(1, ...rows.flatMap((r) => [r.swipes, r.offers, r.items, r.events]))
  return (
    <div className="flex items-end gap-1 overflow-x-auto">
      {rows.map((r) => (
        <div key={r.day} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
          <div className="flex h-24 w-full items-end justify-center gap-[2px]">
            <Bar v={r.swipes} max={max} className="bg-primary" title={`${r.day} · ${r.swipes} swipes`} />
            <Bar v={r.offers} max={max} className="bg-accent" title={`${r.day} · ${r.offers} offers`} />
            <Bar v={r.items} max={max} className="bg-foreground/30" title={`${r.day} · ${r.items} items`} />
          </div>
          <span className="font-body text-[10px] tabular-nums text-muted-foreground">
            {r.day.slice(8, 10)}
          </span>
        </div>
      ))}
      <span className="sr-only">{t('analytics.activityTitle')}</span>
    </div>
  )
}

function Bar({ v, max, className, title }: { v: number; max: number; className: string; title: string }) {
  return (
    <span
      title={title}
      // min-height 2px on a non-zero value: a bar rounded to nothing looks
      // identical to no activity, and those are different facts.
      style={{ height: v === 0 ? '1px' : `max(2px, ${(v / max) * 100}%)` }}
      className={cn('w-[4px] shrink-0 rounded-pill', v === 0 ? 'bg-border' : className)}
    />
  )
}

/** Per-variant conversion, with an honest verdict.
 *
 *  The verdict line is the reason this component exists rather than two
 *  percentages side by side: two raw numbers invite a winner to be called
 *  from noise, which is the most common way A/B testing makes a product
 *  worse. Until both arms clear MIN_PER_ARM it says so plainly.
 */
function Results({ rows }: { rows: { variant: string; exposed: number; converted: number; conversion: number }[] }) {
  const { t } = useT()
  const a = rows.find((r) => r.variant === 'a')
  const b = rows.find((r) => r.variant === 'b')
  const enough = (a?.exposed ?? 0) >= MIN_PER_ARM && (b?.exposed ?? 0) >= MIN_PER_ARM

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div key={r.variant} className="rounded-card-sm border border-border/[0.14] p-3">
            <span
              data-i18n={r.variant === 'a' ? 'analytics.variantA' : 'analytics.variantB'}
              className="block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            >
              {t(r.variant === 'a' ? 'analytics.variantA' : 'analytics.variantB')}
            </span>
            <span className="mt-1 block font-display text-2xl font-bold tabular-nums text-foreground">
              {r.conversion}%
            </span>
            <span className="font-body text-xs text-muted-foreground">
              {t('analytics.ofExposed', { converted: r.converted, exposed: r.exposed })}
            </span>
          </div>
        ))}
      </div>

      <p
        data-i18n={enough ? 'analytics.verdictReady' : 'analytics.verdictEarly'}
        className={cn(
          'rounded-card-sm px-3 py-2 font-body text-sm',
          enough ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        {enough
          ? t('analytics.verdictReady')
          : t('analytics.verdictEarly', { min: MIN_PER_ARM })}
      </p>
    </div>
  )
}

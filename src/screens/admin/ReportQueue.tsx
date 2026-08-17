import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Badge, Tag } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { SwapPair } from '@/components/swap/SwapPair'
import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/utils'

type Status = 'open' | 'reviewing' | 'resolved'

/** Back-office for F5. Internal only - route it behind a staff check, not a
 *  feature flag. Same components as the product so the two never drift.
 *  A person decides every outcome; nothing here is automated.
 */
export function ReportQueue() {
  const [status, setStatus] = useState<Status>('open')
  const [selected, setSelected] = useState<string | null>('r1')
  const [note, setNote] = useState('')

  // TODO(api): getReports({ status }) - joins swap, both people, evidence paths
  const reports = [
    {
      id: 'r1',
      reason: 'not_as_described',
      status: 'open' as Status,
      filedBy: { id: 'u1', name: 'Jonas D.', rating: 4.6, swapCount: 12 },
      about: { id: 'u2', name: 'Ana P.', rating: 4.1, swapCount: 7 },
      note: 'The lens mount was cracked underneath the grip tape.',
      evidence: ['hsl(var(--illo-terracotta))', 'hsl(var(--illo-denim))'],
      when: '2 hours ago',
      priorReports: 1,
    },
    {
      id: 'r2',
      reason: 'no_show',
      status: 'open' as Status,
      filedBy: { id: 'u3', name: 'Tom R.', rating: 4.9, swapCount: 22 },
      about: { id: 'u4', name: 'Lee M.', rating: 3.8, swapCount: 3 },
      note: 'Waited 40 minutes at Rose Market.',
      evidence: [],
      when: 'Yesterday',
      priorReports: 3,
    },
  ]

  const shown = reports.filter((r) => r.status === status)
  const current = shown.find((r) => r.id === selected) ?? shown[0]

  return (
    <AppShell hideTabBar>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        <div className="mb-4 flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold lg:text-h2">Reports</h1>
          <span className="font-body text-sm text-muted-foreground">
            Internal. Freeze first, decide slowly, tell both sides plainly.
          </span>
        </div>

        <div className="mb-4 flex gap-2">
          {(['open', 'reviewing', 'resolved'] as Status[]).map((s) => (
            <Tag key={s} active={status === s} onSelect={() => setStatus(s)}>
              {s}
            </Tag>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState title="Nothing waiting" body="Every report in this state has been dealt with." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* List */}
            <ul className="flex flex-col gap-2">
              {shown.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r.id)}
                    className={cn(
                      'w-full rounded-sm p-3 text-left transition-colors duration-fast ease-brand',
                      current?.id === r.id
                        ? 'border-2 border-primary bg-popover'
                        : 'border border-border/[0.14] bg-card hover:bg-popover',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex-1 truncate font-display text-[15px] font-semibold">
                        {r.reason.replace(/_/g, ' ')}
                      </span>
                      {r.priorReports > 1 && <Badge tone="terracotta">{r.priorReports} prior</Badge>}
                    </span>
                    <span className="mt-1 block truncate font-body text-sm text-muted-foreground">
                      {r.filedBy.name} about {r.about.name} {'\u00b7'} {r.when}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Detail */}
            {current && (
              <section className="flex flex-col gap-4 rounded border border-border/[0.14] bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-h3 capitalize">{current.reason.replace(/_/g, ' ')}</h2>
                  <Badge tone={current.status === 'open' ? 'brass' : 'quiet'}>{current.status}</Badge>
                  <span className="ml-auto font-body text-sm text-muted-foreground">{current.when}</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-sm bg-popover p-3">
                    <span className="mb-2 block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                      Filed by
                    </span>
                    <OwnerRow person={current.filedBy} />
                  </div>
                  <div className="rounded-sm bg-popover p-3">
                    <span className="mb-2 block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                      About
                    </span>
                    <OwnerRow person={current.about} />
                  </div>
                </div>

                <div className="rounded-sm border border-border/[0.14] p-3">
                  <SwapPair
                    mine={{ id: 'a', title: 'Wool scarf', photoColor: 'hsl(var(--illo-denim))' }}
                    theirs={{ id: 'b', title: 'Pentax ME Super', photoColor: 'hsl(var(--illo-terracotta))' }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                    What they told us
                  </span>
                  <p className="font-body text-[15px] leading-relaxed">{current.note}</p>
                  {current.evidence.length > 0 && (
                    <div className="mt-1 flex gap-2">
                      {current.evidence.map((c, i) => (
                        <span key={i} className="h-20 w-20 rounded-sm" style={{ background: c }} />
                      ))}
                    </div>
                  )}
                </div>

                <Textarea
                  label="Internal note"
                  placeholder="What we saw in the thread, and what we told each side."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 border-t border-border/[0.14] pt-4">
                  <Button>Unfreeze and let it finish</Button>
                  <Button variant="accent">Cancel the swap, relist both</Button>
                  <Button variant="ghost">Warn {current.about.name}</Button>
                  <Button variant="ghost">Suspend {current.about.name}</Button>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  Both people get one plain message with the outcome. Ratings for this swap stay hidden until it
                  closes.
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

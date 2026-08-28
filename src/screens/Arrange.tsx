import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AppShell } from '@/components/shell/AppShell'
import { T, useT } from '@/i18n/T'
import { ToneBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { Field } from '@/components/ui/field'
import { cn } from '@/lib/utils'

/** S3 / F4 - T4 guided step. Safety is a default, not a warning banner:
 *  public spots first, walking distance balanced, addresses never suggested.
 */
type Mode = 'meet' | 'post'

export function Arrange() {
  const { t } = useT()
  const { swapId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('meet')
  const [spot, setSpot] = useState('rose-market')
  const [slot, setSlot] = useState('sat-11')
  const [customSpot, setCustomSpot] = useState('')

  // TODO(api): getMeetupSuggestions(swapId) - public places, balanced walk
  const spots = [
    { id: 'rose-market', name: 'Rose Market, north entrance', meta: 'Busy until 6pm \u00b7 900 m from you, 1.2 km from Mira', even: true },
    { id: 'library', name: 'Central library caf\u00e9', meta: 'Open till 8pm \u00b7 indoor, quiet', even: false },
  ]
  const slots = [
    { id: 'sat-11', label: 'Sat 11:00' },
    { id: 'sat-16', label: 'Sat 16:00' },
    { id: 'sun-12', label: 'Sun 12:00' },
  ]
  const chosenSlot = slots.find((s) => s.id === slot)

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 py-6">
        <div className="flex flex-col gap-2.5">
          <div className="h-2 overflow-hidden rounded-pill bg-secondary">
            <div className="h-full w-2/3 rounded-pill bg-primary" />
          </div>
          <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
            Step 2 of 3
          </span>
        </div>

        <h1 className="font-display text-h2 leading-tight text-foreground">
          Where will you two meet?
        </h1>

        <div className="flex gap-3">
          {(['meet', 'post'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                'flex flex-1 flex-col gap-1.5 rounded p-4 text-left transition-colors duration-fast ease-brand',
                mode === m ? 'border-2 border-primary bg-popover' : 'border border-border/[0.14] bg-card',
              )}
            >
              <span className="font-display text-base font-bold">{m === 'meet' ? 'Meet in person' : 'Post it'}</span>
              <span className="font-body text-sm text-muted-foreground">
                {m === 'meet'
                  ? '2 km apart - most swaps this close happen face to face.'
                  : 'Prepaid label, tracking in the thread. Both send on the same day.'}
              </span>
            </button>
          ))}
        </div>

        {mode === 'meet' && (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                Suggested public spots
              </span>
              {spots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSpot(s.id)}
                  aria-pressed={spot === s.id}
                  className={cn(
                    'flex min-h-[64px] items-center gap-3 rounded-sm p-3 text-left transition-colors duration-fast ease-brand',
                    spot === s.id ? 'border-2 border-primary bg-popover' : 'border border-border/[0.14] bg-card',
                  )}
                >
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-illo-sage" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-semibold">{s.name}</span>
                    <span className="block truncate font-body text-sm text-muted-foreground">{s.meta}</span>
                  </span>
                  {s.even && <ToneBadge tone="green">{t('arrange.evenWalk')}</ToneBadge>}
                </button>
              ))}
              <Field
                placeholder="arrange.typePlace"
                value={customSpot}
                onChange={(e) => setCustomSpot(e.target.value)}
                hint="We never suggest home addresses, and the thread strips them if typed."
              />
            </div>

            <div className="flex flex-col gap-2">
              <T as="span" k="arrange.whenLabel" className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <Chip key={s.id} active={slot === s.id} onClick={() => setSlot(s.id)}>
                    {s.label}
                  </Chip>
                ))}
                <Chip>{t('arrange.anotherTime')}</Chip>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-border/[0.14] pt-4">
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate('/swaps/' + swapId)}
          >
            {mode === 'meet' ? 'Propose ' + (chosenSlot?.label ?? 'a time') : 'Send my label'}
          </Button>
          <p className="font-body text-sm text-muted-foreground">
            Mira gets one tap to accept or suggest another.
          </p>
        </div>
      </div>
    </AppShell>
  )
}

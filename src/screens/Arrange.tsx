import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { AppShell } from '@/components/shell/AppShell'
import { T, useT } from '@/i18n/T'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { Field } from '@/components/ui/field'
import { sendMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** S3 / F4 - T4 guided step. Safety is a default, not a warning banner:
 *  public spots first, addresses never suggested.
 *
 *  This screen used to show a hardcoded list of spots ("Rose Market",
 *  "1.2 km from Mira") that looked real but was invented. The `meeting_spots`
 *  table those suggestions were meant to come from does not exist — migration
 *  005 creates `meetups` but never created it — so rather than fabricate
 *  places or call an endpoint that would 500, the person names the place
 *  themselves. Suggestions can come back the day the table does.
 */
type Mode = 'meet' | 'post'

/** The next few plausible meeting times, derived from today rather than
 *  hardcoded, so the options are never in the past. */
function useSlots(lang: string) {
  return useMemo(() => {
    const fmtDay = new Intl.DateTimeFormat(lang, { weekday: 'short' })
    const at = (daysAhead: number, hour: number) => {
      const d = new Date()
      d.setDate(d.getDate() + daysAhead)
      d.setHours(hour, 0, 0, 0)
      return d
    }
    // Tomorrow, then the two days after: enough choice without a date picker.
    return [at(1, 11), at(2, 16), at(3, 12)].map((d) => ({
      id: d.toISOString(),
      label: `${fmtDay.format(d)} ${String(d.getHours()).padStart(2, '0')}:00`,
    }))
  }, [lang])
}

export function Arrange() {
  const { t, lang } = useT()
  const { swapId } = useParams()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)

  const slots = useSlots(lang)
  const [mode, setMode] = useState<Mode>('meet')
  const [place, setPlace] = useState('')
  const [slot, setSlot] = useState(slots[0]?.id ?? '')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  const chosenSlot = slots.find((s) => s.id === slot)
  const canPropose = mode === 'post' || place.trim().length > 0

  /** Proposing is a message in the thread, not a silent state change: the
   *  other person has to be able to read it and answer in their own words. */
  const propose = async () => {
    if (!swapId || !userId || sending) return
    if (mode === 'meet' && !place.trim()) return setFailed(false)

    setSending(true)
    setFailed(false)

    const body =
      mode === 'meet'
        ? t('arrange.proposedMessage', {
            place: place.trim(),
            when: chosenSlot?.label ?? t('arrange.proposeTime'),
          })
        : t('arrange.postMessage')

    const { error } = await sendMessage(swapId, userId, body, crypto.randomUUID())
    setSending(false)

    if (error) {
      console.error('[arrange] propose failed', error)
      setFailed(true)
      return
    }
    navigate('/swaps/' + swapId)
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 py-6">
        <header className="flex flex-col gap-2.5">
          <div className="h-2 overflow-hidden rounded-pill bg-secondary">
            <div className="h-full w-2/3 rounded-pill bg-primary" />
          </div>
          <T
            as="span"
            k="common.stepOf"
            values={{ current: 2, total: 3 }}
            className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
          />
        </header>

        <T as="h1" k="arrange.heading" className="font-display text-h2 leading-tight text-foreground" />

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
              <T
                as="span"
                k={m === 'meet' ? 'arrange.modeMeet' : 'arrange.modePost'}
                className="font-display text-base font-bold"
              />
              <T
                as="span"
                k={m === 'meet' ? 'arrange.modeMeetHelp' : 'arrange.modePostHelp'}
                className="font-body text-sm text-muted-foreground"
              />
            </button>
          ))}
        </div>

        {mode === 'meet' && (
          <>
            <div className="flex flex-col gap-2">
              <T
                as="span"
                k="arrange.placeLabel"
                className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
              />
              <Field
                placeholder="arrange.placePlaceholder"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                help="arrange.placeHelp"
              />
            </div>

            <div className="flex flex-col gap-2">
              <T
                as="span"
                k="arrange.whenLabel"
                className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
              />
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <Chip key={s.id} active={slot === s.id} onClick={() => setSlot(s.id)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-border/[0.14] pt-4">
          <Button size="lg" fullWidth onClick={() => void propose()} disabled={!canPropose || sending}>
            {sending
              ? t('common.loading')
              : mode === 'meet'
                ? t('arrange.proposeAction', { when: chosenSlot?.label ?? t('arrange.proposeTime') })
                : t('arrange.sendLabel')}
          </Button>
          {failed && (
            <T as="p" k="arrange.proposeFailed" className="font-body text-sm text-destructive" role="alert" />
          )}
          {!canPropose && (
            <T as="p" k="arrange.needPlace" className="font-body text-sm text-muted-foreground" />
          )}
          <T as="p" k="arrange.oneTap" className="font-body text-sm text-muted-foreground" />
          <T as="p" k="arrange.safetyBody" className="font-body text-sm text-muted-foreground" />
        </div>
      </div>
    </AppShell>
  )
}

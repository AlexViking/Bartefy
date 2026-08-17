import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { PhotoWell, PhotoWellGrid } from '@/components/ui/photo-well'
import { cn } from '@/lib/utils'

/** F5 - cancel, no-show, not-as-described and unsafe behind one door.
 *  Every reason states its consequence before it is picked. Tone drops all
 *  playfulness here: plain and reassuring, per the voice rules.
 */
export type TroubleReason = 'changed_mind' | 'no_show' | 'not_as_described' | 'unsafe'

const REASONS: { id: TroubleReason; title: string; consequence: string }[] = [
  {
    id: 'changed_mind',
    title: 'I changed my mind',
    consequence: 'We cancel it and both finds go back into the hunt.',
  },
  {
    id: 'no_show',
    title: 'They did not show up',
    consequence: 'You can reschedule once, or close it with a note only we see.',
  },
  {
    id: 'not_as_described',
    title: 'It was not as described',
    consequence: 'Add a photo or two. We freeze the swap and a person reads the thread.',
  },
  {
    id: 'unsafe',
    title: 'I felt unsafe',
    consequence: 'We block them immediately. You do not have to explain anything to them.',
  },
]

export function TroubleSheet({
  open,
  onOpenChange,
  otherName,
  presetReason,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  otherName: string
  presetReason?: TroubleReason
  onSubmit?: (reason: TroubleReason, note: string, block: boolean) => void
}) {
  const [reason, setReason] = useState<TroubleReason | null>(presetReason ?? null)
  const [step, setStep] = useState<1 | 2>(presetReason ? 2 : 1)
  const [note, setNote] = useState('')
  const [block, setBlock] = useState(false)

  const needsEvidence = reason === 'not_as_described'

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="What happened with this swap?"
      description="Nothing here is public, and nothing is decided by a machine."
      footer={
        step === 1 ? (
          <div className="flex items-center gap-2.5">
            <Button fullWidth disabled={!reason} onClick={() => setStep(2)}>
              Continue
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Never mind
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              onClick={() => reason && onSubmit?.(reason, note, block)}
            >
              {reason === 'changed_mind' ? 'Cancel the swap' : 'Send to us'}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setStep(1)}>
              Go back
            </Button>
          </div>
        )
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              aria-pressed={reason === r.id}
              className={cn(
                'flex flex-col gap-0.5 rounded-sm p-3.5 text-left transition-colors duration-fast ease-brand',
                reason === r.id ? 'border-2 border-primary bg-popover' : 'border border-border/[0.14] bg-card',
              )}
            >
              <span className="font-display text-[15px] font-semibold">{r.title}</span>
              <span className="font-body text-sm text-muted-foreground">{r.consequence}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {needsEvidence && (
            <div className="flex flex-col gap-2">
              <span className="font-display text-base font-semibold">What did you get instead?</span>
              <PhotoWellGrid columns={3}>
                <PhotoWell state="ready" swatch="hsl(var(--illo-terracotta))" onRemove={() => {}} />
                <PhotoWell state="empty" />
                <PhotoWell state="empty" />
              </PhotoWellGrid>
            </div>
          )}

          <Textarea
            label="Anything we should know?"
            placeholder="The lens mount was cracked."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-col gap-2 rounded-sm border border-border/[0.14] bg-popover p-3.5">
            <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
              What happens next
            </span>
            <p className="font-body text-[15px] leading-relaxed">
              The swap freezes tonight. {otherName} sees that you raised something, not what you wrote. We reply
              within two days, and neither rating counts until then.
            </p>
          </div>

          <label className="flex items-center gap-2.5 font-body text-[15px]">
            <input
              type="checkbox"
              checked={block}
              onChange={(e) => setBlock(e.target.checked)}
              className="h-5 w-5 rounded-sm accent-[hsl(var(--primary))]"
            />
            Also stop {otherName} from messaging me
          </label>
        </div>
      )}
    </ResponsiveSheet>
  )
}

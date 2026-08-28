import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { PhotoWell, PhotoWellGrid } from '@/components/ui/photo-well'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** F5 - cancel, no-show, not-as-described and unsafe behind one door.
 *  Every reason states its consequence before it is picked. Tone drops all
 *  playfulness here: plain and reassuring, per the voice rules.
 */
export type TroubleReason = 'changed_mind' | 'no_show' | 'not_as_described' | 'unsafe'

/** Title and consequence are translation keys, not copy. Every reason states
 *  what will happen before it is picked. */
const REASONS: { id: TroubleReason; title: string; consequence: string }[] = [
  {
    id: 'changed_mind',
    title: 'trouble.reasonChangedMind',
    consequence: 'trouble.consequenceChangedMind',
  },
  { id: 'no_show', title: 'trouble.reasonNoShow', consequence: 'trouble.consequenceNoShow' },
  {
    id: 'not_as_described',
    title: 'trouble.reasonNotAsDescribed',
    consequence: 'trouble.consequenceNotAsDescribed',
  },
  { id: 'unsafe', title: 'trouble.reasonUnsafe', consequence: 'trouble.consequenceUnsafe' },
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
  const { t } = useT()
  const [reason, setReason] = useState<TroubleReason | null>(presetReason ?? null)
  const [step, setStep] = useState<1 | 2>(presetReason ? 2 : 1)
  const [note, setNote] = useState('')
  const [block, setBlock] = useState(false)

  const needsEvidence = reason === 'not_as_described'

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="trouble.heading"
      description="trouble.subtitle"
      footer={
        step === 1 ? (
          <div className="flex items-center gap-2.5">
            <Button fullWidth disabled={!reason} onClick={() => setStep(2)} data-i18n="trouble.continue">
              {t('trouble.continue')}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} data-i18n="trouble.neverMind">
              {t('trouble.neverMind')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              onClick={() => reason && onSubmit?.(reason, note, block)}
            >
              {reason === 'changed_mind' ? t('trouble.cancelSwap') : t('trouble.sendToUs')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setStep(1)} data-i18n="trouble.goBack">
              {t('trouble.goBack')}
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
              <T as="span" k={r.title} className="font-display text-[15px] font-semibold" />
              <T as="span" k={r.consequence} className="font-body text-sm text-muted-foreground" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {needsEvidence && (
            <div className="flex flex-col gap-2">
              <T as="span" k="trouble.evidenceLabel" className="font-display text-base font-semibold" />
              <PhotoWellGrid columns={3}>
                <PhotoWell state="empty" />
                <PhotoWell state="empty" />
                <PhotoWell state="empty" />
              </PhotoWellGrid>
            </div>
          )}

          <TextField
            label="trouble.noteLabel"
            placeholder="trouble.notePlaceholder"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-col gap-2 rounded-sm border border-border/[0.14] bg-popover p-3.5">
            <T
              as="span"
              k="trouble.nextTitle"
              className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            />
            <T
              as="p"
              k="trouble.nextBody"
              values={{ name: otherName }}
              className="font-body text-[15px] leading-relaxed"
            />
          </div>

          {/* shadcn's Checkbox, not a raw input — one UI library. */}
          <label className="flex items-center gap-2.5 font-body text-[15px]">
            <Checkbox checked={block} onCheckedChange={(v) => setBlock(v === true)} />
            {t('trouble.blockLabelNamed', { name: otherName })}
          </label>
        </div>
      )}
    </ResponsiveSheet>
  )
}

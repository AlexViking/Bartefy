import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { reportItem } from '@/lib/barter'
import { cn } from '@/lib/utils'

/** Reasons a LISTING is wrong, as opposed to a person behaving badly.
 *  Named for what the reporter saw, never for what a moderator will conclude:
 *  someone flags a photo that does not match, they do not adjudicate fraud. */
const REASONS = ['prohibited', 'photo_mismatch', 'wrong_category', 'spam'] as const

/** Report a find from the deck.
 *
 *  On the card itself, per the scope contract, because the moment you notice a
 *  listing is wrong is the moment you are looking at it. Making someone open
 *  the listing, find a menu and choose "report" means most people simply swipe
 *  past and the listing stays up.
 *
 *  Nothing is hidden automatically. The report is recorded and a human reads
 *  it -- auto-hiding on a single report hands anyone a takedown button.
 */
export function ReportItemSheet({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  /** User data, so it is rendered without a translation key. */
  itemTitle: string
  onDone: () => void
}) {
  const { t } = useT()
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(null)
      setNote('')
      setError(null)
      setSent(false)
    }
  }, [open])

  const submit = async () => {
    if (!reason || busy) return
    setBusy(true)
    setError(null)
    const { error: rpcError } = await reportItem(itemId, reason, note.trim() || undefined)
    setBusy(false)
    if (rpcError) {
      setError(
        rpcError.code === 'P0009' ? 'report.alreadyReported' : 'barter.errorGeneric',
      )
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="report.thanksTitle">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-primary/[0.10]">
            <Icon name="Check" size={26} className="text-primary" />
          </span>
          <T
            as="p"
            k="report.thanksBody"
            className="max-w-[34ch] font-body text-body text-muted-foreground"
          />
          <Button
            onClick={() => {
              onOpenChange(false)
              onDone()
            }}
            data-i18n="common.done"
          >
            {t('common.done')}
          </Button>
        </div>
      </ResponsiveSheet>
    )
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="report.itemTitle"
      footer={
        <div className="flex w-full flex-col gap-2">
          {error && (
            <p data-i18n={error} role="alert" className="text-center font-body text-sm text-destructive">
              {t(error)}
            </p>
          )}
          <Button fullWidth size="lg" disabled={!reason || busy} onClick={submit} data-i18n="report.send">
            {t('report.send')}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)} data-i18n="common.cancel">
            {t('common.cancel')}
          </Button>
        </div>
      }
    >
      {/* The listing's own title, so there is no doubt which find this is
          about after swiping past three more. */}
      <p className="mb-3 font-body text-sm text-muted-foreground">{itemTitle}</p>

      <ul className="flex flex-col gap-2">
        {REASONS.map((r) => (
          <li key={r}>
            <button
              type="button"
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={cn(
                'flex w-full items-center gap-3 rounded-card border-[1.5px] p-3 text-left',
                'transition-colors duration-fast ease-brand',
                reason === r
                  ? 'border-primary bg-primary/[0.08]'
                  : 'border-border/[0.14] bg-card hover:border-primary/40',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-pill border-[1.5px]',
                  reason === r ? 'border-primary bg-primary' : 'border-muted-foreground/50',
                )}
              >
                {reason === r && <Icon name="Check" size={12} className="text-primary-foreground" />}
              </span>
              <span data-i18n={'report.reason_' + r} className="font-body text-body text-foreground">
                {t('report.reason_' + r)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <label className="mt-3 flex flex-col gap-1">
        <T as="span" k="report.noteLabel" className="font-body text-xs text-muted-foreground" />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          placeholder={t('report.notePlaceholder')}
          className={cn(
            'min-h-hit rounded-card border-[1.5px] border-border/[0.14] bg-card px-3',
            'font-body text-body text-foreground placeholder:text-muted-foreground',
            'focus:border-primary focus:outline-none',
          )}
        />
      </label>
    </ResponsiveSheet>
  )
}

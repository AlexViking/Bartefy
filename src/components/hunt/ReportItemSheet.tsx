import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { fileReport } from '@/lib/api'
import { reportItem } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** Reasons a LISTING is wrong. Named for what the reporter saw, never for
 *  what a moderator will conclude: someone flags a photo that does not match,
 *  they do not adjudicate fraud. */
const ITEM_REASONS = ['prohibited', 'photo_mismatch', 'wrong_category', 'spam'] as const

/** Reasons a PERSON is the problem. A separate list because they describe
 *  behaviour rather than a listing, and offering "wrong category" about a
 *  human being makes the whole form feel unserious. */
const USER_REASONS = ['unsafe', 'asked_for_money', 'no_show', 'not_as_described'] as const

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
  ownerId,
  ownerName,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  /** User data, so it is rendered without a translation key. */
  itemTitle: string
  /** The lister. Omit to hide the "this person" tab -- there is no one to
   *  report from a screen that does not know whose listing it is. */
  ownerId?: string
  ownerName?: string
  onDone: () => void
}) {
  const { t } = useT()
  const me = useAuthStore((st) => st.session?.user?.id)
  const [subject, setSubject] = useState<'item' | 'user'>('item')
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setSubject('item')
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
    // Two different endpoints: a listing report is about a row anyone can
    // see, a person report is about conduct and goes through the audited
    // report function.
    const { error: rpcError } =
      subject === 'item'
        ? await reportItem(itemId, reason, note.trim() || undefined)
        : await fileReport({
            fromUser: me ?? '',
            aboutUser: ownerId,
            reason: reason as 'unsafe',
            note: note.trim() || undefined,
          })
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
      title={subject === 'item' ? 'report.itemTitle' : 'report.userTitle'}
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
      {/* Which of the two is being reported. Only shown when there is an
          owner to report -- a tab that cannot be picked is furniture. */}
      {ownerId && (
        <div className="mb-3 flex gap-2">
          {(['item', 'user'] as const).map((s2) => (
            <button
              key={s2}
              type="button"
              onClick={() => {
                setSubject(s2)
                // The reason lists do not overlap, so a reason picked for one
                // subject is meaningless for the other.
                setReason(null)
              }}
              aria-pressed={subject === s2}
              data-i18n={s2 === 'item' ? 'report.thisItem' : 'report.thisUser'}
              className={cn(
                'min-h-hit flex-1 rounded-pill px-3 font-body text-sm transition-colors duration-fast',
                subject === s2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {t(s2 === 'item' ? 'report.thisItem' : 'report.thisUser')}
            </button>
          ))}
        </div>
      )}

      {/* Whose or which. User data either way, so no key on this line. */}
      <p className="mb-3 font-body text-sm text-muted-foreground">
        {subject === 'item' ? itemTitle : ownerName}
      </p>

      <ul className="flex flex-col gap-2">
        {(subject === 'item' ? ITEM_REASONS : USER_REASONS).map((r) => (
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

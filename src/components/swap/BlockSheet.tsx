import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { blockUser } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const REASONS = ['spam', 'rude', 'suspicious', 'other'] as const

/** Block someone, with a reason.
 *
 *  The reason feeds moderation and nothing else. A repeated pattern of
 *  "suspicious" across different blockers is a signal a moderator can act on,
 *  which any single report is not.
 *
 *  The other person is never told -- not that they were blocked, and not why.
 *  Telling them turns a quiet exit into a confrontation, which is exactly what
 *  someone reaching for this button is trying to avoid.
 */
export function BlockSheet({
  open,
  onOpenChange,
  userId,
  userName,
  onBlocked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Who is being blocked. */
  userId: string
  /** Their name. User data, so no translation key on the row. */
  userName: string
  onBlocked: () => void
}) {
  const { t } = useT()
  const me = useAuthStore((s) => s.session?.user?.id)
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(null)
      setError(false)
    }
  }, [open])

  const submit = async () => {
    if (!me || busy) return
    setBusy(true)
    setError(false)
    // The reason is optional on purpose: someone who wants out of a
    // conversation should never be held there by a required field.
    const { error: blockError } = await blockUser(me, userId, reason ?? undefined)
    setBusy(false)
    if (blockError) {
      setError(true)
      return
    }
    onOpenChange(false)
    onBlocked()
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="block.title"
      titleValues={{ name: userName }}
      footer={
        <div className="flex w-full flex-col gap-2">
          {error && (
            <p data-i18n="barter.errorGeneric" role="alert" className="text-center font-body text-sm text-destructive">
              {t('barter.errorGeneric')}
            </p>
          )}
          <Button fullWidth size="lg" disabled={busy} onClick={submit} data-i18n="block.confirm">
            {t('block.confirm')}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)} data-i18n="common.cancel">
            {t('common.cancel')}
          </Button>
        </div>
      }
    >
      <T as="p" k="block.body" className="mb-3 font-body text-body text-muted-foreground" />

      <ul className="flex flex-col gap-2">
        {REASONS.map((r) => (
          <li key={r}>
            <button
              type="button"
              onClick={() => setReason(reason === r ? null : r)}
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
              <span data-i18n={'block.reason_' + r} className="font-body text-body text-foreground">
                {t('block.reason_' + r)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Stated plainly, because it is the thing people are most anxious
          about when they reach for this. */}
      <T
        as="p"
        k="block.silent"
        className="mt-3 font-body text-sm text-muted-foreground"
      />
    </ResponsiveSheet>
  )
}

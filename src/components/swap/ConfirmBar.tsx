import { useState } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** The two-sided confirmation that closes a swap.
 *
 *  Confirming means the handover HAPPENED -- you met, you swapped -- not that
 *  you agree to meet. That distinction is the whole reason the chat stays open
 *  until both sides confirm: arranging the meetup is what the conversation is
 *  for. Once both have confirmed the trade is genuinely finished, so the thread
 *  closes; it is disabled, never deleted, because the history is what settles a
 *  dispute later.
 *
 *  Confirming is idempotent on the server, so a double tap or a retry on bad
 *  signal cannot forge the other person's half.
 */
export function ConfirmBar({
  mineConfirmed,
  theirsConfirmed,
  status,
  cancelReason,
  busy,
  onConfirm,
  onCancel,
  className,
}: {
  mineConfirmed: boolean
  theirsConfirmed: boolean
  status: 'active' | 'completed' | 'cancelled'
  cancelReason?: string | null
  busy: boolean
  onConfirm: () => void
  onCancel: (reason?: string) => void
  className?: string
}) {
  const { t } = useT()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        className={cn(
          'flex items-center gap-2 rounded-card bg-primary/[0.10] px-4 py-3',
          className,
        )}
      >
        <Icon name="Check" size={18} className="shrink-0 text-primary" />
        <T as="span" k="barter.confirmDone" className="font-body text-sm text-foreground" />
      </motion.div>
    )
  }

  if (status === 'cancelled') {
    // Two different endings. Being told the find went elsewhere is information;
    // being told "cancelled" when someone else took it is just confusing.
    const key =
      cancelReason === 'item_traded_elsewhere'
        ? 'barter.cancelledElsewhere'
        : 'barter.cancelled'
    return (
      <div className={cn('rounded-card bg-secondary px-4 py-3', className)}>
        <p data-i18n={key} className="font-body text-sm text-muted-foreground">
          {t(key)}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex flex-col gap-2', className)}>
        {mineConfirmed ? (
          <div className="flex items-center gap-2 rounded-card bg-secondary px-4 py-3">
            <Icon name="Clock" size={16} className="shrink-0 text-muted-foreground" />
            <T
              as="span"
              k="barter.confirmWaiting"
              className="font-body text-sm text-muted-foreground"
            />
          </div>
        ) : (
          <>
            {/* Their confirmation is shown before the button, so the prompt
                reads as "they say you swapped -- did you?" rather than as an
                unexplained nudge. */}
            {theirsConfirmed && (
              <T
                as="p"
                k="barter.confirmBody"
                className="font-body text-sm text-muted-foreground"
              />
            )}
            <Button
              fullWidth
              size="lg"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
              data-i18n="barter.confirmAction"
            >
              {t('barter.confirmAction')}
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          fullWidth
          disabled={busy}
          onClick={() => setCancelOpen(true)}
          data-i18n="barter.cancelAction"
        >
          {t('barter.cancelAction')}
        </Button>
      </div>

      {/* Confirming is not undoable: it trades both items and closes the
          thread. That earns a second tap. */}
      <ResponsiveSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="barter.confirmTitle"
        description="barter.confirmBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              disabled={busy}
              onClick={() => {
                setConfirmOpen(false)
                onConfirm()
              }}
              data-i18n="barter.confirmAction"
            >
              {t('barter.confirmAction')}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setConfirmOpen(false)}
              data-i18n="common.notYet"
            >
              {t('common.notYet')}
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('barter.confirmBody')}</span>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="barter.cancelAction"
        description="barter.cancelConfirmBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              disabled={busy}
              onClick={() => {
                setCancelOpen(false)
                onCancel()
              }}
              data-i18n="barter.cancelAction"
            >
              {t('barter.cancelAction')}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setCancelOpen(false)}
              data-i18n="common.notYet"
            >
              {t('common.notYet')}
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('barter.cancelConfirmBody')}</span>
      </ResponsiveSheet>
    </>
  )
}

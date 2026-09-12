import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { OfferOption } from '@/screens/Hunt/useHunt'

/** Mandatory on every right swipe.
 *
 *  Under the locked matching rule a like IS an offer: you cannot want something
 *  without saying what you are putting up for it. Nothing is auto-chosen --
 *  the old hunt picker set one item for the whole session, so the same lamp was
 *  silently offered for a bike, a guitar and a coat in turn. Choosing per swipe
 *  is what makes the offer mean something to the person receiving it.
 *
 *  Cancelling leaves the card on the stack. Backing out of the question is not
 *  the same as passing on the find, and conflating them loses finds people
 *  wanted.
 */
export function OfferSheet({
  open,
  targetTitle,
  mine,
  onCancel,
  onConfirm,
  sending,
  errorKey,
  onAdd,
  points = 0,
  superPrice,
  onNeedPoints,
  superFirst = false,
}: {
  open: boolean
  /** Title of the find being offered on, for the prompt. */
  targetTitle: string
  /** My own listings. Only available ones are offerable. */
  mine: OfferOption[]
  onCancel: () => void
  onConfirm: (offeredItemId: string, note?: string, asSuper?: boolean) => void
  /** Points on hand, and what a super offer costs. */
  points?: number
  superPrice?: number
  /** Tapping super with too few points. Routes to where points are earned
   *  rather than leaving a dead button. */
  onNeedPoints?: () => void
  /** Opened by the star rather than the tick: the super offer leads and the
   *  ordinary one becomes the quieter alternative. Same sheet either way --
   *  a super offer IS an ordinary offer with priority, so it still has to ask
   *  which of your finds you are putting up. */
  superFirst?: boolean
  sending: boolean
  /** i18n key from barterErrorKey, or null. */
  errorKey: string | null
  onAdd: () => void
}) {
  const { t } = useT()
  const [picked, setPicked] = useState<string | null>(null)
  const [note, setNote] = useState('')

  // Each swipe is its own question, so nothing carries over from the last one.
  useEffect(() => {
    if (open) {
      setPicked(null)
      setNote('')
    }
  }, [open])

  // With nothing listed there is nothing to trade, so the sheet becomes the
  // prompt to list a first find rather than an empty list with a dead button.
  if (mine.length === 0) {
    return (
      <ResponsiveSheet
        open={open}
        onOpenChange={(o) => !o && onCancel()}
        title="barter.offerTitle"
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-accent/20">
            <Icon name="Package" size={26} className="text-accent-foreground" />
          </span>
          <T
            as="p"
            k="barter.offerNoItems"
            className="max-w-[34ch] font-body text-body text-muted-foreground"
          />
          <Button onClick={onAdd} data-i18n="barter.offerAddItem">
            {t('barter.offerAddItem')}
          </Button>
        </div>
      </ResponsiveSheet>
    )
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title="barter.offerTitle"
      description="barter.offerBody"
      descriptionValues={{ title: targetTitle }}
      footer={
        <div className="flex w-full flex-col gap-2">
          {errorKey && (
            <p
              data-i18n={errorKey}
              role="alert"
              className="text-center font-body text-sm text-destructive"
            >
              {t(errorKey)}
            </p>
          )}
          {superFirst ? (
            <>
          {/* The super offer, at the moment of wanting.
          
              The tier sheet's rule: "Never show these on a settings page.
              Each prompt appears in-context, the moment the user wants the
              thing." Until now every paid action was buyable only on Rewards,
              which is exactly the page it warns about.
          
              Never disabled for lack of points -- a dead button explains
              nothing. It says the price, and tapping it with too few points
              routes to where points are earned. */}
          {superPrice != null && (
            <Button
              variant="accent"
              fullWidth
              size="lg"
              disabled={!picked || sending}
              onClick={() => {
                if (points < superPrice) return onNeedPoints?.()
                if (picked) onConfirm(picked, note.trim() || undefined, true)
              }}
              data-i18n="barter.offerSuper"
            >
              {t('barter.offerSuper', { price: superPrice })}
            </Button>
          )}
          <T
            as="p"
            k="barter.offerSuperBody"
            className="text-center font-body text-xs text-muted-foreground"
          />
          <Button
            fullWidth
            size="lg"
            variant={superFirst ? 'ghost' : 'primary'}
            disabled={!picked || sending}
            onClick={() => picked && onConfirm(picked, note.trim() || undefined)}
            data-i18n="barter.offerSend"
          >
            {t('barter.offerSend')}
          </Button>
            </>
          ) : (
            <>
          <Button
            fullWidth
            size="lg"
            variant={superFirst ? 'ghost' : 'primary'}
            disabled={!picked || sending}
            onClick={() => picked && onConfirm(picked, note.trim() || undefined)}
            data-i18n="barter.offerSend"
          >
            {t('barter.offerSend')}
          </Button>
          {/* The super offer, at the moment of wanting.
          
              The tier sheet's rule: "Never show these on a settings page.
              Each prompt appears in-context, the moment the user wants the
              thing." Until now every paid action was buyable only on Rewards,
              which is exactly the page it warns about.
          
              Never disabled for lack of points -- a dead button explains
              nothing. It says the price, and tapping it with too few points
              routes to where points are earned. */}
          {superPrice != null && (
            <Button
              variant="accent"
              fullWidth
              size="lg"
              disabled={!picked || sending}
              onClick={() => {
                if (points < superPrice) return onNeedPoints?.()
                if (picked) onConfirm(picked, note.trim() || undefined, true)
              }}
              data-i18n="barter.offerSuper"
            >
              {t('barter.offerSuper', { price: superPrice })}
            </Button>
          )}
          <T
            as="p"
            k="barter.offerSuperBody"
            className="text-center font-body text-xs text-muted-foreground"
          />
            </>
          )}
          <Button variant="ghost" fullWidth onClick={onCancel} data-i18n="barter.offerCancel">
            {t('barter.offerCancel')}
          </Button>
        </div>
      }
    >
      <ul className="flex max-h-[46dvh] flex-col gap-2 overflow-y-auto py-1">
        {mine.map((item, i) => {
          const isPicked = picked === item.id
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: i * 0.03 }}
            >
              <button
                type="button"
                onClick={() => setPicked(item.id)}
                aria-pressed={isPicked}
                className={cn(
                  'flex w-full items-center gap-3 rounded-card border-[1.5px] p-2 text-left',
                  'transition-colors duration-fast ease-brand',
                  isPicked
                    ? 'border-primary bg-primary/[0.08]'
                    : 'border-border/[0.14] bg-card hover:border-primary/40',
                )}
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-card-sm object-cover"
                  />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-card-sm bg-secondary">
                    <Icon name="Package" size={20} className="text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-body text-body text-foreground">
                  {item.title}
                </span>
                {/* The tick is the only state marker: a checkbox next to a
                    photo reads as a form, and this is a choice of one. */}
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-pill border-[1.5px]',
                    // The unselected ring is drawn from muted-foreground rather
                    // than border: border sits at 8% lightness in the dark theme
                    // and disappears against the card, so the rows stopped
                    // looking selectable at all.
                    isPicked ? 'border-primary bg-primary' : 'border-muted-foreground/50',
                  )}
                >
                  {isPicked && <Icon name="Check" size={14} className="text-primary-foreground" />}
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <label className="mt-3 flex flex-col gap-1">
        <T as="span" k="barter.offerNoteLabel" className="font-body text-xs text-muted-foreground" />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          placeholder={t('barter.offerNotePlaceholder')}
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

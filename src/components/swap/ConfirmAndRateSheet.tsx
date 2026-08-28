import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { StarsInput } from '@/components/ui/stars'
import { Icon } from '@/components/ui/icon'
import { SwapPair } from './SwapPair'
import { T, useT } from '@/i18n/T'
import type { ItemRef } from '@/types/swap'

/** Keys, not copy. The value sent to the server is the key's stable id so a
 *  rating means the same thing whatever language it was left in. */
const RATING_TAGS = [
  { id: 'punctual', label: 'confirm.tagPunctual' },
  { id: 'as_described', label: 'confirm.tagAsDescribed' },
  { id: 'friendly', label: 'confirm.tagFriendly' },
  { id: 'would_again', label: 'confirm.tagWouldAgain' },
]

/** F4 - confirmation and rating in one step, because asking twice is how
 *  ratings die. Confirmation is required; stars are optional.
 */
export function ConfirmAndRateSheet({
  open,
  onOpenChange,
  mine,
  theirs,
  otherName,
  theyConfirmed,
  onConfirm,
  onRate,
  onTrouble,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mine: ItemRef
  theirs: ItemRef
  otherName: string
  theyConfirmed: boolean
  onConfirm?: () => void
  onRate?: (stars: number, tags: string[]) => void
  onTrouble?: () => void
}) {
  const { t } = useT()
  const [confirmed, setConfirmed] = useState(false)
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev))

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="confirm.title">
      <div className="flex flex-col gap-4">
        <div className="rounded-sm border border-border/[0.14] bg-popover p-3">
          <SwapPair mine={mine} theirs={theirs} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Row done={theyConfirmed}>
            {theyConfirmed
              ? t('confirm.theyConfirmed', { name: otherName })
              : t('confirm.waitingOn', { name: otherName })}
          </Row>
          <Row done={confirmed}>
            {confirmed ? t('confirm.youConfirmed') : t('confirm.didYouGet')}
          </Row>
        </div>

        {!confirmed ? (
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => {
                setConfirmed(true)
                onConfirm?.()
              }}
            >
              {t('confirm.gotIt')}
            </Button>
            <Button variant="ghost" onClick={onTrouble} data-i18n="confirm.somethingWrong">
              {t('confirm.somethingWrong')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-border/[0.14] pt-4">
            <span data-i18n="confirm.rateTitle" className="font-display text-base font-semibold">
              {t('confirm.rateTitle', { name: otherName })}
            </span>
            <StarsInput value={stars} onChange={setStars} />
            <div className="flex flex-wrap gap-2">
              {RATING_TAGS.map((tag) => (
                <Chip key={tag.id} active={tags.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
                  {t(tag.label)}
                </Chip>
              ))}
            </div>
            <T as="p" k="confirm.blindNote" className="font-body text-sm text-muted-foreground" />
            <div className="flex items-center gap-2.5">
              <Button variant="accent" disabled={stars === 0} onClick={() => onRate?.(stars, tags)}>
                {t('confirm.leaveRating')}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} data-i18n="confirm.skip">
                {t('confirm.skip')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveSheet>
  )
}

function Row({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 font-body text-[15px]">
      {done ? (
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon name="Check" size={13} />
        </span>
      ) : (
        <span className="h-[22px] w-[22px] rounded-full border-2 border-border/[0.14]" />
      )}
      {children}
    </div>
  )
}

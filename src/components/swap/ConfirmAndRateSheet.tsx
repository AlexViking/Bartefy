import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { StarsInput } from '@/components/ui/stars'
import { Icon } from '@/components/ui/icon'
import { SwapPair } from './SwapPair'
import type { ItemRef } from '@/types/swap'

const RATING_TAGS = ['On time', 'As described', 'Friendly', 'Would swap again']

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
  const [confirmed, setConfirmed] = useState(false)
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev))

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Did the swap happen?">
      <div className="flex flex-col gap-4">
        <div className="rounded-sm border border-border/[0.14] bg-popover p-3">
          <SwapPair mine={mine} theirs={theirs} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Row done={theyConfirmed}>
            {theyConfirmed
              ? otherName + ' confirmed they got yours'
              : 'Waiting on ' + otherName + ' to confirm'}
          </Row>
          <Row done={confirmed}>{confirmed ? 'You confirmed' : 'Did you get theirs?'}</Row>
        </div>

        {!confirmed ? (
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => {
                setConfirmed(true)
                onConfirm?.()
              }}
            >
              Yes, got it
            </Button>
            <Button variant="ghost" onClick={onTrouble}>
              Something{'\u2019'}s wrong
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-border/[0.14] pt-4">
            <span className="font-display text-base font-semibold">How was swapping with {otherName}?</span>
            <StarsInput value={stars} onChange={setStars} />
            <div className="flex flex-wrap gap-2">
              {RATING_TAGS.map((t) => (
                <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Neither of you sees the other{'\u2019'}s rating until you have both left one.
            </p>
            <div className="flex items-center gap-2.5">
              <Button variant="accent" disabled={stars === 0} onClick={() => onRate?.(stars, tags)}>
                Leave rating
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Skip
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

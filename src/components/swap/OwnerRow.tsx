import { useNavigate } from 'react-router'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import type { PersonRef } from '@/types/swap'

/** Avatar + name + trust line. Cards, chat headers, offer sheets, profiles.
 *  Trust is the currency, so the second line always carries rating and history.
 */
export function OwnerRow({
  person,
  action,
  onAction,
  className,
  linkToReviews = true,
}: {
  person: PersonRef
  action?: string
  onAction?: () => void
  className?: string
  /** The trust line opens that person's reviews. Off where there is no one to
   *  open — your own row, or a placeholder with no id. */
  linkToReviews?: boolean
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const canOpen = linkToReviews && !!person.id
  const bits = [
    person.rating ? '★ ' + person.rating.toFixed(1) : null,
    person.swapCount != null ? t('profile.swapsDone', { count: person.swapCount }) : null,
    person.distanceLabel,
  ].filter(Boolean)

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <UserAvatar name={person.name} src={person.avatarUrl} verified={person.verified} size="md" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-semibold text-foreground">{person.name}</div>
        {bits.length > 0 &&
          (canOpen ? (
            /* The rating was already the trust signal; making it the tap
               target is how someone gets from "3 swaps done" to what those
               people actually said. */
            <button
              type="button"
              onClick={() => navigate('/reviews/' + person.id)}
              aria-label={t('reviews.seeAll')}
              className="block max-w-full truncate text-left font-body text-sm text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {bits.join(' · ')}
            </button>
          ) : (
            <div className="truncate font-body text-sm text-muted-foreground">{bits.join(' · ')}</div>
          ))}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

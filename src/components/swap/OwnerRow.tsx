import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
}: {
  person: PersonRef
  action?: string
  onAction?: () => void
  className?: string
}) {
  const bits = [
    person.rating ? '\u2605 ' + person.rating.toFixed(1) : null,
    person.swapCount != null ? person.swapCount + ' swaps' : null,
    person.distanceLabel,
  ].filter(Boolean)

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Avatar name={person.name} src={person.avatarUrl} verified={person.verified} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-semibold text-foreground">{person.name}</div>
        {bits.length > 0 && (
          <div className="truncate font-body text-sm text-muted-foreground">{bits.join(' \u00b7 ')}</div>
        )}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

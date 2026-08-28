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
}: {
  person: PersonRef
  action?: string
  onAction?: () => void
  className?: string
}) {
  const { t } = useT()
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
        {bits.length > 0 && (
          <div className="truncate font-body text-sm text-muted-foreground">{bits.join(' · ')}</div>
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

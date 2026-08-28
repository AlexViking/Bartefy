import { Eye } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { ToneBadge } from '@/components/ui/tone-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useT } from '@/i18n/T'
import type { CardItem } from '@/store/hunt'
import { cn } from '@/lib/utils'

/** The find itself. Identical on both platforms — only the frame around it
 *  changes, so a card someone learns to read on a phone reads the same on a
 *  desktop.
 */
export function HuntCard({
  item,
  eyeing = 0,
  className,
}: {
  item: CardItem
  eyeing?: number
  className?: string
}) {
  const { t } = useT()

  return (
    <Card
      className={cn('overflow-hidden rounded-hero border-0 bg-card shadow-float', className)}
    >
      <div className="relative aspect-[4/3] w-full" style={{ background: item.photoColor }}>
        {item.photoUrl && (
          <img
            src={item.photoUrl}
            alt={t('a11y.photoOf', { title: item.title })}
            loading="lazy"
            className="size-full object-cover"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
          <ToneBadge tone="quiet" className="bg-card/90 backdrop-blur-sm">
            {item.condition}
          </ToneBadge>
          {eyeing > 0 && (
            <span
              className="flex items-center gap-1 rounded-pill bg-foreground/70 px-2.5 py-1 font-display text-xs font-semibold text-background"
              title={t('help.whyEyeing')}
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {eyeing}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-h3 leading-tight text-foreground">{item.title}</h3>
        <p className="font-body text-sm text-muted-foreground">
          {item.category} {'·'} {item.distance}
        </p>
        <div className="flex items-center gap-2">
          <UserAvatar name={item.owner} size="sm" />
          <span className="font-display text-sm font-semibold text-foreground">{item.owner}</span>
        </div>
        {item.wants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.wants.map((w) => (
              <span
                key={w}
                className="rounded-pill bg-primary/[0.08] px-2.5 py-0.5 font-body text-xs font-semibold text-primary"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

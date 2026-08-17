import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import type { CardItem } from '@/store/hunt'

/** The card itself - identical on desktop and mobile. Only the frame changes. */
export function HuntCard({ item, eyeing = 0 }: { item: CardItem; eyeing?: number }) {
  return (
    <article className="overflow-hidden rounded-hero bg-card shadow-float">
      <div className="relative h-[260px]" style={{ background: item.photoColor }}>
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
          <Badge tone="quiet" className="bg-card/90">
            {item.condition}
          </Badge>
          {eyeing > 0 && (
            <span className="rounded-pill bg-foreground/70 px-2.5 py-1 font-body text-xs font-semibold text-white">
              {eyeing} eyeing
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-bold leading-tight text-foreground">{item.title}</h3>
        <p className="font-body text-sm text-muted-foreground">
          {item.category} {'\u00b7'} {item.distance}
        </p>
        <div className="flex items-center gap-2">
          <Avatar name={item.owner} size={24} />
          <span className="font-display text-sm font-semibold">{item.owner}</span>
        </div>
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
      </div>
    </article>
  )
}

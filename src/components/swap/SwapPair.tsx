import { cn } from '@/lib/utils'
import type { ItemRef } from '@/types/swap'

/** The most reused molecule in the product: yours, chevrons, theirs.
 *  Same shape in the offer composer, chat pin, swaps inbox, handover and rating -
 *  it was copy-pasted markup in five screens before this.
 */
export function SwapPair({
  mine,
  theirs,
  size = 'md',
  className,
}: {
  mine: ItemRef | ItemRef[]
  theirs: ItemRef | ItemRef[]
  size?: 'sm' | 'md'
  className?: string
}) {
  const left = Array.isArray(mine) ? mine : [mine]
  const right = Array.isArray(theirs) ? theirs : [theirs]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Side items={left} label={left.length > 1 ? left.length + ' of yours' : 'Yours'} size={size} />
      <span aria-hidden className="font-display text-xl font-bold text-primary">
        {'< >'}
      </span>
      <Side items={right} label="Theirs" size={size} align="right" />
    </div>
  )
}

function Side({
  items,
  label,
  size,
  align = 'left',
}: {
  items: ItemRef[]
  label: string
  size: 'sm' | 'md'
  align?: 'left' | 'right'
}) {
  const first = items[0]
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', align === 'right' && 'items-end text-right')}>
      <div
        className={cn('w-full overflow-hidden rounded-sm', size === 'sm' ? 'aspect-square' : 'aspect-[4/3]')}
        style={{ background: first?.photoColor ?? 'hsl(var(--secondary))' }}
      >
        {first?.photoUrl && <img src={first.photoUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <span className="truncate font-display text-sm font-semibold text-foreground">
        {items.length > 1 ? label : (first?.title ?? label)}
      </span>
    </div>
  )
}

import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { PhotoWell, PhotoWellGrid } from '@/components/ui/photo-well'
import { cn } from '@/lib/utils'
import type { ItemRef } from '@/types/swap'

const MAX_ITEMS = 3

/** F3 - one organism, three entry points: offer from item detail, offer from a
 *  match, counter from a thread. Countering only changes the title and adds one
 *  line; there is no second component.
 */
export function OfferComposerSheet({
  open,
  onOpenChange,
  theirItem,
  theirName,
  counterOf,
  myItems,
  onSend,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  theirItem: ItemRef
  theirName: string
  /** Set when countering: what they proposed, in words. */
  counterOf?: string
  myItems?: ItemRef[]
  onSend?: (itemIds: string[], note: string) => void
}) {
  // TODO(api): getMyItems(userId) filtered to status 'active'
  const items: ItemRef[] =
    myItems ??
    [
      { id: 'i1', title: 'Wool scarf', photoColor: 'hsl(var(--illo-denim))' },
      { id: 'i2', title: 'Ricoh flash', photoColor: 'hsl(var(--illo-sage))' },
      { id: 'i3', title: 'Brass compass', photoColor: 'hsl(var(--accent))' },
    ]

  const [picked, setPicked] = useState<string[]>([items[0]?.id].filter(Boolean) as string[])
  const [note, setNote] = useState('')

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_ITEMS ? [...p, id] : p))

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={counterOf ? 'Counter ' + theirName + "'s offer" : 'Offer a swap'}
      footer={
        <div className="flex items-center gap-2.5">
          <Button
            fullWidth
            size="lg"
            disabled={picked.length === 0}
            onClick={() => onSend?.(picked, note)}
          >
            {counterOf ? 'Send counter' : 'Send offer'}
          </Button>
          <span className="hidden shrink-0 font-body text-sm text-muted-foreground">
            Expires in 72 hours
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {counterOf && (
          <p className="rounded-sm border border-border/[0.14] bg-popover p-2.5 font-body text-sm text-muted-foreground">
            {counterOf}
          </p>
        )}

        <div className="flex items-center gap-3 rounded-sm border border-border/[0.14] bg-popover p-3">
          <span
            className="h-14 w-14 shrink-0 rounded-lg"
            style={{ background: theirItem.photoColor ?? 'hsl(var(--secondary))' }}
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-semibold">{theirItem.title}</span>
            <span className="block font-body text-sm text-muted-foreground">
              {[theirItem.condition, theirName].filter(Boolean).join(' \u00b7 ')}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
              What you would give
            </span>
            <span className="ml-auto font-body text-sm text-muted-foreground">
              {picked.length} of {MAX_ITEMS} picked
            </span>
          </div>

          <PhotoWellGrid columns={4}>
            {items.map((it) => {
              const on = picked.includes(it.id)
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  aria-pressed={on}
                  className="flex flex-col gap-1.5 text-left"
                >
                  <span
                    className={cn(
                      'relative block aspect-square w-full rounded-sm transition-shadow duration-fast ease-brand',
                      on ? 'ring-[2.5px] ring-primary' : 'ring-1 ring-border/[0.14]',
                    )}
                    style={{ background: it.photoColor }}
                  >
                    {on && (
                      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                        {picked.indexOf(it.id) + 1}
                      </span>
                    )}
                  </span>
                  <span className={cn('truncate font-display text-xs', on ? 'font-semibold' : 'text-muted-foreground')}>
                    {it.title}
                  </span>
                </button>
              )
            })}
            <div className="flex flex-col gap-1.5">
              <PhotoWell state="empty" />
              <span className="font-display text-xs text-muted-foreground">List new</span>
            </div>
          </PhotoWellGrid>

          <p className="font-body text-sm text-muted-foreground">
            Sweeten it with a second find rather than cash - there is no cash here.
          </p>
        </div>

        <TextField
          label="Say something (optional)"
          placeholder="The scarf is hand-knit - happy to meet at Rose Market."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </ResponsiveSheet>
  )
}

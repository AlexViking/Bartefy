import { useState } from 'react'
import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ItemRef } from '@/types/swap'

/** Membership lapses: nothing is deleted. The member picks which finds stay
 *  live; the rest go to Paused and come back the moment they upgrade.
 */
export function PausedFindsSheet({
  open,
  onOpenChange,
  items,
  keepCount = 6,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  items: ItemRef[]
  keepCount?: number
  onSave?: (keepIds: string[]) => void
}) {
  const [keep, setKeep] = useState<string[]>(items.slice(0, keepCount).map((i) => i.id))

  const toggle = (id: string) =>
    setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : k.length < keepCount ? [...k, id] : k))

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={'Choose the ' + keepCount + ' that stay live'}
      description="Nothing is deleted. The rest wait in Paused until you want them back."
      footer={
        <Button size="lg" fullWidth onClick={() => onSave?.(keep)}>
          Keep these {keep.length} live
        </Button>
      }
    >
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const on = keep.includes(it.id)
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => toggle(it.id)}
                aria-pressed={on}
                className={cn(
                  'flex w-full items-center gap-3 rounded-sm p-2.5 text-left transition-colors duration-fast ease-brand',
                  on ? 'border-2 border-primary bg-popover' : 'border border-border/[0.14] bg-card opacity-70',
                )}
              >
                <span className="h-11 w-11 shrink-0 rounded-lg" style={{ background: it.photoColor }} />
                <span className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold">{it.title}</span>
                <span className="font-body text-sm text-muted-foreground">{on ? 'Live' : 'Paused'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </ResponsiveSheet>
  )
}

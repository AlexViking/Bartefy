import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ItemRef, SwapStatus } from '@/types/swap'

/** One row shape for the whole swaps inbox. State lives in the badge and the
 *  second line; the row never changes shape, so scanning stays cheap.
 */
const TONES: Record<SwapStatus, { tone: 'green' | 'brass' | 'quiet' | 'terracotta'; label: string }> = {
  new: { tone: 'brass', label: 'New' },
  chatting: { tone: 'quiet', label: 'Talking' },
  offered: { tone: 'brass', label: 'Offer out' },
  agreed: { tone: 'green', label: 'Agreed' },
  arranged: { tone: 'green', label: 'Meeting set' },
  received_one_side: { tone: 'brass', label: 'Confirm' },
  done: { tone: 'quiet', label: 'Closed' },
  cancelled: { tone: 'quiet', label: 'Closed' },
  frozen: { tone: 'terracotta', label: 'With us' },
}

export function StatusRow({
  item,
  title,
  subtitle,
  status,
  onClick,
  className,
}: {
  item?: ItemRef
  title: string
  subtitle?: string
  status: SwapStatus
  onClick?: () => void
  className?: string
}) {
  const meta = TONES[status]
  const dimmed = status === 'done' || status === 'cancelled'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm border border-border/[0.14] bg-card p-2.5 text-left transition-colors duration-fast ease-brand hover:bg-popover',
        dimmed && 'opacity-60',
        className,
      )}
    >
      <span
        className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
        style={{ background: item?.photoColor ?? 'hsl(var(--secondary))' }}
      >
        {item?.photoUrl && <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-foreground">{title}</span>
        {subtitle && <span className="block truncate font-body text-sm text-muted-foreground">{subtitle}</span>}
      </span>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </button>
  )
}

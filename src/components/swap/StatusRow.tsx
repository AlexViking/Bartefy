import { ToneBadge } from '@/components/ui/tone-badge'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import type { ItemRef, SwapStatus } from '@/types/swap'

/** One row shape for the whole swaps inbox. State lives in the badge and the
 *  second line; the row never changes shape, so scanning stays cheap.
 */
/** Brass means "this one needs you"; green means settled; quiet means closed.
 *  A frozen swap uses the evidence tone — a human is reading the report. */
const TONES: Record<SwapStatus, { tone: 'green' | 'brass' | 'quiet' | 'evidence'; label: string }> = {
  new: { tone: 'brass', label: 'swaps.statusYourTurn' },
  chatting: { tone: 'quiet', label: 'swaps.statusTalking' },
  offered: { tone: 'brass', label: 'swaps.statusYourTurn' },
  agreed: { tone: 'green', label: 'swaps.statusAgreed' },
  arranged: { tone: 'green', label: 'swaps.statusArranged' },
  received_one_side: { tone: 'brass', label: 'swaps.statusWaiting' },
  done: { tone: 'quiet', label: 'swaps.statusDone' },
  cancelled: { tone: 'quiet', label: 'swaps.statusDone' },
  frozen: { tone: 'evidence', label: 'trouble.title' },
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
  const { t } = useT()
  // A status this build does not know about must never blank the screen: an
  // unrecognised value renders as a quiet, neutral row instead of throwing.
  const meta = TONES[status] ?? TONES.new
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
        className="size-11 shrink-0 overflow-hidden rounded-lg"
        style={{ background: item?.photoColor ?? 'hsl(var(--secondary))' }}
      >
        {item?.photoUrl && <img src={item.photoUrl} alt="" className="size-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-foreground">{title}</span>
        {subtitle && <span className="block truncate font-body text-sm text-muted-foreground">{subtitle}</span>}
      </span>
      <ToneBadge tone={meta.tone} data-i18n={meta.label}>
        {t(meta.label)}
      </ToneBadge>
    </button>
  )
}

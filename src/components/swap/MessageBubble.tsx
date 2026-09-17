import { cn } from '@/lib/utils'

/** Three kinds: theirs, yours, and system. System events are pills, never
 *  bubbles - the thread doubles as the swap's audit trail.
 */
export function MessageBubble({
  from,
  children,
  time,
  wide = false,
}: {
  from: 'me' | 'them' | 'system'
  children: React.ReactNode
  time?: string
  /** Give the bubble a floor width. A voice player sized to its text would
   *  squeeze the waveform to nothing on a short note; text bubbles keep
   *  hugging their content. */
  wide?: boolean
}) {
  if (from === 'system') {
    return (
      <div className="my-1 self-center rounded-pill bg-secondary px-3 py-1 font-body text-xs text-muted-foreground">
        {children}
      </div>
    )
  }

  const mine = from === 'me'
  return (
    <div
      className={cn(
        'animate-bubble-in flex max-w-[78%] flex-col gap-0.5',
        // min-w-0 stays so long words still wrap inside the floor width.
        wide && 'w-[min(78%,17rem)] min-w-0',
        mine ? 'self-end items-end' : 'self-start',
      )}
    >
      <div
        className={cn(
          'px-3.5 py-2.5 font-body text-[15px]',
          mine
            ? 'rounded-[14px_14px_4px_14px] bg-primary text-primary-foreground'
            : 'rounded-[14px_14px_14px_4px] border border-border/[0.14] bg-card text-foreground',
        )}
      >
        {children}
      </div>
      {time && <span className="font-body text-[11px] text-muted-foreground">{time}</span>}
    </div>
  )
}

import * as React from 'react'
import { ArrowRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'bartefy.nudges.dismissed'

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeDismissed(ids: string[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids))
  } catch {
    // Private browsing or blocked storage — the nudge simply returns next time.
  }
}

/** The gentle "here is what happens next" nudge.
 *
 *  Bartefy asks people to do something unfamiliar — hand a stranger your things
 *  and take theirs. Whenever a screen can tell that someone has stalled, it
 *  says plainly what the next move is rather than leaving them to guess.
 *
 *  Rules this component enforces so nudges never become nagging:
 *   - one nudge on screen at a time (the screen decides which)
 *   - dismissing one remembers it, per id, across sessions
 *   - it never blocks; it is a strip, never a modal
 *
 *      <NextStep id="list-first" body="stuck.listFirst"
 *                action="onboarding.listFirst" onAction={() => nav('/add')} />
 */
export function NextStep({
  id,
  body,
  action,
  onAction,
  title = 'stuck.title',
  tone = 'brass',
  className,
}: {
  /** Stable id — dismissal is remembered against this. */
  id: string
  /** Translation key for the explanation. */
  body: string
  /** Translation key for the action button. Omit for an explanation only. */
  action?: string
  onAction?: () => void
  /** Translation key for the heading. */
  title?: string
  tone?: 'brass' | 'quiet'
  className?: string
}) {
  const { t } = useT()
  const [dismissed, setDismissed] = React.useState(() => readDismissed().includes(id))

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    const next = Array.from(new Set([...readDismissed(), id]))
    writeDismissed(next)
  }

  return (
    <aside
      role="status"
      data-nudge={id}
      className={cn(
        'flex items-start gap-3 rounded border p-4',
        tone === 'brass'
          ? 'border-accent/40 bg-accent/[0.14]'
          : 'border-border/[0.14] bg-secondary',
        className,
      )}
    >
      <div className="flex-1 space-y-1">
        <p
          data-i18n={title}
          className="font-display text-[15px] font-semibold text-foreground"
        >
          {t(title)}
        </p>
        <p data-i18n={body} className="font-body text-sm leading-relaxed text-muted-foreground">
          {t(body)}
        </p>
        {action && onAction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAction}
            className="mt-2 bg-card"
            data-i18n={action}
          >
            {t(action)}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('stuck.dismiss')}
        className={cn(
          'shrink-0 rounded-pill p-1 text-muted-foreground transition-colors duration-fast',
          'hover:bg-foreground/[0.06] hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  )
}

/** Clears every remembered dismissal. Wired to a "show me the tips again"
 *  control in Settings, so guidance is recoverable rather than gone for good. */
export function resetNudges() {
  writeDismissed([])
}

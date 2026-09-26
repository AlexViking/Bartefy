import * as React from 'react'

/** A live tap on the analytics pipe, for the organism gallery.
 *
 *  Every event an organism emits is shown here with its full payload, exactly
 *  as it would be written to `public.events`. The point is to make the
 *  tracking VERIFIABLE by eye before any of it is trusted: click a pip, see
 *  what the Analytics UI will receive.
 *
 *  It listens rather than intercepts. `track()` dispatches a window event in
 *  dev, so nothing about the real analytics path is mocked or bypassed --
 *  what you read here is what the queue holds.
 */

export interface CapturedEvent {
  id: number
  at: string
  name: string
  props: Record<string, unknown>
}

/** Keys shown as chips before the raw JSON, because they are the ones that
 *  make a layout test answerable. Order matters: it reads as a sentence. */
const KEY_ORDER = ['organism', 'variant', 'platform', 'col', 'span', 'row', 'arm', 'target']

export function EventInspector() {
  const [events, setEvents] = React.useState<CapturedEvent[]>([])
  const nextId = React.useRef(1)

  React.useEffect(() => {
    function onTracked(e: Event) {
      const d = (e as CustomEvent).detail as { name: string; props: Record<string, unknown> }
      setEvents((prev) =>
        [
          {
            id: nextId.current++,
            at: new Date().toLocaleTimeString(undefined, { hour12: false }),
            name: d.name,
            props: d.props,
          },
          ...prev,
        ].slice(0, 40),
      )
    }
    window.addEventListener('bartefy:tracked', onTracked)
    return () => window.removeEventListener('bartefy:tracked', onTracked)
  }, [])

  const tone = (name: string) =>
    name.endsWith('converted')
      ? 'bg-accent text-accent-foreground'
      : name.endsWith('clicked')
        ? 'bg-primary/[0.14] text-primary'
        : 'bg-foreground/[0.06] text-muted-foreground'

  return (
    <aside className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Event stream
        </h2>
        {events.length > 0 && (
          <button
            type="button"
            onClick={() => setEvents([])}
            className="rounded-card-sm border border-border/[0.14] px-2 py-1 font-display text-[11px] font-semibold text-muted-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="rounded-card border border-dashed border-border/[0.2] p-4 text-[13px] leading-relaxed text-muted-foreground">
          Nothing yet. Click a day in a ramp, a progress bar, or a compact
          card — every emit lands here with the payload the Analytics UI
          receives. Scrolling an organism into view fires a{' '}
          <code className="rounded bg-foreground/[0.06] px-1">organism_viewed</code> once
          per mount.
        </p>
      ) : (
        <ol className="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto p-0">
          {events.map((e) => {
            const ordered = KEY_ORDER.filter((k) => e.props[k] != null)
            const rest = Object.keys(e.props).filter(
              (k) => !KEY_ORDER.includes(k) && e.props[k] != null,
            )
            return (
              <li
                key={e.id}
                className="rounded-card border border-border/[0.14] bg-card p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-card-sm px-2 py-0.5 font-display text-[11px] font-bold ${tone(e.name)}`}
                  >
                    {e.name}
                  </span>
                  <span className="font-display text-[11px] tabular-nums text-muted-foreground">
                    {e.at}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {ordered.map((k) => (
                    <span
                      key={k}
                      className="rounded bg-foreground/[0.05] px-1.5 py-0.5 text-[11px]"
                    >
                      <span className="text-muted-foreground">{k}</span>{' '}
                      <b className="font-semibold">{String(e.props[k])}</b>
                    </span>
                  ))}
                  {rest.map((k) => (
                    <span
                      key={k}
                      className="rounded bg-accent/[0.18] px-1.5 py-0.5 text-[11px]"
                    >
                      <span className="text-muted-foreground">{k}</span>{' '}
                      <b className="font-semibold">{String(e.props[k])}</b>
                    </span>
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}

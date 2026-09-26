import * as React from 'react'

import { track } from '@/lib/analytics'
import { usePlatform } from '@/lib/platform'
import type { Platform } from '@/lib/platform'
import type { InteractionKind, OrganismContext, SizeVariant } from './organism'

/** Instrumentation every organism gets for free.
 *
 *  One hook returns three things: a ref that reports when the organism was
 *  actually SEEN, an `emit` for clicks, and the context those events carry.
 *  No call site has to know an experiment is running or that anything is being
 *  counted.
 *
 *  Why this rather than calling track() inside each organism: the useful
 *  question is never "how many clicks did the streak get". It is "did the
 *  streak get more clicks as a sidebar tile than as a wide banner, on
 *  desktop". That needs organism + variant + platform + cell + arm stamped on
 *  every event, which is exactly what a component should not be repeating by
 *  hand.
 */

/* Three generic names, not one per organism.
 *
 * EVENT_NAMES is a closed list that the admin goal-picker renders as options.
 * A name per organism would grow it without bound and make picking a goal
 * unusable, so the organism and the target ride in `props` -- which is jsonb
 * and needs no migration. */
const EVENT_FOR: Record<InteractionKind, 'organism_viewed' | 'organism_clicked' | 'organism_converted'> = {
  view: 'organism_viewed',
  click: 'organism_clicked',
  convert: 'organism_converted',
}

export interface UseOrganismOptions {
  organism: string
  variant: SizeVariant
  /** Grid placement, when a layout config placed it. */
  col?: number
  span?: number
  row?: number
  arm?: string
  /** Fraction of the organism that must be visible to count as seen. */
  threshold?: number
  /** Off for previews and the gallery, so a screenshot run does not pollute
   *  real funnels with thousands of synthetic views. */
  enabled?: boolean
  /** Overrides the detected platform. ONLY for the gallery, which renders a
   *  390px "mobile" frame inside a 1560px desktop window -- without this
   *  every event would be stamped `desktop` and the payload would contradict
   *  the frame's own label. Never passed by a real screen. */
  platformOverride?: Platform
}

export interface OrganismHandle {
  /** Attach to the organism's root element. */
  ref: (el: HTMLElement | null) => void
  /** Report an interaction. `target` is the stable id from the spec. */
  emit: (kind: InteractionKind, target: string, extra?: Record<string, unknown>) => void
  context: OrganismContext
  /** Spread onto the root so the DOM is inspectable and screenshot probes can
   *  assert what rendered without reading React internals. */
  attrs: Record<string, string | number | undefined>
}

export function useOrganism({
  organism,
  variant,
  col,
  span,
  row,
  arm,
  threshold = 0.5,
  enabled = true,
  platformOverride,
}: UseOrganismOptions): OrganismHandle {
  const detected = usePlatform()
  const platform = platformOverride ?? detected

  const context = React.useMemo<OrganismContext>(
    () => ({ organism, variant, platform, col, span, row, arm }),
    [organism, variant, platform, col, span, row, arm],
  )

  /* The context is read inside an IntersectionObserver callback that is set up
   * once. Holding it in a ref keeps that callback current without tearing the
   * observer down and rebuilding it every time a prop changes -- which would
   * re-fire the view for an organism already on screen. */
  const ctxRef = React.useRef(context)
  ctxRef.current = context

  /* A view is counted once per mount, not once per intersection. Scrolling an
   * organism off screen and back is the same impression; counting it twice
   * inflates the denominator every conversion rate is measured against. */
  const seen = React.useRef(false)
  const [node, setNode] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!node || !enabled || seen.current) return

    /* jsdom and older Safari lack IntersectionObserver. Counting the view
     * immediately is wrong but recoverable; throwing is not. */
    if (typeof IntersectionObserver === 'undefined') {
      seen.current = true
      track('organism_viewed', { ...ctxRef.current, target: 'root' })
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.current) {
            seen.current = true
            track('organism_viewed', { ...ctxRef.current, target: 'root' })
            io.disconnect()
          }
        }
      },
      { threshold },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node, enabled, threshold])

  const emit = React.useCallback(
    (kind: InteractionKind, target: string, extra?: Record<string, unknown>) => {
      if (!enabled) return
      track(EVENT_FOR[kind], { ...ctxRef.current, target, ...extra })
    },
    [enabled],
  )

  return {
    ref: setNode,
    emit,
    context,
    attrs: {
      'data-organism': organism,
      'data-variant': variant,
      'data-platform': platform,
      'data-col': col,
      'data-span': span,
      'data-arm': arm,
    },
  }
}

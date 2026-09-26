/** What every V6 organism declares.
 *
 *  An organism is not just a component with size variants. It is a unit that
 *  can be PLACED (the grid), FED (a data pipeline) and WATCHED (instrumen-
 *  tation), and those three contracts are what make it testable.
 *
 *  The point of declaring them rather than wiring them per screen: a screen
 *  becomes a grid plus a list of placements, and nothing at a call site has to
 *  know that an experiment exists, that a source is mocked, or that a click is
 *  being counted.
 */

import type { Platform } from '@/lib/platform'

/* ------------------------------------------------------------- placement -- */

export type SizeVariant = 'full' | 'wide' | 'half' | 'tile' | 'compact' | 'inline'

/** Minimum columns a variant may be placed at, per platform.
 *
 *  `null` means the variant is UNSUPPORTED there -- not "any width will do".
 *  The streak's `wide` at 4 mobile columns cut its seven-day ramp mid-pip, and
 *  a variant that only half-renders is a defect, not a smaller telling. The
 *  grid refuses the placement instead of clipping.
 */
export type MinSpan = Record<Platform, number | null>

/* ------------------------------------------------------------------ data -- */

/** How an organism gets its data.
 *
 *  The organism never calls supabase itself. It declares a source, and one
 *  adapter resolves it -- so swapping a mock for a real RPC is a config
 *  change, and an organism with no backend yet (the streak) is honestly
 *  marked rather than quietly faked.
 */
export type DataSource<T> =
  /** No fetch. Props only -- a pure presentational organism. */
  | { kind: 'static' }
  /** Demo data, with the reason it is not real. Renders a dev-only marker so
   *  a mock can never be mistaken for a live feature in a screenshot. */
  | { kind: 'mock'; data: T; because: string }
  /** A Postgres function via supabase.rpc(). */
  | { kind: 'rpc'; fn: string; args?: Record<string, unknown> }
  /** A PostgREST table read. `select` uses embedded-join syntax, which depends
   *  on exact FK constraint names -- a wrong one returns [] rather than an
   *  error, so verify it against the live schema. */
  | { kind: 'table'; from: string; select: string; filter?: Record<string, unknown> }
  /** Client-side only: a store, localStorage, something derived. */
  | { kind: 'local'; read: () => T | Promise<T> }

export interface DataPipeline<TRaw = unknown, TProps = unknown> {
  source: DataSource<TRaw>
  /** TanStack Query key. Realtime patches and invalidation both target this. */
  queryKey: readonly unknown[]
  /** Raw rows -> the props the organism renders. Kept out of the component so
   *  the same organism can be fed by a different source without touching it. */
  toProps: (raw: TRaw) => TProps
  /** Milliseconds a result stays fresh. A countdown wants a short one. */
  staleTime?: number
  /** True when the backend does not exist yet. Blocks it from being placed in
   *  a live layout config -- see registry validation. */
  unavailable?: boolean
}

/* --------------------------------------------------------- instrument -- */

/** What a viewer did to an organism.
 *
 *  Three verbs, not one event name per organism. `EVENT_NAMES` is a closed
 *  list that the admin goal-picker renders, so a name per organism would
 *  grow it without bound and make choosing a goal unusable. The organism and
 *  the target ride in `props` instead, which is jsonb and needs no migration.
 */
export type InteractionKind =
  /** Scrolled into view, past the threshold, for the first time. */
  | 'view'
  /** A control inside the organism was activated. */
  | 'click'
  /** A primary action completed -- the thing the organism exists to cause. */
  | 'convert'

/** The context stamped onto every organism event.
 *
 *  This is what makes "the tile in the sidebar beat the wide banner" an
 *  answerable question: the same organism reports where it was and how big it
 *  was at the moment it was used.
 */
export interface OrganismContext {
  organism: string
  variant: SizeVariant
  platform: Platform
  /** Grid cell, when placed by a layout config. Absent when mounted directly. */
  col?: number
  span?: number
  row?: number
  /** The layout arm this render belongs to, when an experiment is running. */
  arm?: string
}

/** One instrumented target inside an organism -- a button, a row, a pip.
 *  Declared so the Analytics UI can list what is clickable before anyone has
 *  clicked it, rather than discovering targets from whatever happened to fire.
 */
export interface InteractionTarget {
  /** Stable id. Never a label: copy changes, and a renamed target silently
   *  starts a new series that looks like a drop to zero. */
  id: string
  /** Plain-English description for the Analytics UI. */
  describe: string
  kind: InteractionKind
}

/* ------------------------------------------------------------- registry -- */

export interface OrganismSpec<TRaw = unknown, TProps = unknown> {
  id: string
  describe: string
  variants: Partial<Record<SizeVariant, { minSpan: MinSpan }>>
  data: DataPipeline<TRaw, TProps>
  /** Every target that can emit. The Analytics UI reads this. */
  targets: InteractionTarget[]
}

/** The parts of a spec that are safe to read generically.
 *
 *  `OrganismSpec<StreakData, StreakData>` is NOT assignable to
 *  `OrganismSpec<unknown, unknown>`: `toProps` puts the type parameters in an
 *  invariant position. A registry or a gallery only ever reads placement,
 *  targets and the source's metadata -- never calls `toProps` -- so it takes
 *  this view instead of the full spec. */
export type AnyOrganismSpec = Omit<OrganismSpec, 'data'> & {
  data: Omit<DataPipeline, 'toProps'> & { toProps: (raw: never) => unknown }
}

/** Can this organism be placed here, at this size? The grid asks before
 *  rendering; a refusal is a build error, not a clipped label at runtime. */
export function canPlace(
  spec: AnyOrganismSpec,
  variant: SizeVariant,
  platform: Platform,
  span: number,
): { ok: true } | { ok: false; why: string } {
  const v = spec.variants[variant]
  if (!v) return { ok: false, why: `${spec.id} has no "${variant}" variant` }

  const min = v.minSpan[platform]
  if (min == null) {
    return { ok: false, why: `${spec.id}/${variant} is not supported on ${platform}` }
  }
  if (span < min) {
    return {
      ok: false,
      why: `${spec.id}/${variant} needs >= ${min} columns on ${platform}, got ${span}`,
    }
  }
  if (spec.data.unavailable) {
    return { ok: false, why: `${spec.id} has no backend yet (data.unavailable)` }
  }
  return { ok: true }
}

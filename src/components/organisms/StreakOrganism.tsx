
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import { ToneBadge } from '@/components/ui/tone-badge'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import type { OrganismSpec } from '@/layout/organism'
import { useOrganism } from '@/layout/useOrganism'
import type { Platform } from '@/lib/platform'

/** Daily visit streak — the first V6 organism.
 *
 *  Ported from the V6 Stitch design, rebuilt on shadcn and Bartefy tokens.
 *  Three deliberate departures from that mock, each one an invariant:
 *
 *  1. TONES. Stitch paints the active day terracotta (its `primary`). Bartefy
 *     reserves terracotta, denim and sage for illustration -- never status,
 *     never a control. So a claimed day is GREEN (settled, complete), today is
 *     BRASS (needs you), and a locked day is QUIET. That is the vocabulary
 *     tone-badge already documents, and it is why this reads as Bartefy
 *     rather than as a Material demo.
 *
 *  2. NO RAW STRINGS. Every label goes through i18n.
 *
 *  3. NO ANIMATED LAYOUT PROPERTY. Stitch pulses the flame with
 *     `animate-pulse` (opacity, fine) but also scales today's pip with
 *     `scale-105`. Scale is a transform, so it is kept; anything touching
 *     width/height/font-size is not.
 *
 *  The organism owns no fetching. It takes a `days` array so a screen, a
 *  layout config or a preview harness can all mount it identically.
 *
 *  NOTE: there is no streak backend. `point_events` is an append-only ledger
 *  of awards, not a record of visits, so nothing today can say "day 4 of 7".
 *  Building that is a migration; see v6/05-BUILD-ORDER.md phase 5.1. Until it
 *  exists this renders from props only and is not wired to a screen.
 */

export type StreakDayState = 'claimed' | 'today' | 'locked' | 'grand'

/** Where the user is in the 7-day cycle.
 *
 *  These are LIFECYCLE states, not size variants -- the same organism at the
 *  same width renders a different shape depending on what the user can
 *  actually do right now:
 *
 *    ready    Day 1, nothing claimed yet. No ramp to show, one clear action.
 *    running  Mid-cycle. The full ramp; today is already claimed.
 *    complete Day 7 done. A result, not a prompt -- no ramp, no action.
 *
 *  Keeping them out of `variant` matters: a layout config picks a SIZE, and
 *  it must not have to know whether the person has claimed today.
 */
export type StreakState = 'ready' | 'running' | 'complete'

export interface StreakDay {
  /** 1-based day in the ramp. */
  day: number
  state: StreakDayState
  /** Points this day awards. */
  points: number
}

/** The size variants this organism supports, and the minimum column span each
 *  one may be placed at. The grid refuses a placement below `minSpan` rather
 *  than letting a label clip -- see v6/03-GRID.md rule 2.
 */
export const STREAK_VARIANTS = {
  /* Measured in the organism gallery, not guessed.
   *
   * `wide` shows all seven pips, which needs a full tablet row. At 4 mobile
   * columns the ramp was cut mid-pip -- a variant that only half-renders is a
   * defect, not a smaller telling. `null` means unsupported on that platform,
   * and the grid must pick another variant there.
   *
   * `compact` is 3 everywhere, not 2: at two columns "4-day streak"
   * truncated to "4-day stre..." on mobile and tablet alike.
   *
   * desktop `wide` is 12, not 8: once the pips became real cards with proper
   * padding the ramp no longer fitted 8 columns and was cut off at D5. It is
   * a full-width banner or it is not this variant.
   *
   * `tile` is 4, not 3: at 3/12 (~330px) nothing clipped, but the badge wrapped
   * onto three lines and the sentence squeezed into a strip. "Does not clip" is
   * a lower bar than "is legible", and the minimum encodes the second. */
  wide: { minSpan: { mobile: null, tablet: 8, desktop: 12 } },
  tile: { minSpan: { mobile: 4, tablet: 4, desktop: 4 } },
  compact: { minSpan: { mobile: 3, tablet: 3, desktop: 3 } },
} as const satisfies Record<
  string,
  { minSpan: Record<'mobile' | 'tablet' | 'desktop', number | null> }
>

export type StreakVariant = keyof typeof STREAK_VARIANTS

/** What the data pipeline yields, and what the organism renders. */
export interface StreakData {
  days: StreakDay[]
  streak: number
  claimedToday?: number | null
  rampTotal: number
  nextUnlockIn?: string
}

/** Demo data for the gallery and for the mock pipeline below. */
export const STREAK_DEMO: StreakDay[] = [
  { day: 1, state: 'claimed', points: 2 },
  { day: 2, state: 'claimed', points: 3 },
  { day: 3, state: 'claimed', points: 4 },
  { day: 4, state: 'today', points: 5 },
  { day: 5, state: 'locked', points: 6 },
  { day: 6, state: 'locked', points: 7 },
  { day: 7, state: 'grand', points: 7 },
]

/** The full organism contract: how it is placed, how it is fed, what it emits.
 *
 *  Everything a layout config, the data adapter and the Analytics UI needs to
 *  know is declared here rather than discovered from the component.
 */
export const STREAK_SPEC: OrganismSpec<StreakData, StreakData> = {
  id: 'streak',
  describe: 'Daily visit streak and its seven-day reward ramp',

  variants: STREAK_VARIANTS,

  /* PIPELINE. Mock today, and honestly marked as such.
   *
   * `point_events` is an append-only ledger of AWARDS, not a record of
   * VISITS, so nothing in the database can currently answer "day 4 of 7".
   * `unavailable` blocks this organism from being placed in a live layout --
   * a faked streak in production would be a lie told to users, not a
   * placeholder.
   *
   * When the visit ledger lands, this becomes:
   *     source: { kind: 'rpc', fn: 'get_streak' }
   * and nothing else about the organism changes. */
  data: {
    source: {
      kind: 'mock',
      data: {
        days: STREAK_DEMO,
        streak: 4,
        claimedToday: 5,
        rampTotal: 34,
        nextUnlockIn: '14h 22m',
      },
      because: 'No visit ledger exists. point_events records awards, not visits.',
    },
    queryKey: ['organism', 'streak'],
    toProps: (raw) => raw,
    // A countdown goes stale quickly, but the ramp itself changes once a day.
    staleTime: 60_000,
    unavailable: true,
  },

  /* WHAT IT EMITS. Declared up front so the Analytics UI can list every
   * clickable target before anyone has clicked one -- rather than inferring
   * the list from whatever happened to fire. Ids are stable and never labels:
   * copy changes, and a renamed target silently starts a new series that
   * reads as a drop to zero. */
  targets: [
    { id: 'root', describe: 'The organism scrolled into view', kind: 'view' },
    { id: 'today_pip', describe: "Tapped today's day in the ramp", kind: 'click' },
    { id: 'future_pip', describe: 'Tapped a locked future day', kind: 'click' },
    { id: 'claimed_pip', describe: 'Tapped an already-claimed day', kind: 'click' },
    { id: 'progress', describe: 'Tapped the progress bar (tile variant)', kind: 'click' },
    { id: 'claim', describe: "Claimed today's points", kind: 'convert' },
    { id: 'claim_first', describe: 'Claimed the day-1 starter reward', kind: 'convert' },
  ],
}

export interface StreakOrganismProps {
  days: StreakDay[]
  /** Current run length, in days. */
  streak: number
  /** Points already claimed today, if any. */
  claimedToday?: number | null
  /** Total the full ramp pays out, shown as the thing worth finishing. */
  rampTotal: number
  /** Human-readable time until the next unlock, e.g. "14h 22m". */
  nextUnlockIn?: string
  variant?: StreakVariant
  /** Where in the cycle. Defaults to the mid-cycle ramp. */
  state?: StreakState
  /** Points the unclaimed day is worth. `ready` only. */
  claimable?: number
  /** Total earned across the finished cycle. `complete` only. */
  cycleTotal?: number
  /** When the next cycle opens, e.g. "8h 12m". `complete` only. */
  resetsIn?: string
  /** Fired when the user claims. `ready` only. */
  onClaim?: () => void
  className?: string
  /** Grid placement, passed by the layout renderer. Rides on every event so
   *  "the tile in the sidebar beat the wide banner" is answerable. */
  col?: number
  span?: number
  row?: number
  arm?: string
  /** Off in previews so a screenshot run does not pollute real funnels. */
  track?: boolean
  /** Gallery only -- see useOrganism. */
  platformOverride?: Platform
  /** Which accent carries "today". An A/B arm, not a preference. */
  tone?: StreakTone
}

/* ----------------------------------------------------------------- pips -- */

/** Which accent carries "today".
 *
 *  A layout A/B arm in miniature: same structure, same data, one colour
 *  decision. Both follow the same restraint rule -- claimed days are plain
 *  white cards and only their tick and number are green, so exactly ONE
 *  element on the row is loud.
 */
export type StreakTone = 'coral' | 'attention'

const PIP_TONE = (tone: StreakTone): Record<StreakDayState, string> => ({
  /* A claimed day is a plain card. The tick and the number carry the green;
   * the card itself stays quiet. Filling it would give the row four loud
   * elements and today would stop reading as the one that matters. */
  claimed: 'bg-card text-state-settled shadow-[var(--shadow-card)]',
  /* Today. The single loud element on the row. */
  today:
    tone === 'attention'
      ? 'bg-state-attention text-white shadow-[var(--shadow-float)]'
      : 'bg-brand-coral text-on-accent shadow-[var(--shadow-float)]',
  /* Not yet earned. Nearly invisible, on purpose. */
  locked: 'bg-brand-stone/60 text-muted-foreground',
  /* The prize at the end -- a hint of the accent, still waiting. */
  grand:
    tone === 'attention'
      ? 'bg-state-attention/12 text-state-attention'
      : 'bg-brand-coral/20 text-on-accent',
})

const PIP_ICON: Record<StreakDayState, 'CircleCheck' | 'Flame' | 'Lock' | 'Medal'> = {
  claimed: 'CircleCheck',
  today: 'Flame',
  locked: 'Lock',
  grand: 'Medal',
}

/** Which target id a pip reports. Stable ids, never the label. */
const PIP_TARGET: Record<StreakDayState, string> = {
  claimed: 'claimed_pip',
  today: 'today_pip',
  locked: 'future_pip',
  grand: 'future_pip',
}

function Pip({
  day,
  compact,
  onPick,
  tone,
}: {
  day: StreakDay
  compact?: boolean
  onPick?: (day: StreakDay) => void
  tone: StreakTone
}) {
  const { t } = useT()
  const isToday = day.state === 'today'

  return (
    <li
      className={cn(
        'flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-card-sm px-1 py-2',
        'transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        onPick && 'cursor-pointer',
        PIP_TONE(tone)[day.state],
      )}
      aria-current={isToday ? 'step' : undefined}
      /* A real button, not a div with a handler: the ramp is keyboard
       * reachable and a screen reader announces what each day is. */
      role={onPick ? 'button' : undefined}
      tabIndex={onPick ? 0 : undefined}
      onClick={onPick ? () => onPick(day) : undefined}
      onKeyDown={
        onPick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPick(day)
              }
            }
          : undefined
      }
    >
      <span
        className={cn(
          'max-w-full truncate font-display text-[11px] font-bold uppercase',
          isToday ? 'opacity-100' : 'text-muted-foreground',
        )}
      >
        {isToday ? t('streak.today') : t('streak.dayShort', { n: day.day })}
      </span>
      <Icon
        name={PIP_ICON[day.state]}
        size={compact ? 15 : 18}
        aria-hidden
        /* Opacity only -- never a layout property. */
        className={isToday ? 'animate-pulse' : undefined}
      />
      <span className="font-display text-[13px] font-bold tabular-nums">
        +{day.points}
      </span>
    </li>
  )
}

/* ------------------------------------------------------------- organism -- */

export function StreakOrganism({
  days,
  streak,
  claimedToday,
  rampTotal,
  nextUnlockIn,
  variant = 'wide',
  state = 'running',
  claimable = 2,
  cycleTotal,
  resetsIn,
  onClaim,
  className,
  col,
  span,
  row,
  arm,
  track = true,
  platformOverride,
  tone = 'coral',
}: StreakOrganismProps) {
  const { t } = useT()
  /* Instrumentation every organism gets for free: a ref that reports when it
   * was actually seen, an emit for clicks, and the data attributes that let a
   * screenshot probe assert what rendered. */
  const org = useOrganism({
    organism: STREAK_SPEC.id,
    variant,
    col,
    span,
    row,
    arm,
    enabled: track,
    platformOverride,
  })
  const done = days.filter((d) => d.state === 'claimed' || d.state === 'today').length
  const pct = days.length ? Math.round((done / days.length) * 100) : 0

  /* ---- STATE A: nothing claimed yet. ----
   *
   * No ramp: there is no progress to show on day one, and a row of seven
   * locked slots reads as work rather than a reward. One action instead. */
  if (state === 'ready') {
    return (
      <Card
        ref={org.ref}
        {...org.attrs}
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 p-4',
          tone === 'attention' ? 'bg-state-attention/[0.05]' : 'bg-brand-coral/[0.07]',
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Grey, not lit: the flame stays unlit until it is claimed, so the
              button is the only coloured thing on the card. */}
          <span className="grid size-10 shrink-0 place-items-center rounded-card bg-brand-stone text-muted-foreground">
            <Icon name="Flame" size={20} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-[16px] font-bold leading-tight">
              <T k="streak.readyTitle" />
            </span>
            <span className="text-[12px] leading-tight text-muted-foreground">
              <T k="streak.readyBody" values={{ points: claimable }} />
            </span>
          </div>
        </div>
        <Button
          variant="accent"
          size="sm"
          className={cn(
            'h-auto min-w-0 shrink-0 whitespace-normal px-4 py-2',
            'font-display text-[13px] font-bold leading-tight tabular-nums',
            tone === 'attention'
              ? 'bg-state-attention text-white hover:bg-state-attention/90'
              : 'bg-brand-coral text-on-accent hover:bg-brand-coral/90',
          )}
          onClick={() => {
            org.emit('convert', 'claim_first', { points: claimable })
            onClaim?.()
          }}
        >
          <T k="streak.claimAction" values={{ points: claimable }} />
        </Button>
      </Card>
    )
  }

  /* ---- STATE B: the cycle is finished. ----
   *
   * A result, not a prompt. No ramp and no action -- there is nothing left to
   * do until the cycle resets, and a button here would be a dead end. */
  if (state === 'complete') {
    return (
      <Card
        ref={org.ref}
        {...org.attrs}
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 bg-state-new-match/[0.10] p-4',
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-card bg-state-new-match text-on-accent shadow-[var(--shadow-card)]">
            <Icon name="Medal" size={20} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-[15px] font-bold leading-tight">
              <T k="streak.completeTitle" />
            </span>
            <span className="text-[12px] leading-tight text-muted-foreground">
              <T
                k="streak.completeBody"
                values={{ total: cycleTotal ?? rampTotal, time: resetsIn ?? '' }}
              />
            </span>
          </div>
        </div>
        <ToneBadge tone="brass" className="max-w-full shrink-0 whitespace-normal">
          <T k="streak.cycleMaster" />
        </ToneBadge>
      </Card>
    )
  }

  /* ---- compact: the smallest honest telling. One line, no ramp. ---- */
  if (variant === 'compact') {
    return (
      <Card
        ref={org.ref}
        {...org.attrs}
        className={cn('flex items-center gap-2.5 px-3 py-2.5', className)}
        onClick={() => org.emit('click', 'root')}
      >
        <span className={cn(
            'grid size-8 shrink-0 place-items-center rounded-card-sm shadow-[var(--shadow-card)]',
            tone === 'attention' ? 'bg-state-attention text-white' : 'bg-brand-coral text-on-accent',
          )}>
          <Icon name="Flame" size={16} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-[14px] font-semibold">
          <T k="streak.dayCount" values={{ count: streak }} />
        </span>
        {claimedToday != null && (
          <span className="shrink-0 font-display text-[13px] font-bold tabular-nums text-primary">
            +{claimedToday}
          </span>
        )}
      </Card>
    )
  }

  const header = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-card',
          tone === 'attention'
            ? 'bg-state-attention text-white'
            : 'bg-brand-coral text-on-accent',
          'shadow-[var(--shadow-card)]',
          variant === 'tile' ? 'size-10' : 'size-12',
        )}
      >
        <Icon name="Flame" size={variant === 'tile' ? 20 : 24} aria-hidden />
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-[18px] font-bold leading-tight [overflow-wrap:anywhere]">
            <T k="streak.title" values={{ count: streak }} />
          </h3>
          {claimedToday != null && (
            <ToneBadge tone="green" className="max-w-full whitespace-normal bg-state-highlight text-state-settled">
              <Icon name="CircleCheck" size={13} aria-hidden />
              <T k="streak.claimed" values={{ points: claimedToday }} />
            </ToneBadge>
          )}
        </div>

        {/* A sentence, so it must be allowed to wrap. A nowrap button label
            clipped at both ends is a defect this project has already shipped. */}
        <p className="text-[13.5px] leading-snug text-muted-foreground">
          {nextUnlockIn ? (
            <>
              <T k="streak.nextUnlockPre" />{' '}
              <b className="font-bold text-foreground">{nextUnlockIn}</b>
              <T k="streak.nextUnlockMid" />{' '}
              <b className="font-bold text-state-settled">
                <T k="streak.points" values={{ n: rampTotal }} />
              </b>
              <T k="streak.nextUnlockEnd" />
            </>
          ) : (
            <T k="streak.rampTotal" values={{ total: rampTotal }} />
          )}
        </p>
      </div>
    </div>
  )

  /* ---- tile: sidebar card. Header, a progress bar, no seven-day ramp. ---- */
  if (variant === 'tile') {
    return (
      <Card
        ref={org.ref}
        {...org.attrs}
        className={cn('flex flex-col gap-3 p-4', className)}
      >
        {header}
        <div
          className="flex flex-col gap-1.5"
          onClick={() => org.emit('click', 'progress')}
        >
          <Progress
            value={pct}
            aria-label={t('streak.progressLabel', { done, total: days.length })}
            className="h-1.5"
          />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [overflow-wrap:anywhere]">
            <T k="streak.progress" values={{ done, total: days.length }} />
          </span>
        </div>
      </Card>
    )
  }

  /* ---- wide: the full banner with the seven-day ramp. ---- */
  return (
    <Card
      className={cn(
        'flex flex-col gap-4 p-4',
        tone === 'attention' ? 'bg-state-attention/[0.06]' : 'bg-brand-coral/[0.08]',
        org.context.platform === 'desktop' &&
          'lg:flex-row lg:items-center lg:justify-between lg:gap-6',
        className,
      )}
      ref={org.ref}
      {...org.attrs}
    >
      {header}

      {/* The ramp scrolls inside its own track. The page must never scroll
          sideways because a seven-day row did not fit -- that is the defect
          the V6 viewer itself shipped and had to fix. */}
      <div className={cn(
          '-mx-1 overflow-x-auto px-1',
          org.context.platform === 'desktop' && 'lg:mx-0 lg:px-0',
        )}>
        <ol
          className="flex min-w-max items-stretch gap-2"
          aria-label={t('streak.rampLabel')}
        >
          {days.map((d) => (
            <Pip
              key={d.day}
              day={d}
              tone={tone}
              onPick={(day) =>
                org.emit(
                  day.state === 'today' ? 'convert' : 'click',
                  day.state === 'today' ? 'claim' : PIP_TARGET[day.state],
                  { day: day.day, points: day.points, state: day.state },
                )
              }
            />
          ))}
        </ol>
      </div>
    </Card>
  )
}


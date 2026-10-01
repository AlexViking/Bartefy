import * as React from 'react'

import { formatLeft, useTimeLeft } from '@/components/offer/ExpiryCountdown'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import type { DeskItem, GroupId, OfferItem, SwapItem } from './useSwapsDesk'

const HOUR = 3_600_000

/** "now", "3h", "2d" -- the list's right-hand clock. */
export function useAgo() {
  const { t } = useT()
  return (iso: string) => {
    const ms = Date.now() - Date.parse(iso)
    if (!Number.isFinite(ms) || ms < 60 * 60_000) return t('desk.agoNow')
    if (ms < 24 * HOUR) return t('desk.agoH', { n: Math.floor(ms / HOUR) })
    return t('desk.agoD', { n: Math.floor(ms / (24 * HOUR)) })
  }
}

/** The deadline pill: Coral under 6h, Sun under 12h, quiet after that. */
export function TimerPill({ at, className }: { at: string | null; className?: string }) {
  const { t } = useT()
  const left = useTimeLeft(at)
  if (left == null) return null
  const tone = left < 6 * HOUR ? 'bg-coral text-ink' : left < 12 * HOUR ? 'bg-sun text-ink' : 'bg-secondary text-muted-foreground'
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2 font-display text-[12px] font-bold tabular-nums', tone, className)}>
      <Icon name="Clock" size={14} />
      {formatLeft(left, t)}
    </span>
  )
}

const Thumb = ({ src, className }: { src?: string; className?: string }) =>
  src ? <img alt="" className={cn('object-cover', className)} src={src} /> : <span className={cn('block bg-secondary', className)} />

/** Two finds as one thumbnail: mine behind, theirs in front. */
function Pair({ s }: { s: SwapItem }) {
  return (
    <span className="relative size-12 shrink-0">
      <Thumb src={s.mine.photo} className="absolute left-0 top-0 size-9 rounded-lg ring-2 ring-card" />
      <Thumb src={s.theirs.photo} className="absolute bottom-0 right-0 size-9 rounded-lg ring-2 ring-card" />
    </span>
  )
}

const ROW =
  'flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left transition-colors hover:bg-secondary aria-selected:bg-selected aria-selected:hover:bg-selected'

function OfferRow({ o, on, onPick }: { o: OfferItem; on: boolean; onPick: () => void }) {
  const { t } = useT()
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onPick} className={ROW}>
      <Thumb src={o.theirs.photo} className="size-12 shrink-0 rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-body text-label-lg text-foreground">
          {/* Titles and names are user data. */}
          <span className="truncate">{o.theirs.title}</span>
          {o.isSuper && <Icon name="Zap" size={16} filled className="shrink-0" />}
        </span>
        <span className="block truncate font-body text-body-sm text-muted-foreground">
          {o.box === 'in' ? t('desk.forYour', { who: o.who.name, title: o.mine.title }) : t('desk.youOffered', { title: o.mine.title })}
        </span>
      </span>
      <TimerPill at={o.expiresAt} className={o.box === 'out' ? 'bg-transparent text-muted-foreground' : undefined} />
    </button>
  )
}

function SwapRow({ s, on, onPick }: { s: SwapItem; on: boolean; onPick: () => void }) {
  const { t } = useT()
  const ago = useAgo()
  const first = s.who.name.split(' ')[0] || s.who.name
  const closed = s.status !== 'active'
  const line = !s.last
    ? t('desk.sayHello')
    : `${s.last.mine ? t('desk.you') : first}: ${s.last.kind === 'audio' ? t('desk.voiceNote') : s.last.body}`
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onPick} className={ROW}>
      <Pair s={s} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-body text-label-lg text-foreground">{s.who.name || t('desk.someone')}</span>
          <span className="truncate font-body text-[12px] text-muted-foreground">· {s.theirs.title}</span>
        </span>
        <span className={cn('block truncate font-body text-body-sm', s.unread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          {closed ? (s.status === 'completed' ? t('desk.swappedLine') : t('desk.calledOffLine')) : line}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-body text-[12px] text-muted-foreground">
          {ago(closed ? (s.completedAt ?? s.createdAt) : (s.last?.at ?? s.createdAt))}
        </span>
        {closed ? (
          <Icon name={s.status === 'completed' ? 'CircleCheck' : 'X'} size={18} className={s.status === 'completed' ? 'text-primary' : 'text-muted-foreground'} />
        ) : s.unread ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{s.unread}</span>
        ) : null}
      </span>
    </button>
  )
}

const GROUP_NOTE: Partial<Record<GroupId, string>> = {
  offers: 'desk.noteOffers',
  turn: 'desk.noteTurn',
  wait: 'desk.noteWait',
  sent: 'desk.noteSent',
  archive: 'desk.noteArchive',
}
/** Folded by default: the groups that need nothing from you. */
const FOLDED: GroupId[] = ['wait', 'sent', 'archive']

function useFold(id: GroupId, force: boolean) {
  const key = `bartefy.desk.${id}`
  const [open, setOpen] = React.useState(() => {
    if (force) return true
    try {
      const v = localStorage.getItem(key)
      return v === null ? !FOLDED.includes(id) : v === '1'
    } catch {
      return !FOLDED.includes(id)
    }
  })
  // Opens BY ITSELF when it becomes the only group or comes to hold the row
  // being shown -- folded there it reads as an empty page or a lost
  // selection. But it is never locked open: every group folds (the mock;
  // Alex, 2026-10-01 -- Archive had no chevron because of this lock).
  React.useEffect(() => {
    if (force) setOpen(true)
  }, [force])
  const toggle = () =>
    setOpen((v) => {
      try {
        localStorage.setItem(key, v ? '0' : '1')
      } catch {
        // A fold that is forgotten is harmless.
      }
      return !v
    })
  return [open, toggle] as const
}

function Group({ id, items, selected, onPick, carousel, alone }: {
  id: GroupId
  items: DeskItem[]
  selected: DeskItem | null
  onPick: (i: DeskItem) => void
  carousel: boolean
  alone: boolean
}) {
  const { t } = useT()
  const holdsSelected = !!selected && items.some((i) => i.id === selected.id)
  const [open, toggle] = useFold(id, alone || holdsSelected)
  if (items.length === 0) return null
  const note = GROUP_NOTE[id]

  return (
    <section className="flex flex-col">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="sticky top-0 z-[1] flex h-11 items-center gap-2 bg-card px-3 text-left"
      >
        <T as="span" k={`desk.group_${id}`} className="font-body text-label-sm uppercase text-foreground" />
        <span className="font-body text-label-md text-muted-foreground">{items.length}</span>
        {note && <span className="min-w-0 flex-1 truncate font-body text-[12px] text-muted-foreground">· {t(note)}</span>}
        {!note && <span className="flex-1" />}
        {/* The mock: down when open, pointing right when folded. */}
        <Icon name="ChevronDown" size={20} className={cn('ml-auto shrink-0 text-muted-foreground transition-transform duration-200 ease-brand', !open && '-rotate-90')} />
      </button>
      {open &&
        (carousel && id === 'offers' ? (
          // Phone: offers as a row of cards, soonest first -- "swipe".
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {(items as OfferItem[]).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onPick(o)}
                className="relative h-48 w-[248px] shrink-0 snap-start overflow-hidden rounded-2xl bg-ink text-left"
              >
                <Thumb src={o.theirs.photo} className="absolute inset-0 size-full" />
                <span className="absolute left-2.5 top-2.5">
                  <TimerPill at={o.expiresAt} />
                </span>
                {o.isSuper && (
                  <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-pill bg-sun text-ink">
                    <Icon name="Zap" size={16} filled />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-10 text-white">
                  <span className="line-clamp-1 font-body text-label-lg leading-tight">{o.theirs.title}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[12px]">
                    <span className="truncate">{t('desk.forYourShort', { who: o.who.name })}</span>
                    <Thumb src={o.mine.photo} className="size-6 shrink-0 rounded ring-1 ring-white/70" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div role="tablist" aria-label={t(`desk.group_${id}`)} className="flex flex-col gap-0.5 px-1 pb-2">
            {items.map((i) =>
              i.kind === 'offer' ? (
                <OfferRow key={i.id} o={i} on={selected?.id === i.id} onPick={() => onPick(i)} />
              ) : (
                <SwapRow key={i.id} s={i} on={selected?.id === i.id} onPick={() => onPick(i)} />
              ),
            )}
          </div>
        ))}
    </section>
  )
}

/** The left side of Swaps & offers: one-line rows grouped by what they wait on. */
export function SwapsList({
  groups,
  selected,
  onPick,
  carousel = false,
}: {
  groups: { id: GroupId; items: DeskItem[] }[]
  selected: DeskItem | null
  onPick: (i: DeskItem) => void
  /** Phone: offers as cards. */
  carousel?: boolean
}) {
  const alone = groups.filter((g) => g.items.length > 0).length === 1
  return (
    <nav className="flex flex-col divide-y divide-input">
      {groups.map((g) => (
        <Group key={g.id} id={g.id} items={g.items} selected={selected} onPick={onPick} carousel={carousel} alone={alone} />
      ))}
    </nav>
  )
}

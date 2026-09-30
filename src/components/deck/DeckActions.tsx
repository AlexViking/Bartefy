import type * as React from 'react'

import { Icon, type IconName } from '@/components/ui/icon'
import { useT } from '@/i18n/T'
import type { Tier } from '@/lib/membership'
import { cn } from '@/lib/utils'

/** deck_actions R1 (approved 2026-09-26): the app's five real actions.
 *
 *    Undo · Pass · Put on Table · Super · Boost
 *
 *  ONE loud element -- only Put on Table is filled (Green). Every circle is
 *  the same size; colour marks the primary, not scale. The cost and lock
 *  badges are status marks and carry the colour (Sun fill, Ink text). Motion
 *  is transform only, 200ms.
 *
 *  `wide` sits under the card on desktop and tablet; `compact` is the phone's
 *  bottom dock, where the actions own the bottom of the screen.
 */
export function DeckActions({
  size,
  disabled,
  points,
  tier,
  superPrice,
  boostPrice,
  canUndo,
  onUndo,
  onPass,
  onWant,
  onSuper,
  onBoost,
  bare = false,
}: {
  size: 'wide' | 'compact'
  /** No tray of its own -- the phone dock is the tray. */
  bare?: boolean
  /** No card in front of you: the card actions do nothing. */
  disabled: boolean
  points: number
  tier: Tier
  superPrice: number
  boostPrice: number
  canUndo: boolean
  onUndo: () => void
  onPass: () => void
  onWant: () => void
  onSuper: () => void
  onBoost: () => void
}) {
  const { t } = useT()
  const phone = size === 'compact'

  // The phone dock (layout C): circles graded toward the middle, the one
  // loud action biggest -- circle and icon px per action, from the mock.
  const DOCK: Record<string, [number, number]> = { undo: [56, 26], pass: [60, 28], want: [68, 32], super: [60, 28], boost: [56, 26] }

  const btn = ({
    id,
    label,
    icon,
    tone,
    loud = false,
    badge,
    dim = false,
    title,
    onClick,
    off = false,
  }: {
    id: string
    label: string
    icon: IconName
    tone?: string
    loud?: boolean
    badge?: React.ReactNode
    dim?: boolean
    title?: string
    onClick: () => void
    off?: boolean
  }) => (
    <button
      key={id}
      type="button"
      data-action={id}
      onClick={onClick}
      disabled={off}
      aria-label={title ?? label}
      title={title ?? label}
      className={cn(
        // min-w-0: the five may shrink below 80px so the row always fits the
        // card (the mock's buttons do; ours overflowed at 1404px).
        'group flex min-w-0 flex-col items-center outline-none disabled:cursor-not-allowed disabled:opacity-40',
        phone ? 'gap-1' : 'w-20 gap-1.5',
        dim && 'opacity-55',
      )}
    >
      <span
        className={cn(
          'relative grid shrink-0 place-items-center rounded-pill transition-[transform,box-shadow] duration-200 ease-brand',
          'group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:scale-95 group-focus-visible:ring-[3px] group-focus-visible:ring-ring/40',
          !phone && 'size-16',
          loud
            ? 'bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(27,107,85,0.32)] group-hover:shadow-[0_10px_24px_rgba(27,107,85,0.38)]'
            : phone
              ? 'bg-card shadow-[0_4px_14px_rgba(31,27,24,0.16)] ring-1 ring-input'
              : 'bg-card shadow-[0_2px_8px_rgba(31,27,24,0.08)] ring-1 ring-input group-hover:shadow-[0_8px_18px_rgba(31,27,24,0.14)]',
        )}
        style={phone ? { width: DOCK[id][0], height: DOCK[id][0] } : undefined}
      >
        <Icon name={icon} size={phone ? DOCK[id][1] : 28} className={loud ? undefined : tone} />
        {badge}
      </span>
      <span
        className={cn(
          'whitespace-nowrap',
          phone ? 'text-[12px] font-semibold leading-4' : 'font-body text-label-md',
          loud ? 'font-bold text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </button>
  )

  const badge = (content: React.ReactNode, tone: string) => (
    <span
      className={cn(
        'absolute -right-1.5 -top-1 flex h-5 items-center gap-0.5 rounded-pill px-1.5 text-[10px] font-bold leading-none ring-2 ring-card',
        tone,
      )}
    >
      {content}
    </span>
  )
  const cost = (n: number) =>
    badge(
      <>
        <Icon name="Coins" size={12} />
        {n}
      </>,
      points >= n ? 'bg-sun text-ink' : 'bg-secondary text-muted-foreground',
    )

  // Undo is a Collector perk (membership.ts). A Hunter still gets the one free
  // undo a session that useHunt allows -- the lock says it is a perk, not that
  // the button is dead.
  const hunter = tier === 'hunter'

  return (
    <div
      className={cn('w-full', !bare && 'rounded-card bg-card shadow-md', phone ? 'px-1 py-3' : 'px-6 py-4')}
      data-organism="deck_actions"
      data-variant={size}
    >
      <div
        role="group"
        aria-label={t('deck.actionsLabel')}
        className={cn(phone ? 'grid grid-cols-5 items-end' : 'flex items-start justify-center gap-6')}
      >
        {btn({
          id: 'undo',
          label: t('deck.undo'),
          icon: 'Undo2',
          tone: canUndo ? 'text-foreground' : 'text-muted-foreground',
          badge: hunter ? badge(<Icon name="Lock" size={12} />, 'bg-sun text-ink') : undefined,
          title: hunter ? t('deck.undoPerk') : canUndo ? t('deck.undo') : t('deck.undoNothing'),
          onClick: onUndo,
        })}
        {btn({ id: 'pass', label: t('deck.pass'), icon: 'X', tone: 'text-foreground', onClick: onPass, off: disabled })}
        {btn({
          id: 'want',
          label: t('deck.want'),
          icon: 'Handshake',
          loud: true,
          title: t('deck.wantTitle'),
          onClick: onWant,
          off: disabled,
        })}
        {btn({
          id: 'super',
          label: t('deck.super'),
          icon: 'Zap',
          tone: 'text-foreground',
          badge: cost(superPrice),
          dim: points < superPrice,
          title: points < superPrice ? t('deck.superNeed', { n: superPrice }) : t('deck.superTitle', { n: superPrice }),
          onClick: onSuper,
          off: disabled,
        })}
        {btn({
          id: 'boost',
          label: t('deck.boost'),
          icon: 'TrendingUp',
          tone: 'text-primary',
          badge: cost(boostPrice),
          dim: points < boostPrice,
          title: points < boostPrice ? t('deck.boostNeed', { n: boostPrice }) : t('deck.boostTitle', { n: boostPrice }),
          onClick: onBoost,
        })}
      </div>
    </div>
  )
}

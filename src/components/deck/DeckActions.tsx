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
        'group flex flex-col items-center gap-1.5 outline-none disabled:cursor-not-allowed disabled:opacity-40',
        phone ? 'w-[66px]' : 'w-20',
        dim && 'opacity-55',
      )}
    >
      <span
        className={cn(
          'relative grid place-items-center rounded-pill transition-[transform,box-shadow] duration-200 ease-brand',
          'group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:scale-95 group-focus-visible:ring-[3px] group-focus-visible:ring-ring/40',
          phone ? 'size-[52px]' : 'size-16',
          loud
            ? 'bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(27,107,85,0.32)] group-hover:shadow-[0_10px_24px_rgba(27,107,85,0.38)]'
            : 'bg-card shadow-[0_2px_8px_rgba(31,27,24,0.08)] ring-1 ring-input group-hover:shadow-[0_8px_18px_rgba(31,27,24,0.14)]',
        )}
      >
        <Icon name={icon} size={phone ? 24 : 28} className={loud ? undefined : tone} />
        {badge}
      </span>
      <span
        className={cn(
          'whitespace-nowrap',
          phone ? 'text-[11px] font-semibold leading-[14px]' : 'font-body text-label-md',
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
      className={cn('w-full', !bare && 'rounded-card bg-card shadow-md', phone ? 'px-2 py-3' : 'px-8 py-4')}
      data-organism="deck_actions"
      data-variant={size}
    >
      <div role="group" aria-label={t('deck.actionsLabel')} className={cn('flex items-start justify-center', phone ? 'gap-1' : 'gap-6')}>
        {btn({
          id: 'undo',
          label: t('deck.undo'),
          icon: 'Undo2',
          tone: canUndo ? 'text-foreground' : 'text-muted-foreground',
          badge: hunter ? badge(<Icon name="Lock" size={12} />, 'bg-sun text-ink') : undefined,
          dim: !canUndo,
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

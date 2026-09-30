import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Bartefy's avatar: shadcn's Avatar plus the things every screen needs from
 *  it — initials derived from a name, an optional verified tick, and one size
 *  scale so avatars never drift between screens.
 *
 *  shadcn's Avatar stays untouched underneath; this only composes it.
 */
const SIZES = {
  xs: 'size-7 text-[11px]',
  sm: 'size-8 text-[13px]',
  md: 'size-10 text-[15px]',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
} as const

export type AvatarSize = keyof typeof SIZES

function initialsFrom(name: string) {
  // An email is a common fallback when the profile has no name yet, and
  // initialling the raw string gives the first character of the local part --
  // "3" for 3ds.alex@… . Take the local part and split it on the separators
  // people actually use in an address, so that reads "DA" rather than "3".
  const source = name.includes('@') ? name.split('@')[0].replace(/[._\-+]+/g, ' ') : name
  const parts = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    // Digits alone are not initials -- an address like 3ds.alex should give
    // "A", not "3".
    .filter((p) => /\p{L}/u.test(p))
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function UserAvatar({
  name,
  src,
  size = 'md',
  tone = 'quiet',
  verified = false,
  className,
  ...props
}: {
  name: string
  src?: string | null
  size?: AvatarSize
  /** `accent` fills the initials circle in brass. Used for the signed-in
   *  person's own avatar in the topbar, so it matches the notification dot
   *  and reads as "you" rather than as one more grey circle. */
  tone?: 'quiet' | 'accent'
  verified?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useT()
  return (
    // Round, so a ring passed in className (the deck card's white ring)
    // draws as a circle, not as a square box around one.
    // The size sits on this wrapper and the circle fills it, so a caller's
    // size class (size-6, size-9) resizes the avatar itself -- it used to
    // resize only the box, leaving a 32px circle spilling out of it.
    <div className={cn('relative inline-flex shrink-0 rounded-pill', SIZES[size], className)} {...props}>
      <Avatar className="size-full border border-border/[0.14]">
        {src && <AvatarImage src={src} alt={t('a11y.avatarOf', { name })} />}
        <AvatarFallback
          className={cn(
            'font-display font-semibold',
            tone === 'accent'
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-foreground',
          )}
        >
          {initialsFrom(name)}
        </AvatarFallback>
      </Avatar>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-pill bg-background p-px"
          title={t('common.moreInfo')}
        >
          <Icon name="BadgeCheck" className="size-3.5 text-primary" aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

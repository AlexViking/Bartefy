import * as React from 'react'
import { BadgeCheck } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Bartefy's avatar: shadcn's Avatar plus the things every screen needs from
 *  it — initials derived from a name, an optional verified tick, and one size
 *  scale so avatars never drift between screens.
 *
 *  shadcn's Avatar stays untouched underneath; this only composes it.
 */
const SIZES = {
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
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <Avatar className={cn(SIZES[size], 'border border-border/[0.14]')}>
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
          <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

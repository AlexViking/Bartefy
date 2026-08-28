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
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function UserAvatar({
  name,
  src,
  size = 'md',
  verified = false,
  className,
  ...props
}: {
  name: string
  src?: string | null
  size?: AvatarSize
  verified?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useT()
  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <Avatar className={cn(SIZES[size], 'border border-border/[0.14]')}>
        {src && <AvatarImage src={src} alt={t('a11y.avatarOf', { name })} />}
        <AvatarFallback className="bg-secondary font-display font-semibold text-foreground">
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

import * as React from 'react'
import { cn } from '@/lib/utils'

/** Accent fills for initials. Illustration accents are fine here - an avatar is
 *  a portrait stand-in, not a status. A person keeps their color because it is
 *  derived from their name, not from render order.
 */
const FILLS = ['bg-illo-denim', 'bg-illo-terracotta', 'bg-illo-sage', 'bg-primary'] as const

export function fillForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 9973
  return FILLS[hash % FILLS.length]
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  initials?: string
  src?: string
  size?: number
  /** Green dot: ID verified. Nothing else earns a dot. */
  verified?: boolean
}

export function Avatar({
  name = '',
  initials,
  src,
  size = 40,
  verified = false,
  className,
  ...props
}: AvatarProps) {
  const text = (initials ?? name.slice(0, 2) ?? '?').toUpperCase()
  const dot = Math.max(12, Math.round(size * 0.32))

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }} {...props}>
      <div
        className={cn(
          'flex h-full w-full items-center justify-center overflow-hidden rounded-full',
          src ? 'bg-transparent' : fillForName(name || text),
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: Math.round(size * 0.4) }}
          >
            {text}
          </span>
        )}
      </div>
      {verified && (
        <span
          aria-label="ID verified"
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-primary"
          style={{ width: dot, height: dot }}
        />
      )}
    </div>
  )
}

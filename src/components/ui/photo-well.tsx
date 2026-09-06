import * as React from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

/** The atom that has to hold reality: phone photos on bad signal.
 *  Every state is designed - empty, uploading, failed, ready - because losing a
 *  photo someone already took is the worst thing this product can do.
 */
export type PhotoState = 'empty' | 'uploading' | 'failed' | 'ready'

export interface PhotoWellProps {
  state?: PhotoState
  src?: string
  /** 0-1, only read while uploading */
  progress?: number
  swatch?: string
  onPick?: () => void
  onRetry?: () => void
  onRemove?: () => void
  className?: string
}

export function PhotoWell({
  state = 'empty',
  src,
  progress = 0,
  swatch,
  onPick,
  onRetry,
  onRemove,
  className,
}: PhotoWellProps) {
  const base = 'relative aspect-square w-full overflow-hidden rounded-sm'

  if (state === 'empty') {
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          base,
          'flex flex-col items-center justify-center gap-1 border-[1.5px] border-dashed border-border/[0.14] bg-secondary text-muted-foreground transition-colors duration-fast ease-brand hover:bg-secondary/70',
          className,
        )}
      >
        <Icon name="Camera" size={20} />
        <span className="font-body text-xs">Add photo</span>
      </button>
    )
  }

  if (state === 'failed') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(base, 'flex flex-col items-center justify-center gap-1 bg-secondary px-2 text-center', className)}
      >
        <Icon name="RotateCcw" size={18} />
        <span className="font-body text-xs text-muted-foreground">Didn't send - tap to retry</span>
      </button>
    )
  }

  return (
    <div className={cn(base, className)} style={{ background: swatch }}>
      {src && <img src={src} alt="" className="h-full w-full object-contain" />}
      {state === 'uploading' && (
        <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-pill bg-card/70">
          <div
            className="h-full rounded-pill bg-primary transition-[width] duration-med ease-brand"
            style={{ width: Math.round(progress * 100) + '%' }}
          />
        </div>
      )}
      {state === 'ready' && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-foreground"
        >
          <Icon name="X" size={14} />
        </button>
      )}
    </div>
  )
}

export function PhotoWellGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {children}
    </div>
  )
}

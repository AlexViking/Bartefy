import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { useIsDesktop } from '@/hooks/use-media-query'

/** T5 - Interruption.
 *  One component, two shapes: bottom sheet on mobile, centred modal on desktop.
 *  Replaces src/components/Sheet.tsx - Radix gives focus trap, ESC, scroll lock
 *  and correct dialog semantics, none of which the hand-rolled version had.
 *
 *  Match celebration, offer composer, confirm+rate and "something's wrong" all
 *  mount through here, so nobody ever loses their place in the hunt.
 */
export interface ResponsiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  /** Mobile height. Ignored on desktop, where the modal sizes to content. */
  height?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  height = '76%',
  footer,
  children,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-foreground/35 animate-fade-in" />
        <Dialog.Content
          style={isDesktop ? undefined : { height }}
          className={cn(
            'fixed z-[101] flex flex-col overflow-hidden bg-card shadow-float outline-none animate-sheet-up',
            isDesktop
              ? 'left-1/2 top-1/2 w-[min(560px,calc(100vw-48px))] max-h-[86vh] -translate-x-1/2 -translate-y-1/2 rounded-hero'
              : 'inset-x-0 bottom-0 rounded-t-hero',
          )}
        >
          {!isDesktop && (
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-sm bg-foreground/[0.14]" />
            </div>
          )}

          {(title || description) && (
            <div className="border-b border-foreground/[0.14] px-6 pb-4 pt-2">
              {title && (
                <Dialog.Title className="font-display text-h3 text-foreground">{title}</Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-1 font-body text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">{children}</div>

          {footer && (
            <div className="border-t border-foreground/[0.14] bg-card px-6 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetClose = Dialog.Close

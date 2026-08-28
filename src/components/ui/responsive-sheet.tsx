import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsDesktop } from '@/lib/platform'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** T5 — Interruption. One component, two genuinely different shapes:
 *  a bottom sheet on a phone, a centred modal on a desktop.
 *
 *  Match celebration, offer composer, confirm+rate and "something's wrong" all
 *  mount through here, so nobody ever loses their place in the hunt.
 *
 *  Both shapes come from shadcn, which gives focus trap, ESC, scroll lock and
 *  correct dialog semantics. Titles and descriptions are translation keys.
 */
export interface ResponsiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Translation key. */
  title?: string
  /** Translation key. */
  description?: string
  titleValues?: Record<string, string | number>
  descriptionValues?: Record<string, string | number>
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  titleValues,
  descriptionValues,
  footer,
  children,
  className,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop()
  const { t } = useT()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-[440px] rounded-hero', className)}>
          {(title || description) && (
            <DialogHeader>
              {title && (
                <DialogTitle data-i18n={title} className="font-display text-h3 text-foreground">
                  {t(title, titleValues)}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription
                  data-i18n={description}
                  className="font-body text-muted-foreground"
                >
                  {t(description, descriptionValues)}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          <div className="max-h-[62dvh] overflow-y-auto">{children}</div>
          {footer && <DialogFooter className="sm:flex-col sm:space-x-0">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('max-h-[92dvh] rounded-t-hero pb-[max(16px,env(safe-area-inset-bottom))]', className)}
      >
        {(title || description) && (
          <SheetHeader className="text-left">
            {title && (
              <SheetTitle data-i18n={title} className="font-display text-h3 text-foreground">
                {t(title, titleValues)}
              </SheetTitle>
            )}
            {description && (
              <SheetDescription data-i18n={description} className="font-body text-muted-foreground">
                {t(description, descriptionValues)}
              </SheetDescription>
            )}
          </SheetHeader>
        )}
        <div className="max-h-[64dvh] overflow-y-auto py-2">{children}</div>
        {footer && <SheetFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

import * as React from 'react'
import { useNavigate } from 'react-router'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useT } from '@/i18n/T'
import { signOut } from '@/lib/api'
import { resetLocal } from '@/lib/resetLocal'

/** The phone's version of a top-bar popover: a bottom sheet with a grab
 *  handle, white on the dimmed page, the same body the popover shows. */
export function ShellSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** i18n key, read by screen readers only -- the body carries its own. */
  title: string
  children: React.ReactNode
}) {
  const { t } = useT()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Hides shadcn's own close X (the grab handle and a tap outside close
        // it). The body is wrapped below so this selector can only ever match
        // that one button -- unwrapped, it hid every row of the You sheet.
        className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-2xl border-0 bg-card p-0 pb-[env(safe-area-inset-bottom)] [&>button]:hidden"
        // Radix focuses the first control on open, which drew a focus ring on
        // a link nobody had reached. The sheet itself takes focus instead.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">{t(title)}</SheetTitle>
        <div>
          <div className="flex justify-center pb-1 pt-2.5">
            <span aria-hidden="true" className="h-1 w-10 rounded-pill bg-input" />
          </div>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Sign out, then the sign-in screen. resetLocal clears the persisted caches
 *  so the next person on a shared phone does not see this one's finds. */
export function useSignOut() {
  const navigate = useNavigate()
  return async () => {
    await resetLocal({ signOut })
    navigate('/')
  }
}

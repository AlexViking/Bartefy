import * as React from 'react'

import { cn } from '@/lib/utils'

/** The page's content column, and the one place its width is decided.
 *
 *  Nine single-file screens each carried their own `mx-auto max-w-[...]`, at
 *  560, 640, 720 and 1160px, with no rule behind which got which. On a 1440px
 *  desktop the narrow ones left a third of the window empty beside a centred
 *  column -- the rail on one side, nothing on the other.
 *
 *  Two widths, by what the page IS:
 *
 *  - `reading`  a column of rows and settings. Capped so a line of body text
 *               never runs past a comfortable measure, and on a wide screen
 *               its sections flow into two columns instead of stretching.
 *  - `wide`     a grid of cards that genuinely wants the room (My items,
 *               Profile, Membership).
 *
 *  Mobile is one column at every width -- `columns` only ever applies from
 *  the large breakpoint up.
 */
export function PageBody({
  variant = 'reading',
  className,
  children,
}: {
  variant?: 'reading' | 'wide'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 pb-10 pt-4 sm:px-5',
        variant === 'wide' ? 'max-w-[1160px]' : 'max-w-[1100px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Sections laid out in two columns on a wide screen, one everywhere else.
 *
 *  CSS columns rather than a grid: the sections have different heights, and a
 *  grid would leave a ragged gap under the shorter one in each row. `columns`
 *  fills top-to-bottom and balances, which is what a settings page wants.
 *
 *  break-inside-avoid on the children is what stops a card being sliced in
 *  half across the column boundary -- without it a Card can start at the
 *  bottom of the left column and finish at the top of the right.
 */
export function PageColumns({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('lg:columns-2 lg:gap-6 [&>*]:break-inside-avoid', className)}>
      {children}
    </div>
  )
}

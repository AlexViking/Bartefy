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
  // Both variants share one width now, so this no longer changes the output.
  // It is kept because it still says what a page IS at every call site, and
  // because the two will diverge again the moment a reading page needs a
  // narrower measure than a card grid.
  variant: _variant = 'reading',
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
        // One width for both variants, so the title starts at the same x on
        // every screen. They were 1160 and 1100, which centred to a 30px
        // difference -- invisible on any one page, and a visible jog the
        // moment you moved between destinations.
        //
        // `wide` still differs in what it CONTAINS (a card grid rather than a
        // reading column); it no longer differs in where the page begins.
        'mx-auto w-full max-w-[1160px] px-4 pb-10 pt-4 sm:px-5',
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

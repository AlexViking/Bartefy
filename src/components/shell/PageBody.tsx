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
/** The page's side padding, as one string.
 *
 *  Exported because a screen that builds its own shell -- the two-pane inbox,
 *  which cannot use PageBody -- still has to breathe like every other page.
 *  Matches was left on the old `px-4 sm:px-5` when PageBody moved to this
 *  scale, so its list sat 21px from the rail while My items sat 59px from it:
 *  the same app with two different margins depending on which tab you were on.
 */
export const PAGE_PX = 'px-6 lg:px-10 xl:px-14'

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
        // Fills the pane, with generous side padding -- NOT a centred 1160px
        // column.
        //
        // The cap was written and checked at 1440, where 1160 nearly fills the
        // content pane so it reads as a page. On a 1920 screen the same cap
        // leaves ~500px of dead parchment on the right and pushes every title,
        // tab strip and card into the left third: the content looked
        // abandoned in the corner of its own window.
        //
        // A reading column still needs a measure -- that is what `prose-col`
        // on the section inside does -- but the PAGE should own its pane.
        'w-full pb-10 pt-4',
        PAGE_PX,
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
    <div
      className={cn(
        // Three columns from xl, because at 1920 two columns of settings rows
        // are each ~880px wide -- a switch stranded a full screen-width from
        // the label it belongs to.
        'lg:columns-2 lg:gap-6 xl:columns-3 xl:gap-8 [&>*]:break-inside-avoid',
        className,
      )}
    >
      {children}
    </div>
  )
}

import { createScreen } from '@/lib/platform'

/** T1 — the feed. Mobile is a full-screen stack with filters in a sheet;
 *  desktop is filters / stack / detail in three panes. Same behaviour from
 *  useHunt, two genuinely different layouts.
 */
export const Hunt = createScreen({
  mobile: () => import('./Hunt.mobile'),
  desktop: () => import('./Hunt.desktop'),
})

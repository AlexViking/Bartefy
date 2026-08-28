import { createScreen } from '@/lib/platform'

/** T3 — gallery. Swiping is discovery; this is how people look for something
 *  specific. Zero results is never a blank grid.
 */
export const Browse = createScreen({
  mobile: () => import('./Browse.mobile'),
  desktop: () => import('./Browse.desktop'),
})

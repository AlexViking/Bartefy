import { createScreen } from '@/lib/platform'

/** T4 — listing a find. Mobile walks three steps (camera first, typing last);
 *  desktop shows the whole form at once, because it has the room.
 */
export const AddItem = createScreen({
  mobile: () => import('./AddItem.mobile'),
  desktop: () => import('./AddItem.desktop'),
})

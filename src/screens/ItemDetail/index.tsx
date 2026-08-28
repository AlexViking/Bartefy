import { createScreen } from '@/lib/platform'

/** S1 — the one screen with a shareable link. Mobile is a full-bleed photo
 *  with a pinned offer bar; desktop puts the photo and the decision side by
 *  side, so nothing needs pinning.
 */
export const ItemDetail = createScreen({
  mobile: () => import('./ItemDetail.mobile'),
  desktop: () => import('./ItemDetail.desktop'),
})

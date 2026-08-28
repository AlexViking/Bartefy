import { createScreen } from '@/lib/platform'

/** Sign-in. One progressive screen: Login, Register and Welcome collapsed into
 *  this, because a magic link needs no password, no confirm field and no
 *  second step.
 */
export const Auth = createScreen({
  mobile: () => import('./Auth.mobile'),
  desktop: () => import('./Auth.desktop'),
})

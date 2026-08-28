import { createScreen } from '@/lib/platform'

/** The thread. Mobile is full-screen with the swap behind a menu; desktop
 *  keeps the two items permanently in view beside the conversation.
 */
export const Chat = createScreen({
  mobile: () => import('./Chat.mobile'),
  desktop: () => import('./Chat.desktop'),
})

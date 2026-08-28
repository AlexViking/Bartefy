import { useQuery } from '@tanstack/react-query'

import { getUnreadCount } from './api'
import { keys } from './cache/queryClient'
import { useAuthStore } from '@/store/auth'

/** How many messages are waiting for you, for the dot on Swaps.
 *
 *  Deliberately not polled. `useRealtime` already invalidates this key when a
 *  message arrives, so the badge updates on the same websocket frame that
 *  delivers the message — the push-not-poll rule applies to the count as much
 *  as to the thread it counts.
 */
export function useUnread() {
  const userId = useAuthStore((s) => s.session?.user?.id)

  const { data = 0 } = useQuery({
    queryKey: keys.unread(userId ?? ''),
    queryFn: async () => {
      const { count, error } = await getUnreadCount(userId!)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
  })

  return data
}

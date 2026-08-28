import { Navigate, useParams } from 'react-router'

/** Legacy deep-link target. Rating is part of ConfirmAndRateSheet on the swap
 *  itself now — confirming receipt and rating are one step, not two screens.
 *  Older push notifications still link here, so this lands them on the swap
 *  where that sheet opens.
 */
export function Rate() {
  const { matchId } = useParams<{ matchId: string }>()
  return <Navigate to={matchId ? `/swaps/${matchId}` : '/swaps'} replace />
}

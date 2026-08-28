import { Navigate, useParams } from 'react-router'

/** Legacy deep-link target. The match celebration is a sheet over Hunt now,
 *  not a page — but push notifications sent before that change still point
 *  here, so the link has to keep working. It resolves to the thread, which is
 *  where someone tapping "It's a bartefy!" actually wants to end up.
 */
export function Match() {
  const { matchId } = useParams<{ matchId: string }>()
  return <Navigate to={matchId ? `/swaps/${matchId}` : '/swaps'} replace />
}

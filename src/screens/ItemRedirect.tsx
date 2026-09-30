import { Navigate, useParams } from 'react-router'

import { useMyFinds } from '@/screens/MyFinds/useMyFinds'

/** /item/:publicId -- Item detail is CUT in V6 (Alex, 2026-09-29: "why do we
 *  need it when Discover shows everything?"). Old links still exist in
 *  notifications, bookmarks and messages, so they land somewhere real: your
 *  own find opens in My finds; anyone else's is met in the deck, where finds
 *  are seen. */
export default function ItemRedirect() {
  const { itemId = '' } = useParams<{ itemId: string }>()
  const m = useMyFinds()
  if (!m.settled) return null
  const mine = m.finds.find((f) => f.publicId === itemId)
  return <Navigate to={mine ? `/items/${mine.publicId}` : '/discover'} replace />
}

import { useState } from 'react'
import { barterErrorKey, makeOffer, renewItem } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import type { OfferOption } from '@/screens/Hunt/useHunt'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteItem, getItem, getMyItems, setItemStatus } from '@/lib/api'
import { DEFAULT_CONDITION, categoryLabel, conditionAt, splitWants } from '@/lib/taxonomy'
import { keys, STALE } from '@/lib/cache/queryClient'
import type { ItemRef, PersonRef } from '@/types/swap'

const PLACEHOLDERS = [
  'hsl(var(--illo-terracotta))',
  'hsl(var(--illo-denim))',
  'hsl(var(--illo-sage))',
  'hsl(var(--accent))',
]

/** The find, its owner and the offer state — with no layout in it. */
export function useItemDetail() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [offerOpen, setOfferOpen] = useState(false)
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [sending, setSending] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [photo, setPhoto] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.item(itemId ?? ''),
    queryFn: async () => {
      const { data: row, error } = await getItem(itemId!)
      if (error) throw error
      return row as Record<string, unknown>
    },
    enabled: !!itemId,
    staleTime: STALE.item,
  })

  // A find that failed to load, was deleted, or never existed must say so.
  // Returning "not ready" for an error left the screen on "Just a moment…"
  // forever, which is indistinguishable from a hang.
  if (isError || (!isLoading && !data)) {
    return { ready: false as const, isLoading: false, notFound: true as const, goBack: () => navigate(-1) }
  }
  if (isLoading || !data) {
    return { ready: false as const, isLoading, notFound: false as const, goBack: () => navigate(-1) }
  }

  const photos = Array.isArray(data.images) ? (data.images as string[]) : []
  const hasRealPhotos = photos.length > 0 && photos[0]?.startsWith('http')
  const ownerData = data.owner as Record<string, unknown> | null
  // get_item_detail returns eyeing_count as a scalar, not an embedded row.

  const item = {
    id: String(data.id),
    title: String(data.title ?? ''),
    // Stored values normalise through the taxonomy: v2 rows hold categories
    // this build never defined, and they still have to render.
    category: categoryLabel(data.category),
    condition: conditionAt(Number(data.condition ?? DEFAULT_CONDITION)).label,
    description: String(data.description ?? ''),
    // get_item_detail returns `wants`, not the column name. The free-text
    // wish is stored in the same array behind a prefix; it is shown as a
    // sentence, not as a chip that looks matchable.
    wants: splitWants(data.wants).categories,
    wantsNote: splitWants(data.wants).note,
    eyeing: data.eyeing_count != null ? Number(data.eyeing_count) : 0,
    reserved: data.status === 'reserved',
  }

  const owner: PersonRef = {
    id: String(data.user_id ?? ''),
    name: String(ownerData?.name ?? ownerData?.display_name ?? ''),
    rating: ownerData?.rating != null ? Number(ownerData.rating) : undefined,
    swapCount: ownerData?.swap_count != null ? Number(ownerData.swap_count) : 0,
    verified: Boolean(ownerData?.verified),
    distanceLabel: String(data.location_city ?? ''),
  }

  const theirItem: ItemRef = {
    id: item.id,
    title: item.title,
    photoUrl: hasRealPhotos ? photos[0] : undefined,
    photoColor: PLACEHOLDERS[0],
    condition: item.condition,
  }

  /** One list for the gallery whether the photos are real or placeholders, so
   *  neither layout has to branch on it. */
  const gallery = (hasRealPhotos ? photos : PLACEHOLDERS).map((entry, i) => ({
    url: hasRealPhotos ? entry : undefined,
    color: hasRealPhotos ? undefined : entry,
    index: i,
  }))

  /** Ownership comes from the server's row, never from which screen navigated
   *  here. It swaps the entire action set: you manage your own listing, and
   *  you cannot offer a swap to yourself. */
  const owned = !!userId && owner.id === userId

  /** My own listings, for the offer sheet. Fetched here rather than passed in,
   *  because the sheet is opened from this screen and nothing above it knows
   *  what I have to trade. */
  const { data: mineRaw = [] } = useQuery({
    queryKey: keys.myItems(userId ?? ''),
    queryFn: async () => {
      const { data: rows, error: err } = await getMyItems(userId!)
      if (err) throw err
      return (rows ?? []) as Record<string, unknown>[]
    },
    enabled: !!userId && !owned,
  })

  const myOfferables: OfferOption[] = mineRaw
    // Only an available find can be put on the table. A reserved one is
    // already promised, and offering it twice is the double-spend the
    // database refuses anyway -- better not to show it at all.
    .filter((r) => String(r.status ?? '') === 'active')
    .map((r) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      photoUrl: Array.isArray(r.images) && r.images.length > 0 ? String(r.images[0]) : undefined,
    }))

  const sendOffer = async (offeredItemId: string, note?: string) => {
    if (sending) return
    setSending(true)
    setOfferError(null)
    const { error: rpcError } = await makeOffer({
      offeredItemId: Number(offeredItemId),
      wantedItemId: Number(item.id),
      note,
    })
    setSending(false)
    if (rpcError) {
      setOfferError(barterErrorKey(rpcError))
      return
    }
    setOfferOpen(false)
    navigate('/offers?tab=sent')
  }

  return {
    ready: true as const,
    isLoading: false,
    item,
    owner,
    owned,
    theirItem,
    gallery,
    photo,
    setPhoto,
    viewerOpen,
    setViewerOpen,
    /** Only real photos open in the viewer: enlarging a placeholder colour
     *  well shows a full screen of flat colour. */
    realPhotos: hasRealPhotos ? photos : [],
    offerOpen,
    setOfferOpen,
    myOfferables,
    sendOffer,
    sending,
    offerError,
    goAdd: () => navigate('/add'),
    goBack: () => navigate(-1),
    goOwner: () => navigate('/u/' + owner.id),
    goEdit: () => navigate('/add?edit=' + item.id),
    removing,
    setRemoving,
    /** Pausing takes a find out of the deck without losing it -- for someone
     *  going away, not someone giving up on the listing. */
    togglePause: async () => {
      const next = data.status === 'paused' ? 'active' : 'paused'
      const { error: e } = await setItemStatus(String(item.id), next)
      if (e) return setOfferError('barter.errorGeneric')
      await queryClient.invalidateQueries({ queryKey: keys.item(String(item.id)) })
    },
    paused: data.status === 'paused',
    renew: async () => {
      const { error: e } = await renewItem(String(item.id))
      if (e) return setOfferError(barterErrorKey(e))
      await queryClient.invalidateQueries({ queryKey: keys.item(String(item.id)) })
    },
    /** Soft delete, never a hard one: status goes to 'removed' and the row
     *  stays. The scope contract makes hard-delete an admin-only action, and
     *  a listing that vanished has no audit trail behind a dispute. */
    removeItem: async () => {
      const { error: delError } = await deleteItem(String(item.id))
      if (delError) {
        setOfferError('barter.errorGeneric')
        return
      }
      setRemoving(false)
      navigate('/profile')
    },
  }
}

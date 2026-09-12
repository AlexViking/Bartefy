import { useState } from 'react'
import { barterErrorKey, makeOffer, renewItem } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import { useMembershipStore } from '@/store/membership'
import type { OfferOption } from '@/screens/Hunt/useHunt'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteItem, getItem, getMyItems, saveItem, setItemStatus, unsaveItem } from '@/lib/api'
import { supabase } from '@/lib/supabase'
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
  // The route param is the PUBLIC token now (migration 029), not items.id.
  const { itemId: publicId } = useParams()
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
    queryKey: keys.item(publicId ?? ''),
    queryFn: async () => {
      const { data: row, error } = await getItem(publicId!)
      if (error) throw error
      return row as Record<string, unknown>
    },
    enabled: !!publicId,
    staleTime: STALE.item,
  })

  /* Every hook below runs on EVERY render, before the early returns.
   *
   * They used to sit after them, which is the bug behind "This part did not
   * load": the first render of a navigation is isLoading, returns early and
   * runs two hooks; the render after the data lands falls through and runs
   * four. React sees the hook count change and throws, and the ErrorBoundary
   * catches it. A refresh "fixed" it because the persisted cache made the
   * very first render a loaded one, so the count never changed.
   *
   * eslint had been reporting this as react-hooks/rules-of-hooks the whole
   * time. It is the one lint rule that is never cosmetic.
   */

  /** The bigint, once the row is here. saves.item_id is a foreign key to
   *  items.id, so this half of the screen keys on the number, not the token. */
  const itemPk = data && data.id != null ? String(data.id) : null

  /** Whether the find is mine. Read from the row, never from which screen
   *  navigated here -- it swaps the entire action set. */
  const ownedByMe = !!userId && !!data && (data.owner as Record<string, unknown> | null)?.id === userId

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
    enabled: !!userId && !ownedByMe,
  })

  /** Have I saved this find? The `saves` table and its API have been there
   *  since migration 005 and nothing ever called them, which is also why
   *  Profile's Eyeing tab could only ever render empty. */
  const { data: saved = false } = useQuery({
    queryKey: ['saved', userId ?? '', itemPk ?? ''],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('saves')
        .select('item_id')
        .eq('user_id', userId!)
        .eq('item_id', Number(itemPk))
        .maybeSingle()
      if (error) return false
      return !!rows
    },
    enabled: !!userId && !!itemPk,
    staleTime: STALE.mine,
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
    /** The bigint. Offers and saves key on it. */
    id: String(data.id),
    /** The URL token. Falls back to the route param, which IS the token --
     *  so a link still works even if the RPC ever stops returning it. */
    publicId: String(data.public_id ?? publicId ?? ''),
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
  // Same value as ownedByMe above, which had to be computed before the early
  // returns so the offer-sheet query could be enabled from it. Aliased rather
  // than recomputed so the two can never disagree.
  const owned = ownedByMe


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

  /** Whether this find is on my "eyeing" list.
   *
   *  The Save button existed on both platforms with no handler at all -- the
   *  `saves` table and its API have been there since migration 005 and nothing
   *  ever called them, which is also why Profile's Eyeing tab could only ever
   *  render empty. */

  const canSeeEyeing = useMembershipStore.getState().can('see_eyeing')

  const toggleSave = async () => {
    // itemPk is the bigint, hoisted above the early returns with the query.
    if (!userId || !itemPk) return
    const next = !saved
    // Optimistic: a heart that waits for a round trip feels broken.
    queryClient.setQueryData(['saved', userId, itemPk], next)
    const { error } = next
      ? await saveItem(userId, itemPk)
      : await unsaveItem(userId, itemPk)
    if (error) {
      queryClient.setQueryData(['saved', userId, itemPk], !next)
      return
    }
    // The Eyeing tab reads this list.
    void queryClient.invalidateQueries({ queryKey: ['saves', userId] })
  }

  return {
    ready: true as const,
    /** Whether the names behind the eyeing count are visible. The COUNT is
     *  always free; this gates only who. */
    canSeeEyeing,
    saved,
    toggleSave,
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
    // The token, not the bigint. NOTE: AddItem never reads ?edit, so this
    // opens a blank form -- editing a listing is genuinely unbuilt (AUDIT.md).
    // Left as-is here; this change is only about what the URL exposes.
    goEdit: () => navigate('/add?edit=' + item.publicId),
    removing,
    setRemoving,
    /** Pausing takes a find out of the deck without losing it -- for someone
     *  going away, not someone giving up on the listing. */
    togglePause: async () => {
      const next = data.status === 'paused' ? 'active' : 'paused'
      const { error: e } = await setItemStatus(String(item.id), next)
      if (e) return setOfferError('barter.errorGeneric')
      // keys.item is keyed by the PUBLIC token since migration 029 -- passing
      // the bigint here invalidated a cache entry that does not exist, so the
      // screen kept rendering the pre-change row.
      await queryClient.invalidateQueries({ queryKey: keys.item(item.publicId) })
      // And My Items, which owns the Paused tab. Prefix form so both scopes
      // refresh: without this a paused find stayed in the Live tab until a
      // hard refresh.
      await queryClient.invalidateQueries({ queryKey: ['my-items', userId] })
    },
    paused: data.status === 'paused',
    renew: async () => {
      const { error: e } = await renewItem(String(item.id))
      if (e) return setOfferError(barterErrorKey(e))
      // keys.item is keyed by the PUBLIC token since migration 029 -- passing
      // the bigint here invalidated a cache entry that does not exist, so the
      // screen kept rendering the pre-change row.
      await queryClient.invalidateQueries({ queryKey: keys.item(item.publicId) })
      // And My Items, which owns the Paused tab. Prefix form so both scopes
      // refresh: without this a paused find stayed in the Live tab until a
      // hard refresh.
      await queryClient.invalidateQueries({ queryKey: ['my-items', userId] })
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

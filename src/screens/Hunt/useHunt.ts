import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/lib/taxonomy'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { fetchFeed, getMyItems, recordSwipe } from '@/lib/api'
import { barterErrorKey, makeOffer } from '@/lib/barter'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { useHuntStore, type CardItem } from '@/store/hunt'
import { useOnboardingStore } from '@/store/onboarding'
import { DEFAULT_CITY } from '@/screens/Onboarding/useOnboarding'

/** One taxonomy for the whole app — see lib/taxonomy.ts. Hunt, AddItem and
 *  onboarding all used to keep their own drifting copies. */

/** One of my finds, as offered in the hunt picker. */
export interface OfferOption {
  id: string
  title: string
  photoUrl?: string
}

/** All of Hunt's behaviour, with no layout in it. Both platform layouts call
 *  this, so the feed, the swipe rules and the match handling can never diverge
 *  between phone and desktop.
 */
export function useHunt() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const city = useAuthStore((s) => s.selectedCity) || DEFAULT_CITY
  const tastes = useOnboardingStore((s) => s.tastes)

  const cards = useHuntStore((s) => s.cardQueue)
  const selectedOfferId = useHuntStore((s) => s.selectedOfferId)
  const setSelectedOfferId = useHuntStore((s) => s.setSelectedOfferId)
  const setCardQueue = useHuntStore((s) => s.setCardQueue)
  const removeTopCard = useHuntStore((s) => s.removeTopCard)
  const passTopCard = useHuntStore((s) => s.passTopCard)
  const unpass = useHuntStore((s) => s.unpass)
  const lastPassed = useHuntStore((s) => s.lastPassed)
  const addToLikeHistory = useHuntStore((s) => s.addToLikeHistory)

  /** Onboarding's taste picker still seeds what the deck prefers, but there is
   *  no filter UI any more: the app does not filter, and the chips only ever
   *  changed the query key. fetchFeed was never given them, so toggling one
   *  refetched an identical feed and appeared to do nothing. */
  const tasteIds = CATEGORIES.filter((c) => tastes.includes(c.id)).map((c) => c.id)
  const [radiusKm, setRadiusKm] = useState(10)
  const [matched, setMatched] = useState<CardItem | null>(null)
  /** Title of the find an offer was just sent for, for the confirmation. */
  const [sentTitle, setSentTitle] = useState<string | null>(null)

  /** The finds I could put on the table. Hunting is a trade, so which of my
   *  own items I am offering is part of the question — it was previously
   *  decided for me by whichever item the other person happened to like last. */
  const { data: myItems = [] } = useQuery({
    queryKey: keys.myItems(userId ?? ''),
    queryFn: async () => {
      const { data, error: itemsError } = await getMyItems(userId!)
      if (itemsError) throw itemsError
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: !!userId,
  })

  const offers: OfferOption[] = myItems.map((it) => ({
    id: String(it.id),
    title: String(it.title ?? ''),
    photoUrl: Array.isArray(it.images) && it.images.length > 0 ? String(it.images[0]) : undefined,
  }))

  /** Pick the first find by default, and drop a stale choice: an item that has
   *  since been swapped or deleted is no longer offerable, and leaving it
   *  selected would silently offer something the user no longer has. */
  // Depends on the joined ids rather than `offers`, which is a fresh array on
  // every render and would make this effect re-run forever.
  const offerIds = offers.map((o) => o.id).join(',')
  useEffect(() => {
    const ids = offerIds ? offerIds.split(',') : []
    if (ids.length === 0) return
    if (!selectedOfferId || !ids.includes(selectedOfferId)) {
      setSelectedOfferId(ids[0])
    }
  }, [offerIds, selectedOfferId, setSelectedOfferId])

  const { isLoading, error } = useQuery({
    queryKey: keys.feed(tasteIds, radiusKm),
    queryFn: async () => {
      const { data, error: feedError } = await fetchFeed({ city, radiusKm, userId: userId! })
      if (feedError) throw feedError
      const items = (data?.items ?? []) as Record<string, unknown>[]
      const shaped: CardItem[] = items.map((it) => ({
        id: String(it.id),
        title: String(it.title ?? ''),
        category: String(it.category ?? ''),
        condition: String(it.condition ?? ''),
        distance: String(it.location_city ?? city),
        owner: it.owner ? String(it.owner) : '',
        wants: Array.isArray(it.wants) ? (it.wants as string[]) : [],
        photoColor: 'hsl(var(--illo-terracotta))',
        photoUrl:
          Array.isArray(it.photo_urls) && (it.photo_urls as string[]).length > 0
            ? String((it.photo_urls as string[])[0])
            : undefined,
        city: it.location_city ? String(it.location_city) : undefined,
        photos: Array.isArray(it.photo_urls)
          ? (it.photo_urls as string[]).map(String)
          : Array.isArray(it.images)
            ? (it.images as string[]).map(String)
            : [],
        description: it.description ? String(it.description) : undefined,
        daysLeft: it.expires_at
          ? Math.max(0, Math.ceil((new Date(String(it.expires_at)).getTime() - Date.now()) / 86_400_000))
          : undefined,
        ownerId: String(it.user_id ?? ''),
        rating: it.rating != null ? Number(it.rating) : undefined,
        swapCount: it.swaps != null ? Number(it.swaps) : 0,
      }))
      setCardQueue(shaped)
      return shaped
    },
    enabled: !!userId,
    staleTime: STALE.feed,
  })

  const top = cards[0]

  /** The card a right swipe is asking about. Non-null means the offer sheet is
   *  open and the card is still on the stack: the swipe is not finished until
   *  an item has been chosen, so cancelling has to leave the card there. */
  const [pendingTarget, setPendingTarget] = useState<CardItem | null>(null)
  const [sending, setSending] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)

  /** A pass is recorded and the card leaves. A want no longer records anything
   *  on its own -- under the locked rule a like IS an offer, so the swipe only
   *  completes once the person has said what they are putting up. */
  const decide = async (item: CardItem, want: boolean) => {
    if (!want) {
      recordSwipe({
        targetItemId: item.id,
        targetOwnerId: item.ownerId ?? '',
        isLike: false,
      }).catch(() => {
        // A lost pass is a card seen twice, not a broken app. Never block the
        // stack on it.
      })
      passTopCard(item)
      return
    }
    if (!item.ownerId) return
    setOfferError(null)
    setPendingTarget(item)
  }

  /** The sheet's confirm. This is the actual offer. */
  const sendOffer = async (offeredItemId: string, note?: string) => {
    const target = pendingTarget
    if (!target || sending) return
    setSending(true)
    setOfferError(null)

    const { error: rpcError } = await makeOffer({
      offeredItemId: Number(offeredItemId),
      wantedItemId: Number(target.id),
      note,
    })

    setSending(false)
    if (rpcError) {
      // The card stays put so the choice can be changed -- except when the
      // item is simply gone, where there is nothing left to decide.
      const key = barterErrorKey(rpcError)
      setOfferError(key)
      if (key === 'barter.errorItemGone') {
        setPendingTarget(null)
        removeTopCard()
      }
      return
    }

    addToLikeHistory(target.id)
    setPendingTarget(null)
    removeTopCard()
    setSentTitle(target.title)
  }

  /** Whether a free undo has been spent this session. The pitch below is gated
   *  on it, so the deck's first-ever pass cannot trigger an upgrade prompt. */
  const [usedUndo, setUsedUndo] = useState(false)

  /** Put the last passed card back on top.
   *
   *  Client-side only, and deliberately so: the pass is already recorded by the
   *  swipe function, which has no undo endpoint, so the row stays. The effect
   *  is that the card returns to this deck now -- which is what someone who
   *  mis-swiped actually wants -- while the server keeps its record. Liking is
   *  not undoable here because a like is an offer, and withdrawing an offer
   *  someone may already have seen is a different action with its own rules.
   */
  const rewind = () => {
    if (!lastPassed) return
    setUsedUndo(true)
    unpass()
  }

  /** The trigger moment from the tier sheet: someone has already used their one
   *  free undo and reaches for it again, with nothing left to undo. That is the
   *  point at which unlimited rewind is a thing they actually want, so the
   *  sheet is offered there and nowhere else.
   *
   *  It is offered once per session. A nudge that reappears every time the
   *  button is pressed stops being a nudge. */
  const [rewindPitch, setRewindPitch] = useState(false)
  const [rewindPitched, setRewindPitched] = useState(false)

  /** The empty deck's upgrade moment. It is deliberately NOT a sheet that opens
   *  by itself: the empty state already says "that is everything nearby" and
   *  offers the free widen, so a modal on top would restate the screen behind
   *  it. It opens only when the person asks for more reach. */
  const [reachPitch, setReachPitch] = useState(false)

  /** Pressed undo with nothing to undo. The button is disabled when
   *  `canRewind` is false, so this is the deliberate second reach. */
  const rewindBlocked = () => {
    if (rewindPitched) return
    setRewindPitched(true)
    setRewindPitch(true)
  }

  /** Backing out of the sheet. The card stays: not choosing an item is not the
   *  same as passing on the find. */
  const cancelOffer = () => {
    setPendingTarget(null)
    setOfferError(null)
  }

  return {
    cards,
    top,
    offers,
    selectedOfferId,
    setSelectedOfferId,
    selectedOffer: offers.find((o) => o.id === selectedOfferId),
    isLoading,
    error,
    radiusKm,
    widen: () => setRadiusKm((r) => Math.round(r * 2.5)),
    matched,
    dismissMatch: () => setMatched(null),
    rewind,
    canRewind: !!lastPassed,
    /** Fires only once a free undo has been spent -- otherwise the deck's very
     *  first pass would pitch an upgrade, which is exactly the mid-swipe
     *  interstitial the tier sheet forbids. */
    rewindBlocked: usedUndo && !lastPassed ? rewindBlocked : undefined,
    rewindPitch,
    dismissRewindPitch: () => setRewindPitch(false),
    reachPitch,
    openReachPitch: () => setReachPitch(true),
    dismissReachPitch: () => setReachPitch(false),
    decide,
    /** Offer sheet state. */
    pendingTarget,
    sendOffer,
    cancelOffer,
    sending,
    offerError,
    sentTitle,
    dismissSent: () => setSentTitle(null),
    openItem: (id: string) => navigate('/item/' + id),
    openSwap: (id: string) => navigate('/matches/' + id),
    goAdd: () => navigate('/add'),
  }
}

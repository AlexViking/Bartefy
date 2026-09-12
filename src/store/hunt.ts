import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CardItem {
  id: string
  title: string
  category: string
  condition: string
  /** Where the find is. The wireframe leads the card with it: where a
   *  thing is decides whether the swap can happen at all. */
  city?: string
  distance: string
  owner: string
  wants: string[]
  photoColor: string
  photoUrl?: string
  /** Every photo, not just the first. A listing carries up to five and the
   *  deck showed one, so the other four were invisible to everyone. */
  photos?: string[]
  description?: string
  daysLeft?: number
  ownerId?: string
  rating?: number
  swapCount?: number
}

interface HuntState {
  cardQueue: CardItem[]
  /** Which of my finds I am hunting with — the thing I am putting on the
   *  table. Persisted, because it is a standing choice rather than a
   *  per-session one: someone hunting for a trade for their bike expects it
   *  still to be their bike tomorrow. */
  selectedOfferId: string | null
  likeHistory: string[]
  /** The last card passed on, kept so it can be put back. Only one: undo is
   *  for the swipe you did not mean, not a browsable history. */
  lastPassed: CardItem | null
  /** Ids decided in this session, so a refetch cannot put them back.
   *
   *  The feed excludes what the server knows about, but a refetch in flight
   *  when you swipe was built before that swipe existed -- and the queue is
   *  replaced wholesale from the response. Without this, a card you just
   *  offered on reappears, and offering again raises P0004. */
  decided: string[]
  setCardQueue: (queue: CardItem[]) => void
  /** Add the next window to the end of the deck, keeping what is already
   *  there. setCardQueue REPLACES, which is right for a fresh feed and wrong
   *  for a refill -- using it here would throw away the cards being looked at. */
  appendToQueue: (queue: CardItem[]) => void
  removeTopCard: () => void
  /** Pass, remembering the card so `unpass` can restore it. */
  passTopCard: (card: CardItem) => void
  /** Put the last passed card back on top. No-op if there is nothing to undo. */
  unpass: () => void
  setSelectedOfferId: (id: string | null) => void
  addToLikeHistory: (id: string) => void
}

export const useHuntStore = create<HuntState>()(
  persist(
    (set) => ({
      cardQueue: [],
      selectedOfferId: null,
      likeHistory: [],
      lastPassed: null,
      decided: [],
      setCardQueue: (cardQueue) =>
        set((state) => ({
          // Anything decided this session stays gone, whatever the server
          // just said.
          cardQueue: cardQueue.filter((c) => !state.decided.includes(c.id)),
          lastPassed: null,
        })),
      appendToQueue: (incoming) =>
        set((state) => {
          // Two filters, both load-bearing: `decided` keeps a card that was
          // swiped this session from coming back, and the id check keeps a
          // window that overlaps the previous one from showing duplicates --
          // the cursor is an offset, so a listing expiring between two
          // requests shifts every row after it.
          const have = new Set(state.cardQueue.map((c) => c.id))
          const fresh = incoming.filter(
            (c) => !have.has(c.id) && !state.decided.includes(c.id),
          )
          return fresh.length ? { cardQueue: [...state.cardQueue, ...fresh] } : state
        }),
      removeTopCard: () =>
        set((state) => {
          const top = state.cardQueue[0]
          return {
            cardQueue: state.cardQueue.slice(1),
            decided: top ? [...state.decided, top.id] : state.decided,
          }
        }),
      passTopCard: (card) =>
        set((state) => ({
          cardQueue: state.cardQueue.slice(1),
          lastPassed: card,
          decided: [...state.decided, card.id],
        })),
      unpass: () =>
        set((state) =>
          state.lastPassed
            ? {
                cardQueue: [state.lastPassed, ...state.cardQueue],
                // Undoing a pass makes it undecided again, so a refetch is
                // allowed to serve it.
                decided: state.decided.filter((id) => id !== state.lastPassed!.id),
                lastPassed: null,
              }
            : state,
        ),
      setSelectedOfferId: (selectedOfferId) => set({ selectedOfferId }),
      addToLikeHistory: (id) =>
        set((state) => ({ likeHistory: [...state.likeHistory, id] })),
    }),
    {
      name: 'bartefy-hunt',
      // Only the standing choice is worth keeping. The card queue is server
      // state that TanStack Query owns and refetches, and persisting it would
      // show a stale deck — possibly of items already swiped — on the next visit.
      partialize: (s) => ({ selectedOfferId: s.selectedOfferId }),
    },
  ),
)

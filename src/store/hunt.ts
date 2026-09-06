import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CardItem {
  id: string
  title: string
  category: string
  condition: string
  distance: string
  owner: string
  wants: string[]
  photoColor: string
  photoUrl?: string
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
  setCardQueue: (queue: CardItem[]) => void
  removeTopCard: () => void
  setSelectedOfferId: (id: string | null) => void
  addToLikeHistory: (id: string) => void
}

export const useHuntStore = create<HuntState>()(
  persist(
    (set) => ({
      cardQueue: [],
      selectedOfferId: null,
      likeHistory: [],
      setCardQueue: (cardQueue) => set({ cardQueue }),
      removeTopCard: () =>
        set((state) => ({ cardQueue: state.cardQueue.slice(1) })),
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

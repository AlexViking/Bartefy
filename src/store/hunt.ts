import { create } from 'zustand'

export interface CardItem {
  id: string
  title: string
  category: string
  condition: string
  distance: string
  owner: string
  wants: string[]
  photoColor: string
}

interface HuntState {
  cardQueue: CardItem[]
  selectedOfferId: string | null
  likeHistory: string[]
  setCardQueue: (queue: CardItem[]) => void
  removeTopCard: () => void
  setSelectedOfferId: (id: string | null) => void
  addToLikeHistory: (id: string) => void
}

export const useHuntStore = create<HuntState>((set) => ({
  cardQueue: [],
  selectedOfferId: null,
  likeHistory: [],
  setCardQueue: (cardQueue) => set({ cardQueue }),
  removeTopCard: () =>
    set((state) => ({ cardQueue: state.cardQueue.slice(1) })),
  setSelectedOfferId: (selectedOfferId) => set({ selectedOfferId }),
  addToLikeHistory: (id) =>
    set((state) => ({ likeHistory: [...state.likeHistory, id] })),
}))

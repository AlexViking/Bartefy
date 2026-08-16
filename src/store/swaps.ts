import { create } from 'zustand'

export type SwapState = 'new' | 'chatting' | 'meetup_set' | 'done' | 'cancelled'

export interface Swap {
  id: string
  matchId: string
  otherUserName: string
  otherUserAvatar: string
  myItemTitle: string
  theirItemTitle: string
  state: SwapState
  lastMessage: string
  updatedAt: string
}

interface SwapsStore {
  swaps: Swap[]
  setSwaps: (swaps: Swap[]) => void
  updateSwapState: (id: string, state: SwapState) => void
}

export const useSwapsStore = create<SwapsStore>((set) => ({
  swaps: [],
  setSwaps: (swaps) => set({ swaps }),
  updateSwapState: (id, state) =>
    set((s) => ({
      swaps: s.swaps.map((sw) => (sw.id === id ? { ...sw, state } : sw)),
    })),
}))

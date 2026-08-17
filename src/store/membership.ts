import { create } from 'zustand'
import { type Tier, tierOf } from '@/lib/membership'

interface MembershipState {
  tier: Tier
  /** null while unknown - never assume free and start blocking. */
  liveFindCount: number | null
  activeSwapCount: number | null
  setTier: (tier: Tier) => void
  setCounts: (counts: { liveFindCount?: number; activeSwapCount?: number }) => void
  can: (what: 'add_find' | 'start_swap' | 'see_eyeing' | 'save_search', n?: number) => boolean
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  tier: 'hunter',
  liveFindCount: null,
  activeSwapCount: null,
  setTier: (tier) => set({ tier }),
  setCounts: (counts) => set(counts),
  can: (what, n = 0) => {
    const spec = tierOf(get().tier)
    switch (what) {
      case 'add_find':
        return spec.liveFinds === null || (get().liveFindCount ?? 0) < spec.liveFinds
      case 'start_swap':
        return spec.activeSwaps === null || (get().activeSwapCount ?? 0) < spec.activeSwaps
      case 'see_eyeing':
        return spec.seeEyeing
      case 'save_search':
        return n < spec.savedSearches
      default:
        return true
    }
  },
}))

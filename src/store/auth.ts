import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'

export type PaletteId = 0 | 1 | 2 | 3
export type CardStyle = 'rounded' | 'sharp'

export const PALETTES = [
  { name: 'Forest', accent: '#2F6A52', surf: '#F7F2E1' },
  { name: 'Brass', accent: '#E9BE8C', surf: '#33322B' },
  { name: 'Terracotta', accent: '#C97C5E', surf: '#F0EBD8' },
  { name: 'Denim', accent: '#4E6FA3', surf: '#F7F2E1' },
] as const

interface AuthState {
  session: Session | null
  initialized: boolean
  pendingEmail: string
  selectedCity: string
  profileName: string
  palette: PaletteId
  cardStyle: CardStyle
  setSession: (session: Session | null) => void
  setInitialized: () => void
  setPendingEmail: (email: string) => void
  setSelectedCity: (city: string) => void
  setProfileName: (name: string) => void
  setPalette: (palette: PaletteId) => void
  setCardStyle: (style: CardStyle) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  pendingEmail: '',
  selectedCity: '',
  profileName: '',
  palette: 0,
  cardStyle: 'rounded',
  setSession: (session) => set({ session }),
  setInitialized: () => set({ initialized: true }),
  setPendingEmail: (pendingEmail) => set({ pendingEmail }),
  setSelectedCity: (selectedCity) => set({ selectedCity }),
  setProfileName: (profileName) => set({ profileName }),
  setPalette: (palette) => set({ palette }),
  setCardStyle: (cardStyle) => set({ cardStyle }),
}))

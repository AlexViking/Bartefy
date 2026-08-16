import { create } from 'zustand'

export interface Listing {
  id: string
  title: string
  photoColor: string
  category: string
}

interface ProfileStore {
  listings: Listing[]
  radius: number
  notifyLikes: boolean
  notifyMessages: boolean
  notifyMeetups: boolean
  notifyUpdates: boolean
  setListings: (listings: Listing[]) => void
  setRadius: (radius: number) => void
  setNotifyLikes: (v: boolean) => void
  setNotifyMessages: (v: boolean) => void
  setNotifyMeetups: (v: boolean) => void
  setNotifyUpdates: (v: boolean) => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  listings: [],
  radius: 5,
  notifyLikes: true,
  notifyMessages: true,
  notifyMeetups: true,
  notifyUpdates: false,
  setListings: (listings) => set({ listings }),
  setRadius: (radius) => set({ radius }),
  setNotifyLikes: (notifyLikes) => set({ notifyLikes }),
  setNotifyMessages: (notifyMessages) => set({ notifyMessages }),
  setNotifyMeetups: (notifyMeetups) => set({ notifyMeetups }),
  setNotifyUpdates: (notifyUpdates) => set({ notifyUpdates }),
}))

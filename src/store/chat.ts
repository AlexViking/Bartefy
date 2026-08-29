import { create } from 'zustand'

export interface ChatMessage {
  id: string
  swap_id: string
  sender_id: string
  body: string
  client_msg_id: string
  created_at: string
  read_at: string | null
}

interface ChatStore {
  messages: Record<string, ChatMessage[]>
  setMessages: (swapId: string, msgs: ChatMessage[]) => void
  addMessage: (swapId: string, msg: ChatMessage) => void
  /** Stamp read_at locally on messages from the other person, mirroring the
   *  write markThreadRead just made. Without this the store still says
   *  read_at === null, so the effect that clears the badge sees unread
   *  messages forever and re-fires the same UPDATE on every render. */
  markLocalRead: (swapId: string, userId: string, at: string) => void
  clearChat: (swapId: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: {},
  setMessages: (swapId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [swapId]: msgs } })),
  addMessage: (swapId, msg) =>
    set((s) => {
      const existing = s.messages[swapId] ?? []
      if (existing.some((m) => m.id === msg.id || m.client_msg_id === msg.client_msg_id)) {
        return s
      }
      return { messages: { ...s.messages, [swapId]: [...existing, msg] } }
    }),
  markLocalRead: (swapId, userId, at) =>
    set((s) => {
      const existing = s.messages[swapId]
      if (!existing) return s
      let changed = false
      const next = existing.map((m) => {
        if (m.sender_id === userId || m.read_at) return m
        changed = true
        return { ...m, read_at: at }
      })
      // Returning the same state when nothing changed keeps this from
      // producing a new array identity and re-triggering subscribers.
      return changed ? { messages: { ...s.messages, [swapId]: next } } : s
    }),
  clearChat: (swapId) =>
    set((s) => ({ messages: { ...s.messages, [swapId]: [] } })),
}))

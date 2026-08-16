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
  clearChat: (swapId) =>
    set((s) => ({ messages: { ...s.messages, [swapId]: [] } })),
}))

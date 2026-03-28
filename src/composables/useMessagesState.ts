/**
 * Composable for messages state management
 */
import { reactive } from 'vue'
import type { Message } from '@/types'

export interface MessagesState {
  bySession: Record<string, Message[]>
  currentSessionId: string
  streamingMessageId: string | null
}

export function useMessagesState() {
  // Messages State
  const messages = reactive<MessagesState>({
    bySession: {},
    currentSessionId: `session_${Date.now()}`,
    streamingMessageId: null,
  })

  // Actions
  const addMessage = (message: Message) => {
    const { sessionId } = message

    if (!messages.bySession[sessionId]) {
      messages.bySession[sessionId] = []
    }

    messages.bySession[sessionId].push(message)
  }

  const updateMessage = (messageId: string, sessionId: string, updates: Partial<Message>) => {
    const sessionMessages = messages.bySession[sessionId]
    if (!sessionMessages) return

    const index = sessionMessages.findIndex(m => m.messageId === messageId)
    if (index > -1) {
      sessionMessages.splice(index, 1, { ...sessionMessages[index], ...updates })
    }
  }

  const clearCurrentMessages = (sessionId: string) => {
    messages.bySession[sessionId] = []
  }

  const deleteMessagesForSession = (sessionId: string) => {
    delete messages.bySession[sessionId]
  }

  const setStreamingMessage = (messageId: string | null) => {
    messages.streamingMessageId = messageId
  }

  const isStreaming = (): boolean => {
    return messages.streamingMessageId !== null
  }

  return {
    messages,
    addMessage,
    updateMessage,
    clearCurrentMessages,
    deleteMessagesForSession,
    setStreamingMessage,
    isStreaming,
  }
}

export type UseMessagesStateReturn = ReturnType<typeof useMessagesState>

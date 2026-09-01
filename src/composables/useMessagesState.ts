/**
 * Composable for messages state management
 */
import { reactive } from 'vue'
import type { Message } from '@/types'

export interface MessagesState {
  byTopic: Record<string, Message[]>
  currentTopicId: string
  streamingMessageId: string | null
}

export function useMessagesState() {
  // Messages State
  const messages = reactive<MessagesState>({
    byTopic: {},
    currentTopicId: `topic_${Date.now()}`,
    streamingMessageId: null,
  })

  // Actions
  const addMessage = (message: Message) => {
    const { topicId } = message

    if (!messages.byTopic[topicId]) {
      messages.byTopic[topicId] = []
    }

    messages.byTopic[topicId].push(message)
  }

  const updateMessage = (messageId: string, topicId: string, updates: Partial<Message>) => {
    const topicMessages = messages.byTopic[topicId]
    if (!topicMessages) return

    const index = topicMessages.findIndex((m) => m.messageId === messageId)
    if (index > -1) {
      topicMessages.splice(index, 1, { ...topicMessages[index], ...updates })
    }
  }

  const clearCurrentMessages = (topicId: string) => {
    messages.byTopic[topicId] = []
  }

  const deleteMessagesForTopic = (topicId: string) => {
    delete messages.byTopic[topicId]
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
    deleteMessagesForTopic,
    setStreamingMessage,
    isStreaming,
  }
}

export type UseMessagesStateReturn = ReturnType<typeof useMessagesState>

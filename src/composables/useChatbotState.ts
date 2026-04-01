/**
 * Core composable for managing chatbot state
 */
import { computed } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { useUIState } from './useUIState'
import { useMessagesState } from './useMessagesState'
import { useTopicsState } from './useTopicsState'
import { useInteractionState } from './useInteractionState'
import { TOPIC_DEFAULTS } from '@/constants'

export function useChatbotState(config: Required<ChatbotConfig>) {
  // Initialize sub-composables
  const uiState = useUIState({
    defaultExpanded: config.defaultExpanded,
    panelMode: config.panelMode,
    initialTheme: config.theme,
    locale: config.locale,
  })

  const messagesState = useMessagesState()
  const topicsState = useTopicsState({
    defaultTitle: config.labels?.newTopic || TOPIC_DEFAULTS.TITLE,
  })
  const interactionState = useInteractionState({
    maxImageCount: config.maxImageCount,
  })

  // Set initial topic ID in messages state
  messagesState.messages.currentTopicId = topicsState.topics.currentId

  // Computed properties
  const currentMessages = computed(() => {
    return messagesState.messages.byTopic[messagesState.messages.currentTopicId] || []
  })

  const currentTopic = computed(() => {
    return topicsState.topics.list.find(t => t.topicId === topicsState.topics.currentId)
  })

  const isStreaming = computed(() => {
    return messagesState.messages.streamingMessageId !== null
  })

  // Wrapped actions that coordinate between sub-composables
  const addMessage = (message: import('@/types').Message) => {
    const { topicId } = message

    messagesState.addMessage(message)
    topicsState.updateTopicAfterMessage(
      topicId,
      messagesState.messages.byTopic[topicId]?.length || 0
    )
  }

  const updateMessage = (messageId: string, updates: Partial<import('@/types').Message>) => {
    messagesState.updateMessage(messageId, messagesState.messages.currentTopicId, updates)
  }

  const clearCurrentMessages = () => {
    const topicId = messagesState.messages.currentTopicId
    messagesState.clearCurrentMessages(topicId)
    topicsState.updateTopicAfterMessage(topicId, 0)
  }

  const switchTopic = (topicId: string) => {
    topicsState.switchTopic(topicId)
    messagesState.messages.currentTopicId = topicId
  }

  const createTopic = () => {
    const newTopicId = topicsState.createTopic()
    messagesState.messages.currentTopicId = newTopicId
    return newTopicId
  }

  const deleteTopic = (topicId: string) => {
    // Remove messages for this topic
    messagesState.deleteMessagesForTopic(topicId)

    // Remove topic
    topicsState.deleteTopic(topicId)

    // If deleted topic was current, switch to another
    if (topicId === topicsState.topics.currentId) {
      const nextTopic = topicsState.topics.list[0]
      if (nextTopic) {
        switchTopic(nextTopic.topicId)
      } else {
        createTopic()
      }
    }
  }

  // Handle resize
  window.addEventListener('resize', uiState.updateScreenSize)
  uiState.updateScreenSize()

  // Cleanup
  const cleanup = () => {
    window.removeEventListener('resize', uiState.updateScreenSize)
    uiState.cleanupThemeListener()
  }

  return {
    // State (expose sub-composables' state)
    state: {
      ui: uiState.ui,
      messages: messagesState.messages,
      topics: topicsState.topics,
      interaction: interactionState.interaction,
    },

    // Computed
    currentMessages,
    currentTopic,
    isStreaming,

    // UI Actions
    togglePanel: uiState.togglePanel,
    setTheme: uiState.setTheme,
    setCurrentView: uiState.setCurrentView,
    toggleView: uiState.toggleView,
    updateScreenSize: uiState.updateScreenSize,

    // Message Actions
    addMessage,
    updateMessage,
    clearCurrentMessages,
    setStreamingMessage: messagesState.setStreamingMessage,

    // Topic Actions
    switchTopic,
    createTopic,
    deleteTopic,
    updateTopicTitle: topicsState.updateTopicTitle,

    // Interaction Actions
    setSelectedImages: interactionState.setSelectedImages,
    addSelectedImage: interactionState.addSelectedImage,
    removeSelectedImage: interactionState.removeSelectedImage,
    clearSelectedImages: interactionState.clearSelectedImages,

    // Cleanup
    cleanup,
  }
}

export type UseChatbotStateReturn = ReturnType<typeof useChatbotState>

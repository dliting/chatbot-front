/**
 * Core composable for managing chatbot state.
 * Returns sub-composables directly + coordinator for cross-cutting sync.
 */
import { computed } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Topic, Message } from '@/types'
import { useUIState } from './useUIState'
import { useMessagesState } from './useMessagesState'
import { useTopicsState } from './useTopicsState'
import { useInteractionState } from './useInteractionState'
import { useChatbotCoordinator } from './useChatbotCoordinator'
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

  // Coordinator handles cross-cutting sync between topics and messages
  const coordinator = useChatbotCoordinator({
    messages: messagesState.messages,
    topicsState,
  })

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

  // Message mutation helpers (delegating to sub-composables + coordinator)
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    messagesState.updateMessage(messageId, messagesState.messages.currentTopicId, updates)
  }

  /** Remove a message by ID from a topic */
  const removeMessage = (topicId: string, messageId: string) => {
    const msgs = messagesState.messages.byTopic[topicId]
    if (!msgs) return
    const index = msgs.findIndex(m => m.messageId === messageId)
    if (index > -1) {
      msgs.splice(index, 1)
    }
  }

  /** Insert a message at a specific index in a topic */
  const insertMessage = (topicId: string, index: number, message: Message) => {
    const msgs = messagesState.messages.byTopic[topicId]
    if (!msgs) return
    msgs.splice(index, 0, message)
  }

  /** Replace all messages for a topic */
  const setMessages = (topicId: string, messages: Message[]) => {
    messagesState.messages.byTopic[topicId] = messages
  }

  /** Ensure a messages array exists for a topic, return it */
  const ensureMessages = (topicId: string): Message[] => {
    if (!messagesState.messages.byTopic[topicId]) {
      messagesState.messages.byTopic[topicId] = []
    }
    return messagesState.messages.byTopic[topicId]
  }

  /** Replace the entire topic list (used after backend reload) */
  const setTopicList = (topics: Topic[]) => {
    topicsState.topics.list.length = 0
    topicsState.topics.list.push(...topics)
  }

  /** Add a topic to the front of the list */
  const addTopicToFront = (topic: Topic) => {
    topicsState.topics.list.unshift(topic)
  }

  // Topic actions that delegate to topicsState (watcher syncs messages.currentTopicId)
  const switchTopic = (topicId: string) => {
    topicsState.switchTopic(topicId)
  }

  const createTopic = (): string => {
    return topicsState.createTopic()
  }

  // Initialize side effects (call from onMounted)
  const init = () => {
    uiState.init()
  }

  // Cleanup
  const cleanup = () => {
    uiState.cleanup()
    coordinator.stop()
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

    // Message Actions (coordinated + helpers)
    addMessage: coordinator.addMessage,
    updateMessage,
    removeMessage,
    insertMessage,
    setMessages,
    ensureMessages,
    clearCurrentMessages: coordinator.clearCurrentMessages,
    setStreamingMessage: messagesState.setStreamingMessage,

    // Topic Actions (coordinator handles cross-cutting)
    switchTopic,
    createTopic,
    deleteTopic: coordinator.deleteTopic,
    updateTopicTitle: topicsState.updateTopicTitle,
    setTopicList,
    setCurrentTopicId: coordinator.setCurrentTopicId,
    addTopicToFront,

    // Interaction Actions
    setSelectedImages: interactionState.setSelectedImages,
    addSelectedImage: interactionState.addSelectedImage,
    removeSelectedImage: interactionState.removeSelectedImage,
    clearSelectedImages: interactionState.clearSelectedImages,

    // Init & Cleanup
    init,
    cleanup,
  }
}

export type UseChatbotStateReturn = ReturnType<typeof useChatbotState>

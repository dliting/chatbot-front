/**
 * Core composable for managing chatbot state
 */
import { computed } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { useUIState } from './useUIState'
import { useMessagesState } from './useMessagesState'
import { useSessionsState } from './useSessionsState'
import { useInteractionState } from './useInteractionState'

export function useChatbotState(config: Required<ChatbotConfig>) {
  // Initialize sub-composables
  const uiState = useUIState({
    defaultExpanded: config.defaultExpanded,
    panelMode: config.panelMode,
    initialTheme: config.theme,
    locale: config.locale,
  })

  const messagesState = useMessagesState()
  const sessionsState = useSessionsState({
    defaultTitle: config.labels?.newChat || '新对话',
  })
  const interactionState = useInteractionState({
    maxImageCount: config.maxImageCount,
  })

  // Set initial session ID in messages state
  messagesState.messages.currentSessionId = sessionsState.sessions.currentId

  // Computed properties
  const currentMessages = computed(() => {
    return messagesState.messages.bySession[messagesState.messages.currentSessionId] || []
  })

  const currentSession = computed(() => {
    return sessionsState.sessions.list.find(s => s.sessionId === sessionsState.sessions.currentId)
  })

  const isStreaming = computed(() => {
    return messagesState.messages.streamingMessageId !== null
  })

  // Wrapped actions that coordinate between sub-composables
  const addMessage = (message: import('@/types').Message) => {
    const { sessionId } = message

    messagesState.addMessage(message)
    sessionsState.updateSessionAfterMessage(
      sessionId,
      messagesState.messages.bySession[sessionId]?.length || 0
    )
  }

  const updateMessage = (messageId: string, updates: Partial<import('@/types').Message>) => {
    messagesState.updateMessage(messageId, messagesState.messages.currentSessionId, updates)
  }

  const clearCurrentMessages = () => {
    const sessionId = messagesState.messages.currentSessionId
    messagesState.clearCurrentMessages(sessionId)
    sessionsState.updateSessionAfterMessage(sessionId, 0)
  }

  const switchSession = (sessionId: string) => {
    sessionsState.switchSession(sessionId)
    messagesState.messages.currentSessionId = sessionId
  }

  const createSession = () => {
    const newSessionId = sessionsState.createSession()
    messagesState.messages.currentSessionId = newSessionId
    return newSessionId
  }

  const deleteSession = (sessionId: string) => {
    // Remove messages for this session
    messagesState.deleteMessagesForSession(sessionId)

    // Remove session
    sessionsState.deleteSession(sessionId)

    // If deleted session was current, switch to another
    if (sessionId === sessionsState.sessions.currentId) {
      const nextSession = sessionsState.sessions.list[0]
      if (nextSession) {
        switchSession(nextSession.sessionId)
      } else {
        createSession()
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
      sessions: sessionsState.sessions,
      interaction: interactionState.interaction,
    },

    // Computed
    currentMessages,
    currentSession,
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

    // Session Actions
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle: sessionsState.updateSessionTitle,

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

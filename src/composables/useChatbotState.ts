/**
 * Core composable for managing chatbot state
 */
import { reactive, computed } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Theme, PanelMode, Locale } from '@/types'

interface UIState {
  isPanelOpen: boolean
  panelMode: PanelMode
  theme: Theme
  locale: Locale
  screenWidth: number
  isMobile: boolean
}

interface MessagesState {
  bySession: Record<string, import('@/types').Message[]>
  currentSessionId: string
  streamingMessageId: string | null
}

interface SessionsState {
  list: import('@/types').Session[]
  currentId: string
}

interface InteractionState {
  isSending: boolean
  selectedImages: string[]
}

export function useChatbotState(config: Required<ChatbotConfig>) {
  // System theme detection
  let mediaQueryList: MediaQueryList | null = null
  let handleThemeChange: ((e: MediaQueryListEvent) => void) | null = null

  // Get system theme
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Determine initial theme based on config
  const getInitialTheme = (): Theme => {
    if (config.theme === 'system') {
      return getSystemTheme()
    }
    return config.theme
  }

  // Initialize theme change listener
  const initThemeListener = () => {
    if (config.theme !== 'system') {
      return
    }

    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      ui.theme = newTheme
      document.documentElement.setAttribute('data-theme', newTheme)
    }

    mediaQueryList.addEventListener('change', handleThemeChange)
  }

  // Clean up theme listener
  const cleanupThemeListener = () => {
    if (mediaQueryList && handleThemeChange) {
      mediaQueryList.removeEventListener('change', handleThemeChange)
      mediaQueryList = null
      handleThemeChange = null
    }
  }

  // UI State
  const ui = reactive<UIState>({
    isPanelOpen: config.defaultExpanded,
    panelMode: config.panelMode === 'auto' || !config.panelMode ? 'dialog' : config.panelMode,
    theme: getInitialTheme(),
    locale: config.locale,
    screenWidth: window.innerWidth,
    isMobile: window.innerWidth < 768,
  })

  // Messages State
  const messages = reactive<MessagesState>({
    bySession: {},
    currentSessionId: `session_${Date.now()}`,
    streamingMessageId: null,
  })

  // Sessions State
  const sessions = reactive<SessionsState>({
    list: [],
    currentId: messages.currentSessionId,
  })

  // Interaction State
  const interaction = reactive<InteractionState>({
    isSending: false,
    selectedImages: [],
  })

  // Computed properties
  const currentMessages = computed(() => {
    return messages.bySession[messages.currentSessionId] || []
  })

  const currentSession = computed(() => {
    return sessions.list.find(s => s.id === sessions.currentId)
  })

  const isStreaming = computed(() => {
    return messages.streamingMessageId !== null
  })

  // Actions
  const togglePanel = (isOpen?: boolean) => {
    ui.isPanelOpen = isOpen ?? !ui.isPanelOpen
  }

  const setTheme = (theme: Theme) => {
    // If theme is 'system', resolve to actual system theme
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
    ui.theme = resolvedTheme
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }

  const updateScreenSize = () => {
    ui.screenWidth = window.innerWidth
    ui.isMobile = ui.screenWidth < 768

    // Update panel mode based on screen size (only if panelMode is 'auto')
    if (config.panelMode === 'auto' || !config.panelMode) {
      if (ui.isMobile) {
        ui.panelMode = 'fullscreen'
      } else if (ui.screenWidth < 1024) {
        ui.panelMode = 'dialog'
      } else {
        ui.panelMode = 'sidebar'
      }
    }
  }

  const addMessage = (message: import('@/types').Message) => {
    const { sessionId } = message

    if (!messages.bySession[sessionId]) {
      messages.bySession[sessionId] = []
    }

    messages.bySession[sessionId].push(message)

    // Update session
    updateSessionAfterMessage(sessionId)
  }

  const updateMessage = (messageId: string, updates: Partial<import('@/types').Message>) => {
    const sessionMessages = messages.bySession[messages.currentSessionId]
    if (!sessionMessages) return

    const index = sessionMessages.findIndex(m => m.id === messageId)
    if (index > -1) {
      Object.assign(sessionMessages[index], updates)
    }
  }

  const updateSessionAfterMessage = (sessionId: string) => {
    const sessionMessages = messages.bySession[sessionId]
    if (!sessionMessages) return

    const sessionIndex = sessions.list.findIndex(s => s.id === sessionId)

    if (sessionIndex === -1) {
      // Create new session
      const newSession: import('@/types').Session = {
        id: sessionId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: sessionMessages.length,
        unreadCount: 0,
      }
      sessions.list.unshift(newSession)
    } else {
      // Update existing session
      const session = sessions.list[sessionIndex]
      session.messageCount = sessionMessages.length
      session.updatedAt = Date.now()

      // Move to top
      sessions.list.splice(sessionIndex, 1)
      sessions.list.unshift(session)
    }
  }

  const switchSession = (sessionId: string) => {
    messages.currentSessionId = sessionId
    sessions.currentId = sessionId
  }

  const createSession = () => {
    const newSessionId = `session_${Date.now()}`
    messages.currentSessionId = newSessionId
    sessions.currentId = newSessionId
    return newSessionId
  }

  const deleteSession = (sessionId: string) => {
    // Remove messages
    delete messages.bySession[sessionId]

    // Remove from list
    const index = sessions.list.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.list.splice(index, 1)
    }

    // If deleted session was current, switch to another
    if (sessionId === sessions.currentId) {
      const nextSession = sessions.list[0]
      if (nextSession) {
        switchSession(nextSession.id)
      } else {
        createSession()
      }
    }
  }

  const clearCurrentMessages = () => {
    messages.bySession[messages.currentSessionId] = []
    updateSessionAfterMessage(messages.currentSessionId)
  }

  const setStreamingMessage = (messageId: string | null) => {
    messages.streamingMessageId = messageId
  }

  const setSelectedImages = (images: string[]) => {
    interaction.selectedImages = images
  }

  const addSelectedImage = (imageUrl: string) => {
    if (config.maxImageCount && interaction.selectedImages.length >= config.maxImageCount) {
      return
    }
    interaction.selectedImages.push(imageUrl)
  }

  const removeSelectedImage = (imageUrl: string) => {
    const index = interaction.selectedImages.indexOf(imageUrl)
    if (index > -1) {
      interaction.selectedImages.splice(index, 1)
    }
  }

  const clearSelectedImages = () => {
    interaction.selectedImages = []
  }

  // Initialize theme (use resolved theme if config is 'system')
  setTheme(ui.theme)

  // Initialize system theme listener
  initThemeListener()

  // Handle resize
  window.addEventListener('resize', updateScreenSize)
  updateScreenSize()

  // Cleanup
  const cleanup = () => {
    window.removeEventListener('resize', updateScreenSize)
    cleanupThemeListener()
  }

  return {
    // State
    state: {
      ui,
      messages,
      sessions,
      interaction,
    },

    // Computed
    currentMessages,
    currentSession,
    isStreaming,

    // UI Actions
    togglePanel,
    setTheme,
    updateScreenSize,

    // Message Actions
    addMessage,
    updateMessage,
    clearCurrentMessages,
    setStreamingMessage,

    // Session Actions
    switchSession,
    createSession,
    deleteSession,

    // Interaction Actions
    setSelectedImages,
    addSelectedImage,
    removeSelectedImage,
    clearSelectedImages,

    // Cleanup
    cleanup,
  }
}

export type UseChatbotStateReturn = ReturnType<typeof useChatbotState>

/**
 * Composable for session management
 */
import { ref, computed, watch } from 'vue'
import type { Session } from '@/types'
import { generateId } from '@/utils/helpers'
import { extractSessionTitle } from '@/utils/message'

export interface UseSessionsOptions {
  maxSessions?: number
  storageKey?: string
  persistToStorage?: boolean
}

export function useSessions(options: UseSessionsOptions = {}) {
  const {
    maxSessions = 50,
    storageKey = 'chatbot-sessions',
    persistToStorage = true,
  } = options

  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string>('')

  // Load sessions from storage
  const loadFromStorage = (): Session[] => {
    if (!persistToStorage || typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load sessions from storage:', error)
    }

    return []
  }

  // Save sessions to storage
  const saveToStorage = (sessionList: Session[]): void => {
    if (!persistToStorage || typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(sessionList))
    } catch (error) {
      console.warn('Failed to save sessions to storage:', error)
    }
  }

  /**
   * Create a new session
   */
  const createSession = (): string => {
    const newSession: Session = {
      sessionId: generateId('session'),
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }

    // Add to beginning of list
    sessions.value.unshift(newSession)

    // Enforce max sessions
    if (sessions.value.length > maxSessions) {
      sessions.value = sessions.value.slice(0, maxSessions)
    }

    // Switch to new session
    currentSessionId.value = newSession.sessionId

    saveToStorage(sessions.value)

    return newSession.sessionId
  }

  /**
   * Initialize sessions (auto-called)
   */
  const init = () => {
    const stored = loadFromStorage()
    sessions.value = stored

    if (stored.length > 0) {
      // Use most recent session
      currentSessionId.value = stored[0].sessionId
    } else {
      // Create new session
      createSession()
    }
  }

  // Auto-initialize on mount
  init()

  /**
   * Switch to a different session
   */
  const switchSession = (sessionId: string): void => {
    const session = sessions.value.find(s => s.sessionId === sessionId)
    if (session) {
      currentSessionId.value = sessionId
      // Move to top
      const index = sessions.value.findIndex(s => s.sessionId === sessionId)
      sessions.value.splice(index, 1)
      sessions.value.unshift(session)
      saveToStorage(sessions.value)
    }
  }

  /**
   * Update a session
   */
  const updateSession = (sessionId: string, updates: Partial<Session>): void => {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId)
    if (index > -1) {
      Object.assign(sessions.value[index], updates, { updatedAt: Date.now() })
      saveToStorage(sessions.value)
    }
  }

  /**
   * Update session title
   */
  const updateSessionTitle = (sessionId: string, messages: import('@/types').Message[]): void => {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId)
    if (index > -1) {
      const title = extractSessionTitle(messages)
      sessions.value[index].title = title
      saveToStorage(sessions.value)
    }
  }

  /**
   * Delete a session
   */
  const deleteSession = (sessionId: string): void => {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId)
    if (index === -1) return

    // Remove session
    sessions.value.splice(index, 1)

    // If deleted session was current, switch to another
    if (sessionId === currentSessionId.value) {
      if (sessions.value.length > 0) {
        currentSessionId.value = sessions.value[0].sessionId
      } else {
        createSession()
      }
    }

    saveToStorage(sessions.value)
  }

  /**
   * Delete all sessions
   */
  const deleteAllSessions = (): void => {
    sessions.value = []
    createSession()
  }

  /**
   * Get current session
   */
  const getCurrentSession = computed((): Session | undefined => {
    return sessions.value.find(s => s.sessionId === currentSessionId.value)
  })

  /**
   * Get sessions sorted by update time (already sorted)
   */
  const sortedSessions = computed(() => sessions.value)

  // Watch for changes and save to storage
  watch(
    sessions,
    (newSessions) => {
      saveToStorage(newSessions)
    },
    { deep: true }
  )

  return {
    // State
    sessions,
    currentSessionId,

    // Computed
    currentSession: getCurrentSession,
    sortedSessions,

    // Methods
    init,
    createSession,
    switchSession,
    updateSession,
    updateSessionTitle,
    deleteSession,
    deleteAllSessions,
  }
}

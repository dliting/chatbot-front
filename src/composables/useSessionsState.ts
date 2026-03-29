/**
 * Composable for sessions state management
 */
import { reactive } from 'vue'
import type { Session } from '@/types'

// Storage key for sessions
const SESSIONS_STORAGE_KEY = 'chatbot-sessions'

// Load sessions from localStorage
function loadSessionsFromStorage(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // localStorage disabled, quota exceeded, or corrupted data - return empty
  }
  return []
}

// Save sessions to localStorage
function saveSessionsToStorage(sessions: Session[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    // localStorage disabled or quota exceeded - silently fail
  }
}

export interface SessionsState {
  list: Session[]
  currentId: string
}

export function useSessionsState() {
  // Load from localStorage or create new
  const storedSessions = loadSessionsFromStorage()
  const initialSessionId = storedSessions.length > 0
    ? storedSessions[0].sessionId
    : `session_${Date.now()}`

  const sessions = reactive<SessionsState>({
    list: storedSessions.length > 0 ? storedSessions : [{
      sessionId: initialSessionId,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }],
    currentId: initialSessionId,
  })

  const currentSession = (): Session | undefined => {
    return sessions.list.find(s => s.sessionId === sessions.currentId)
  }

  const updateSessionAfterMessage = (sessionId: string, messageCount: number) => {
    const sessionIndex = sessions.list.findIndex(s => s.sessionId === sessionId)

    if (sessionIndex === -1) {
      // Create new session
      const newSession: Session = {
        sessionId,
        title: '新对话',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount,
        unreadCount: 0,
      }
      sessions.list.unshift(newSession)
    } else {
      // Update existing session
      const session = sessions.list[sessionIndex]
      session.messageCount = messageCount
      session.updatedAt = Date.now()

      // Move to top
      sessions.list.splice(sessionIndex, 1)
      sessions.list.unshift(session)
    }
  }

  const switchSession = (sessionId: string) => {
    sessions.currentId = sessionId
    // Move session to top of list
    const index = sessions.list.findIndex(s => s.sessionId === sessionId)
    if (index > 0) {
      const session = sessions.list.splice(index, 1)[0]
      sessions.list.unshift(session)
      saveSessionsToStorage(sessions.list)
    }
  }

  const createSession = (): string => {
    const newSession: Session = {
      sessionId: `session_${Date.now()}`,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }
    sessions.list.unshift(newSession)
    sessions.currentId = newSession.sessionId
    saveSessionsToStorage(sessions.list)
    return newSession.sessionId
  }

  const deleteSession = (sessionId: string) => {
    // Remove from list
    const index = sessions.list.findIndex(s => s.sessionId === sessionId)
    if (index > -1) {
      sessions.list.splice(index, 1)
      saveSessionsToStorage(sessions.list)
    }
  }

  const updateSessionTitle = (sessionId: string, title: string) => {
    const session = sessions.list.find(s => s.sessionId === sessionId)
    if (session) {
      session.title = title
      session.updatedAt = Date.now()
      saveSessionsToStorage(sessions.list)
    }
  }

  return {
    sessions,
    currentSession,
    updateSessionAfterMessage,
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle,
  }
}

export type UseSessionsStateReturn = ReturnType<typeof useSessionsState>

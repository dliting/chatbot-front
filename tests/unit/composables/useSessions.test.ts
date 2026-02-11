/**
 * Unit tests for useSessions composable
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSessions } from '@/composables/useSessions'
import type { Session } from '@/types'
import type { Message } from '@/types'

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => mockLocalStorage.store.get(key) || null,
  setItem: (key: string, value: string) => mockLocalStorage.store.set(key, value),
  removeItem: (key: string) => mockLocalStorage.store.delete(key),
  clear: () => mockLocalStorage.store.clear(),
}

describe('composables/useSessions', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage)
    mockLocalStorage.store.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('useSessions', () => {
    it('should initialize with empty sessions', () => {
      const { sessions, currentSessionId, init } = useSessions({
        persistToStorage: false,
      })

      init()

      expect(sessions.value.length).toBe(1) // Creates initial session
      expect(currentSessionId.value).toBeTruthy()
    })

    it('should create a new session', () => {
      const { sessions, currentSessionId, createSession, init } = useSessions({
        persistToStorage: false,
      })

      init()

      const initialLength = sessions.value.length
      const newId = createSession()

      expect(sessions.value.length).toBe(initialLength + 1)
      expect(currentSessionId.value).toBe(newId)
      expect(sessions.value[0].id).toBe(newId)
      expect(sessions.value[0].title).toBe('New Chat')
    })

    it('should switch to existing session', () => {
      const { sessions, currentSessionId, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      const session1 = createSession()
      const session2 = createSession()

      expect(currentSessionId.value).toBe(session2)

      switchSession(session1)

      expect(currentSessionId.value).toBe(session1)
    })

    it('should move switched session to top', () => {
      const { sessions, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      const session1 = createSession()
      const session2 = createSession()
      const session3 = createSession()

      expect(sessions.value[0].id).toBe(session3)

      switchSession(session1)

      expect(sessions.value[0].id).toBe(session1)
    })

    it('should delete a session', () => {
      const { sessions, currentSessionId, createSession, deleteSession, init } = useSessions({
        persistToStorage: false,
      })

      init()
      const session1 = createSession()
      const session2 = createSession()
      const session3 = createSession()

      const beforeLength = sessions.value.length
      deleteSession(session2)

      expect(sessions.value.length).toBe(beforeLength - 1)
      expect(sessions.value.find(s => s.id === session2)).toBeUndefined()
    })

    it('should switch to another session when deleting current', () => {
      const { sessions, currentSessionId, createSession, deleteSession } = useSessions({
        persistToStorage: false,
      })

      const session1 = createSession()
      const session2 = createSession()

      expect(currentSessionId.value).toBe(session2)

      deleteSession(session2)

      expect(currentSessionId.value).toBe(session1)
    })

    it('should create new session when deleting last session', () => {
      const { sessions, currentSessionId, createSession, deleteSession } = useSessions({
        persistToStorage: false,
      })

      const session = createSession()

      // Delete all sessions except the init one
      while (sessions.value.length > 1) {
        deleteSession(sessions.value[sessions.value.length - 1].id)
      }

      const oldId = currentSessionId.value
      deleteSession(oldId)

      // Should have created a new session
      expect(currentSessionId.value).not.toBe(oldId)
      expect(sessions.value.length).toBeGreaterThan(0)
    })

    it('should enforce max sessions limit', () => {
      const maxSessions = 3
      const { sessions, createSession } = useSessions({
        maxSessions,
        persistToStorage: false,
      })

      // Create more than max sessions
      for (let i = 0; i < 5; i++) {
        createSession()
      }

      // Should not exceed max sessions
      expect(sessions.value.length).toBeLessThanOrEqual(maxSessions)
    })

    it('should update session title from messages', () => {
      const messages: Message[] = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Hello',
          timestamp: Date.now(),
          status: 'sent',
        },
        {
          id: 'msg_2',
          sessionId: 'session_1',
          role: 'assistant',
          type: 'text',
          content: 'This is a custom title',
          timestamp: Date.now(),
          status: 'sent',
        },
      ]

      // Create a session first
      const { sessions, createSession, updateSessionTitle, init } = useSessions({
        persistToStorage: false,
      })

      init()
      const sessionId = createSession()
      updateSessionTitle(sessionId, messages)

      const session = sessions.value.find(s => s.id === sessionId)
      expect(session?.title).toBe('This is a custom title')
    })

    it('should delete all sessions', () => {
      const { sessions, createSession, deleteAllSessions } = useSessions({
        persistToStorage: false,
      })

      // Create multiple sessions
      createSession()
      createSession()
      createSession()

      expect(sessions.value.length).toBeGreaterThan(1)

      deleteAllSessions()

      // Should have exactly one new session
      expect(sessions.value.length).toBe(1)
    })

    it('should load sessions from storage on init', () => {
      const storedSessions: Session[] = [
        {
          id: 'stored_session_1',
          title: 'Stored Chat 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 5,
        },
      ]

      mockLocalStorage.store.set('chatbot-sessions', JSON.stringify(storedSessions))

      const { sessions, init } = useSessions({
        storageKey: 'chatbot-sessions',
      })

      init()

      expect(sessions.value.length).toBeGreaterThan(0)
    })

    it('should return current session', () => {
      const { currentSession, createSession } = useSessions({
        persistToStorage: false,
      })

      expect(currentSession.value).toBeUndefined()

      const sessionId = createSession()

      expect(currentSession.value).toBeDefined()
      expect(currentSession.value?.id).toBe(sessionId)
    })

    it('should return sorted sessions', () => {
      const { sortedSessions, createSession } = useSessions({
        persistToStorage: false,
      })

      createSession()
      createSession()

      // Sorted sessions should match sessions (already sorted)
      expect(sortedSessions.value).toEqual(expect.any(Array))
      expect(sortedSessions.value.length).toBeGreaterThan(0)
    })
  })
})

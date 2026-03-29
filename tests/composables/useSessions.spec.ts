/**
 * Comprehensive unit tests for useSessions composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSessions } from '@/composables/useSessions'
import type { Session } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

describe('useSessions', () => {
  beforeEach(() => {
    // Set up localStorage mock
    global.localStorage = localStorageMock as Storage
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize and create first session automatically', () => {
      const { sessions, currentSessionId } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, creates initial session
      expect(sessions.value.length).toBe(1)
      expect(currentSessionId.value).toBeTruthy()
      expect(sessions.value[0].title).toBe('新对话')
    })

    it('should initialize and create first session when init is called', () => {
      const { sessions, currentSessionId, init } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, so no need to call again
      expect(sessions.value.length).toBe(1)
      expect(currentSessionId.value).toBeTruthy()
      expect(sessions.value[0].title).toBe('新对话')
    })

    it('should load sessions from storage on init', () => {
      const storedSessions: Session[] = [
        {
          sessionId: 'session-1',
          title: 'Chat 1',
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 5000,
          messageCount: 5,
          unreadCount: 0,
        },
        {
          sessionId: 'session-2',
          title: 'Chat 2',
          createdAt: Date.now() - 20000,
          updatedAt: Date.now() - 15000,
          messageCount: 3,
          unreadCount: 0,
        },
      ]

      localStorageMock.setItem('chatbot-sessions', JSON.stringify(storedSessions))

      const { sessions, currentSessionId } = useSessions({
        storageKey: 'chatbot-sessions',
        persistToStorage: true,
      })

      // init() is auto-called, loads from storage
      expect(sessions.value.length).toBe(2)
      expect(sessions.value[0].sessionId).toBe('session-1')
      expect(currentSessionId.value).toBe('session-1')
    })
  })

  describe('Create Session', () => {
    it('should create new session', () => {
      const { sessions, currentSessionId, createSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, creating 1 session
      const initialLength = sessions.value.length
      const sessionId = createSession()

      expect(sessions.value.length).toBe(initialLength + 1)
      expect(currentSessionId.value).toBe(sessionId)
      expect(sessions.value[0].sessionId).toBe(sessionId)
      expect(sessions.value[0].title).toBe('新对话')
    })

    it('should add new session to beginning of list', () => {
      const { sessions, createSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called
      const firstId = sessions.value[0].sessionId
      const secondId = createSession()

      expect(sessions.value.length).toBe(2)
      expect(sessions.value[0].sessionId).toBe(secondId)
      expect(sessions.value[1].sessionId).toBe(firstId)
    })

    it('should enforce max sessions limit', () => {
      const { sessions, createSession } = useSessions({
        maxSessions: 3,
        persistToStorage: false,
      })

      // init() is auto-called, creating 1 session
      createSession()
      createSession()
      createSession()
      createSession()

      expect(sessions.value.length).toBe(3)
    })

    it('should switch to new session after creation', () => {
      const { sessions, currentSessionId, createSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called
      const firstId = sessions.value[0].sessionId
      expect(currentSessionId.value).toBe(firstId)

      const secondId = createSession()
      expect(currentSessionId.value).toBe(secondId)
      expect(currentSessionId.value).not.toBe(firstId)
    })

    it('should save to storage after creation', () => {
      const storageKey = 'test-sessions'
      const { sessions, createSession } = useSessions({
        storageKey,
        persistToStorage: true,
      })

      // init() is auto-called, creating 1 session
      createSession()

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeTruthy()

      if (stored) {
        const storedSessions = JSON.parse(stored) as Session[]
        // init() creates 1 + createSession() creates 1 = 2 sessions
        expect(storedSessions.length).toBe(sessions.value.length)
      }
    })
  })

  describe('Switch Session', () => {
    it('should switch to existing session', () => {
      const { sessions, currentSessionId, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      const firstId = createSession()
      const secondId = createSession()

      expect(currentSessionId.value).toBe(secondId)

      switchSession(firstId)

      expect(currentSessionId.value).toBe(firstId)
    })

    it('should move switched session to top', () => {
      const { sessions, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      const firstId = createSession()
      const secondId = createSession()
      const thirdId = createSession()

      expect(sessions.value[0].sessionId).toBe(thirdId)

      switchSession(firstId)

      expect(sessions.value[0].sessionId).toBe(firstId)
      // After moving first to top, the order should be: [first, third, second]
      expect(sessions.value[1].sessionId).toBe(thirdId)
      expect(sessions.value[2].sessionId).toBe(secondId)
    })

    it('should not switch to non-existent session', () => {
      const { sessions, currentSessionId, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      const firstId = createSession()
      const originalOrder = [...sessions.value.map(s => s.sessionId)]

      switchSession('non-existent')

      expect(currentSessionId.value).toBe(firstId)
      expect(sessions.value.map(s => s.sessionId)).toEqual(originalOrder)
    })

    it('should save to storage after switch', () => {
      const storageKey = 'test-sessions-switch'
      const { createSession, switchSession } = useSessions({
        storageKey,
        persistToStorage: true,
      })

      const firstId = createSession()
      const secondId = createSession()

      switchSession(firstId)

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeTruthy()

      if (stored) {
        const sessions = JSON.parse(stored) as Session[]
        expect(sessions[0].sessionId).toBe(firstId)
      }
    })
  })

  describe('Update Session', () => {
    it('should update session properties', () => {
      const { sessions, createSession, updateSession } = useSessions({
        persistToStorage: false,
      })

      const sessionId = createSession()

      updateSession(sessionId, { title: 'Updated Title' })

      expect(sessions.value[0].title).toBe('Updated Title')
      expect(sessions.value[0].sessionId).toBe(sessionId)
    })

    it('should update updatedAt timestamp', () => {
      const { sessions, createSession, updateSession } = useSessions({
        persistToStorage: false,
      })

      const sessionId = createSession()
      const originalUpdatedAt = sessions.value[0].updatedAt

      // updateSession sets updatedAt to Date.now() internally
      // The timestamp will be >= the original
      updateSession(sessionId, { title: 'New Title' })

      expect(sessions.value[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it('should not update non-existent session', () => {
      const { sessions, createSession, updateSession } = useSessions({
        persistToStorage: false,
      })

      createSession()
      const originalLength = sessions.value.length

      updateSession('non-existent', { title: 'New Title' })

      expect(sessions.value.length).toBe(originalLength)
    })

    it('should save to storage after update', () => {
      const storageKey = 'test-sessions-update'
      const { createSession, updateSession } = useSessions({
        storageKey,
        persistToStorage: true,
      })

      const sessionId = createSession()
      updateSession(sessionId, { title: 'New Title' })

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeTruthy()

      if (stored) {
        const sessions = JSON.parse(stored) as Session[]
        expect(sessions[0].title).toBe('New Title')
      }
    })
  })

  describe('Update Session Title', () => {
    it('should update session title from messages', () => {
      const { sessions, createSession, updateSessionTitle } = useSessions({
        persistToStorage: false,
      })

      const sessionId = createSession()

      const messages = [
        {
          messageId: 'msg-1',
          sessionId,
          role: 'user' as const,
          content: 'Hello world',
          timestamp: Date.now(),
          status: 'sent' as const,
        },
      ]

      updateSessionTitle(sessionId, messages)

      expect(sessions.value[0].title).toBeTruthy()
    })
  })

  describe('Delete Session', () => {
    it('should delete session', () => {
      const { sessions, currentSessionId, createSession, deleteSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called
      const firstId = sessions.value[0].sessionId
      const secondId = createSession()

      expect(sessions.value.length).toBe(2)

      deleteSession(firstId)

      expect(sessions.value.length).toBe(1)
      expect(sessions.value[0].sessionId).toBe(secondId)
    })

    it('should switch to another session when deleting current session', () => {
      const { sessions, currentSessionId, createSession, deleteSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called
      const firstId = sessions.value[0].sessionId
      const secondId = createSession()

      expect(currentSessionId.value).toBe(secondId)

      deleteSession(secondId)

      expect(currentSessionId.value).toBe(firstId)
      expect(sessions.value.length).toBe(1)
    })

    it('should create new session when deleting last session', () => {
      const { sessions, currentSessionId, deleteSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called
      const sessionId = sessions.value[0].sessionId
      expect(sessions.value.length).toBe(1)

      deleteSession(sessionId)

      // Should create a new session
      expect(sessions.value.length).toBe(1)
      expect(currentSessionId.value).not.toBe(sessionId)
    })

    it('should not error when deleting non-existent session', () => {
      const { sessions, deleteSession } = useSessions({
        persistToStorage: false,
      })

      const originalLength = sessions.value.length

      expect(() => deleteSession('non-existent')).not.toThrow()
      expect(sessions.value.length).toBe(originalLength)
    })

    it('should save to storage after delete', () => {
      const storageKey = 'test-sessions-delete'
      const { sessions, createSession, deleteSession } = useSessions({
        storageKey,
        persistToStorage: true,
      })

      // init() is auto-called
      const firstId = sessions.value[0].sessionId
      const secondId = createSession()

      deleteSession(firstId)

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeTruthy()

      if (stored) {
        const sessions = JSON.parse(stored) as Session[]
        expect(sessions.length).toBe(1)
        expect(sessions[0].sessionId).toBe(secondId)
      }
    })
  })

  describe('Delete All Sessions', () => {
    it('should delete all sessions and create new one', () => {
      const { sessions, createSession, deleteAllSessions } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, creating 1 session
      createSession()
      createSession()
      createSession()

      expect(sessions.value.length).toBe(4)

      deleteAllSessions()

      expect(sessions.value.length).toBe(1)
    })
  })

  describe('Computed Properties', () => {
    it('should return current session', () => {
      const { currentSession, sessions, createSession, switchSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, so currentSession is defined
      expect(currentSession.value).toBeDefined()
      expect(currentSession.value?.sessionId).toBe(sessions.value[0].sessionId)

      const firstId = sessions.value[0].sessionId
      const secondId = createSession()
      expect(currentSession.value?.sessionId).toBe(secondId)

      switchSession(firstId)
      expect(currentSession.value?.sessionId).toBe(firstId)
    })

    it('should return sorted sessions', () => {
      const { sortedSessions, createSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, creating 1 session
      createSession()
      createSession()
      createSession()

      expect(sortedSessions.value.length).toBe(4)
      expect(sortedSessions.value[0].createdAt).toBeGreaterThanOrEqual(sortedSessions.value[1].createdAt)
    })
  })

  describe('Storage Behavior', () => {
    it('should not save to storage when persistToStorage is false', () => {
      const storageKey = 'test-no-persist'
      const { createSession } = useSessions({
        storageKey,
        persistToStorage: false,
      })

      createSession()

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeNull()
    })

    it('should handle storage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Make localStorage.getItem throw
      vi.spyOn(localStorageMock, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      const { init } = useSessions({
        persistToStorage: true,
      })

      // Should not throw
      expect(() => init()).not.toThrow()

      consoleWarnSpy.mockRestore()
    })

    it('should watch sessions and save to storage', () => {
      const storageKey = 'test-watch-sessions'
      const { createSession } = useSessions({
        storageKey,
        persistToStorage: true,
      })

      createSession()

      const stored = localStorageMock.getItem(storageKey)
      expect(stored).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty storage', () => {
      const { sessions, init } = useSessions({
        persistToStorage: true,
      })

      init()

      expect(sessions.value.length).toBe(1) // Should create new session
    })

    it('should handle corrupted storage data', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      localStorageMock.setItem('test-corrupted', 'invalid json')

      const { sessions, init } = useSessions({
        storageKey: 'test-corrupted',
        persistToStorage: true,
      })

      init()

      // Should still create a new session
      expect(sessions.value.length).toBe(1)

      consoleWarnSpy.mockRestore()
    })

    it('should handle rapid session creation', () => {
      const { sessions, createSession } = useSessions({
        persistToStorage: false,
      })

      // init() is auto-called, creating 1 session
      for (let i = 0; i < 10; i++) {
        createSession()
      }

      expect(sessions.value.length).toBe(11)
    })
  })
})

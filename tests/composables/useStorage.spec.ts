/**
 * Unit tests for useStorage composable
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadTopicsFromStorage, saveTopicsToStorage, clearTopicsFromStorage } from '../../src/composables/useStorage'
import type { Topic } from '../../src/types'
import { TOPIC_DEFAULTS } from '../../src/constants'
import { TOPICS_SCHEMA_VERSION } from '../../src/utils/storage'

const STORAGE_KEY = TOPIC_DEFAULTS.STORAGE_KEY

describe('useStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('loadTopicsFromStorage', () => {
    it('should return empty array when localStorage is empty', () => {
      const result = loadTopicsFromStorage()
      expect(result).toEqual([])
    })

    it('should load topics from localStorage', () => {
      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 5,
          unreadCount: 0,
        },
        {
          topicId: 'topic-2',
          title: 'Test Topic 2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 3,
          unreadCount: 1,
        },
      ]

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTopics))

      const result = loadTopicsFromStorage()
      expect(result).toEqual(mockTopics)
      expect(result.length).toBe(2)
    })

    it('should return empty array when localStorage data is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json')

      const result = loadTopicsFromStorage()
      expect(result).toEqual([])
    })

    it('should handle localStorage being disabled', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      const result = loadTopicsFromStorage()
      expect(result).toEqual([])

      mockSetItem.mockRestore()
    })

    it('should return empty array when window is undefined (SSR)', () => {
      const originalWindow = global.window
      // @ts-ignore - simulating SSR environment
      delete global.window

      const result = loadTopicsFromStorage()
      expect(result).toEqual([])

      global.window = originalWindow
    })
  })

  describe('saveTopicsToStorage', () => {
    it('should save topics to localStorage with schema versioning', () => {
      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      saveTopicsToStorage(mockTopics)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.version).toBe(TOPICS_SCHEMA_VERSION)
      expect(parsed.data).toEqual(mockTopics)
    })

    it('should overwrite existing topics in localStorage', () => {
      const initialTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Initial Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      saveTopicsToStorage(initialTopics)

      const updatedTopics: Topic[] = [
        {
          topicId: 'topic-2',
          title: 'Updated Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 2,
          unreadCount: 0,
        },
      ]

      saveTopicsToStorage(updatedTopics)

      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(stored!)
      expect(parsed.data).toEqual(updatedTopics)
      expect(parsed.data).not.toEqual(initialTopics)
    })

    it('should handle localStorage being disabled', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      // Should not throw
      expect(() => saveTopicsToStorage(mockTopics)).not.toThrow()

      mockSetItem.mockRestore()
    })

    it('should handle localStorage quota exceeded', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const e = new Error('QuotaExceededError')
        // @ts-ignore
        e.name = 'QuotaExceededError'
        throw e
      })

      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      // Should not throw
      expect(() => saveTopicsToStorage(mockTopics)).not.toThrow()

      mockSetItem.mockRestore()
    })

    it('should return early when window is undefined (SSR)', () => {
      const originalWindow = global.window
      // @ts-ignore - simulating SSR environment
      delete global.window

      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      // Should not throw
      expect(() => saveTopicsToStorage(mockTopics)).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('clearTopicsFromStorage', () => {
    it('should clear topics from localStorage', () => {
      const mockTopics: Topic[] = [
        {
          topicId: 'topic-1',
          title: 'Test Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          unreadCount: 0,
        },
      ]

      saveTopicsToStorage(mockTopics)
      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

      clearTopicsFromStorage()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('should handle clearing empty localStorage', () => {
      // Should not throw when localStorage is empty
      expect(() => clearTopicsFromStorage()).not.toThrow()
    })

    it('should handle localStorage being disabled', () => {
      const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      // Should not throw
      expect(() => clearTopicsFromStorage()).not.toThrow()

      mockRemoveItem.mockRestore()
    })

    it('should handle window being undefined (SSR)', () => {
      const origWindow = globalThis.window
      vi.stubGlobal('window', undefined)

      // Should not throw when window is undefined
      expect(() => clearTopicsFromStorage()).not.toThrow()

      vi.stubGlobal('window', origWindow)
    })
  })
})

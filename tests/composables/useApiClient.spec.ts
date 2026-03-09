/**
 * Unit tests for useApiClient composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useApiClient } from '@/composables/useApiClient'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('composables/useApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useApiClient', () => {
    it('should create API client with options', () => {
      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      expect(client).toBeDefined()
      expect(client.isLoading).toBeDefined()
      expect(client.error).toBeDefined()
    })

    it('should have initial loading state as false', () => {
      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      expect(client.isLoading.value).toBe(false)
    })

    it('should have initial error state as null', () => {
      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      expect(client.error.value).toBeNull()
    })

    it('should have all required methods', () => {
      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      expect(typeof client.streamChat).toBe('function')
      expect(typeof client.sendMessage).toBe('function')
      expect(typeof client.getSessions).toBe('function')
      expect(typeof client.getSessionMessages).toBe('function')
      expect(typeof client.createSession).toBe('function')
      expect(typeof client.deleteSession).toBe('function')
      expect(typeof client.uploadImages).toBe('function')
    })
  })

  describe('sendMessage', () => {
    it('should send message and return result', async () => {
      const mockMessage = {
        id: 'msg_1',
        sessionId: 'session_1',
        role: 'user',
        type: 'text',
        content: 'Hello',
        timestamp: Date.now(),
        status: 'sent',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: mockMessage,
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.sendMessage('session_1', 'Hello')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/chat/message',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockMessage)
    })

    it('should set isLoading during request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { id: 'msg_1' },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const promise = client.sendMessage('session_1', 'Hello')

      expect(client.isLoading.value).toBe(true)

      await promise

      expect(client.isLoading.value).toBe(false)
    })

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      await expect(client.sendMessage('session_1', 'Hello')).rejects.toThrow('API error: 500')
    })

    it('should handle non-zero code response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1,
          message: 'Invalid request',
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      await expect(client.sendMessage('session_1', 'Hello')).rejects.toThrow('Invalid request')
    })
  })

  describe('getSessions', () => {
    it('should fetch sessions', async () => {
      const mockSessions = [
        { id: 'session_1', title: 'Session 1' },
        { id: 'session_2', title: 'Session 2' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { sessions: mockSessions },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.getSessions()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions')
      expect(result).toEqual(mockSessions)
    })
  })

  describe('getSessionMessages', () => {
    it('should fetch session messages', async () => {
      const mockMessages = [
        { id: 'msg_1', content: 'Hello' },
        { id: 'msg_2', content: 'Hi there' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { messages: mockMessages },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.getSessionMessages('session_1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/session_1/messages')
      expect(result).toEqual(mockMessages)
    })
  })

  describe('createSession', () => {
    it('should create session with title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'session_new',
            title: 'New Session',
            createdAt: Date.now(),
          },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.createSession('New Session')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/sessions',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.id).toBe('session_new')
      expect(result.title).toBe('New Session')
    })
  })

  describe('deleteSession', () => {
    it('should delete session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      await client.deleteSession('session_1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/sessions/session_1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('uploadImages', () => {
    it('should upload images', async () => {
      const mockUrls = ['http://example.com/img1.jpg', 'http://example.com/img2.jpg']

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { urls: mockUrls },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const files = [new File([''], 'test1.jpg'), new File([''], 'test2.jpg')]
      const result = await client.uploadImages(files)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/upload/images',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockUrls)
    })
  })
})

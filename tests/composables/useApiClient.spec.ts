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
      expect(typeof client.getTopics).toBe('function')
      expect(typeof client.getTopicMessages).toBe('function')
      expect(typeof client.createTopic).toBe('function')
      expect(typeof client.deleteTopic).toBe('function')
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

  describe('getTopics', () => {
    it('should fetch topics', async () => {
      const mockTopics = [
        { topicId: 'topic_1', title: 'Topic 1' },
        { topicId: 'topic_2', title: 'Topic 2' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { sessions: mockTopics }, // API returns 'sessions' key
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.getTopics()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions')
      expect(result).toEqual(mockTopics)
    })
  })

  describe('getTopicMessages', () => {
    it('should fetch topic messages', async () => {
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

      const result = await client.getTopicMessages('topic_1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/topic_1/messages')
      expect(result).toEqual(mockMessages)
    })
  })

  describe('createTopic', () => {
    it('should create topic with title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            topicId: 'topic_new',
            title: 'New Topic',
            createdAt: Date.now(),
          },
        }),
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      const result = await client.createTopic('New Topic')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/sessions',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.topicId).toBe('topic_new')
      expect(result.title).toBe('New Topic')
    })
  })

  describe('deleteTopic', () => {
    it('should delete topic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      const client = useApiClient({
        baseUrl: 'http://localhost:3000',
      })

      await client.deleteTopic('topic_1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/sessions/topic_1',
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

  describe('streamChat abort', () => {
    it('should pass AbortSignal to fetch', async () => {
      const controller = new AbortController()
      const signal = controller.signal

      // Abort immediately so the fetch throws AbortError
      controller.abort()

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      const gen = client.streamChat('s1', 'hello', undefined, undefined, undefined, { signal })

      // Consume generator (should exit gracefully)
      const chunks: unknown[] = []
      try {
        for await (const chunk of gen) {
          chunks.push(chunk)
        }
      } catch {
        expect.unreachable('streamChat should not throw on AbortError')
      }

      // Verify signal was passed to fetch
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal })
      )
      expect(chunks).toEqual([])
    })

    it('should exit gracefully when aborted before fetch response', async () => {
      const controller = new AbortController()

      // Simulate fetch being aborted before response arrives
      const abortError = new DOMException('The operation was aborted.', 'AbortError')
      mockFetch.mockRejectedValueOnce(abortError)

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      const gen = client.streamChat(
        's1', 'hello', undefined, undefined, undefined,
        { signal: controller.signal }
      )

      // Should not throw, just exit gracefully
      const chunks: unknown[] = []
      try {
        for await (const chunk of gen) {
          chunks.push(chunk)
        }
      } catch {
        // Should not throw
        expect.unreachable('streamChat should not throw on AbortError')
      }

      expect(chunks).toEqual([])
    })

    it('should exit gracefully when aborted during streaming', async () => {
      const controller = new AbortController()

      // Create a reader that throws AbortError on second read
      let readCount = 0
      const mockReader = {
        read: vi.fn().mockImplementation(async () => {
          readCount++
          if (readCount === 1) {
            return { done: false, value: new TextEncoder().encode('data: {"type":"token","content":"Hi"}\n\n') }
          }
          const err = new DOMException('Aborted', 'AbortError')
          throw err
        }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      })

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      const gen = client.streamChat(
        's1', 'hello', undefined, undefined, undefined,
        { signal: controller.signal }
      )

      const chunks: unknown[] = []
      try {
        for await (const chunk of gen) {
          chunks.push(chunk)
        }
      } catch {
        // Should not throw on AbortError
        expect.unreachable('streamChat should not throw on AbortError')
      }

      // Should have received the first token before abort
      expect(chunks.length).toBe(1)
      expect(chunks[0]).toEqual({ type: 'token', content: 'Hi' })
      // Reader should be released
      expect(mockReader.releaseLock).toHaveBeenCalled()
    })
  })

  describe('streamChat reasoning content forwarding', () => {
    it('should forward reasoning content from backend SSE as reasoning events', async () => {
      // Simulates Ollama returning reasoning_content despite enable_thinking: false
      let readCount = 0
      const mockReader = {
        read: vi.fn().mockImplementation(async () => {
          readCount++
          if (readCount === 1) {
            return { done: false, value: new TextEncoder().encode('data: {"type":"reasoning","reasoningContent":"unwanted thinking"}\n\n') }
          }
          if (readCount === 2) {
            return { done: false, value: new TextEncoder().encode('data: {"type":"token","content":"answer"}\n\n') }
          }
          return { done: true, value: undefined }
        }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      })

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      const gen = client.streamChat('s1', 'hello', undefined, undefined, undefined, {
        thinking: { enabled: false },
        signal: new AbortController().signal,
      })

      const chunks: unknown[] = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // The API client should pass through reasoning content as-is;
      // it's the frontend's responsibility to filter based on thinkingRequested
      expect(chunks).toEqual([
        { type: 'reasoning', reasoningContent: 'unwanted thinking' },
        { type: 'token', content: 'answer' },
      ])
    })

    it('should handle stream ending without explicit end event', async () => {
      let readCount = 0
      const mockReader = {
        read: vi.fn().mockImplementation(async () => {
          readCount++
          if (readCount === 1) {
            return { done: false, value: new TextEncoder().encode('data: {"type":"reasoning","reasoningContent":"thinking..."}\n\n') }
          }
          if (readCount === 2) {
            return { done: false, value: new TextEncoder().encode('data: {"type":"token","content":"Hello"}\n\n') }
          }
          return { done: true, value: undefined }
        }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      })

      const client = useApiClient({ baseUrl: 'http://localhost:3000', streamTimeout: 5000 })
      const gen = client.streamChat('s1', 'hello')

      const chunks: unknown[] = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // Should receive reasoning + token, but NO end event
      expect(chunks.length).toBe(2)
      expect(chunks[0].type).toBe('reasoning')
      expect(chunks[1].type).toBe('token')
    })
  })

  describe('updateTopicTitle', () => {
    it('should send PATCH request to update topic title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, message: 'success' }),
      })

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      await client.updateTopicTitle('topic-1', 'My Chat')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/sessions/topic-1/title',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ title: 'My Chat' }),
        })
      )
    })

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const client = useApiClient({ baseUrl: 'http://localhost:3000' })
      await expect(client.updateTopicTitle('t1', 't')).rejects.toThrow('API error: 500')
    })
  })
})

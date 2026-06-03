/**
 * Unit tests for useApiClient composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiClient } from '@/composables/useApiClient'
import type { ApiClientOptions } from '@/composables/useApiClient'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const defaultOptions: ApiClientOptions = {
  baseUrl: 'http://localhost:3000',
}

describe('useApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTopics', () => {
    it('should fetch topics successfully', async () => {
      const mockTopics = [
        { topicId: '1', title: 'Topic 1', createdAt: '2024-01-01T00:00:00.000Z' },
        { topicId: '2', title: 'Topic 2', createdAt: '2024-01-02T00:00:00.000Z' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { sessions: mockTopics } }),
      })

      const client = useApiClient(defaultOptions)
      const topics = await client.getTopics()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions')
      expect(topics).toEqual(mockTopics)
    })

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const client = useApiClient(defaultOptions)
      await expect(client.getTopics()).rejects.toThrow('API error: 500')
    })

    it('should throw on non-zero code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1, message: 'Internal error' }),
      })

      const client = useApiClient(defaultOptions)
      await expect(client.getTopics()).rejects.toThrow('Internal error')
    })
  })

  describe('createTopic', () => {
    it('should create a topic successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { topicId: 'new-1', title: 'New Topic', createdAt: '2024-01-01T00:00:00.000Z' },
        }),
      })

      const client = useApiClient(defaultOptions)
      const topic = await client.createTopic('New Topic')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Topic' }),
      })
      expect(topic.topicId).toBe('new-1')
      expect(topic.messageCount).toBe(0)
    })
  })

  describe('deleteTopic', () => {
    it('should delete a topic successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.deleteTopic('topic-1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/topic-1', {
        method: 'DELETE',
      })
    })

    it('should throw on delete failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      const client = useApiClient(defaultOptions)
      await expect(client.deleteTopic('nonexistent')).rejects.toThrow('API error: 404')
    })
  })

  describe('updateTopicTitle', () => {
    it('should update topic title successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.updateTopicTitle('topic-1', 'Updated Title')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/topic-1/title', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })
    })
  })

  describe('getTopicMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        { messageId: 'm1', content: 'Hello', role: 'user', type: 'text' },
        { messageId: 'm2', content: 'Hi', role: 'assistant', type: 'text' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: mockMessages } }),
      })

      const client = useApiClient(defaultOptions)
      const messages = await client.getTopicMessages('topic-1')

      expect(messages).toEqual(mockMessages)
    })

    it('should convert backend image/video/audio arrays to attachments', async () => {
      const mockMessages = [
        {
          messageId: 'm1',
          content: 'Check this',
          role: 'user',
          type: 'text',
          images: ['http://img1.jpg'],
          videos: ['http://vid1.mp4'],
          audios: ['http://aud1.mp3'],
          documents: [{ name: 'doc.pdf', url: 'http://doc.pdf', size: 1024 }],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: mockMessages } }),
      })

      const client = useApiClient(defaultOptions)
      const messages = await client.getTopicMessages('topic-1')

      expect(messages[0].attachments).toEqual([
        { name: '', url: 'http://img1.jpg', type: 'image' },
        { name: '', url: 'http://vid1.mp4', type: 'video' },
        { name: '', url: 'http://aud1.mp3', type: 'audio' },
        { name: 'doc.pdf', url: 'http://doc.pdf', type: 'document', size: 1024 },
      ])
      expect((messages[0] as Record<string, unknown>).images).toBeUndefined()
      expect((messages[0] as Record<string, unknown>).videos).toBeUndefined()
      expect((messages[0] as Record<string, unknown>).audios).toBeUndefined()
      expect((messages[0] as Record<string, unknown>).documents).toBeUndefined()
    })
  })

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = { messageId: 'm1', content: 'Hello', role: 'assistant' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: mockMessage }),
      })

      const client = useApiClient(defaultOptions)
      const message = await client.sendMessage('session-1', 'Hello')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session-1',
          content: 'Hello',
          images: [],
          videos: [],
          audios: [],
        }),
      })
      expect(message).toEqual(mockMessage)
    })

    it('should include attachments in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messageId: 'm2' } }),
      })

      const client = useApiClient(defaultOptions)
      await client.sendMessage('session-1', 'Check this', [
        { name: '', url: 'http://img.jpg', type: 'image' },
      ])

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.images).toEqual(['http://img.jpg'])
    })
  })

  describe('deleteMessage', () => {
    it('should delete a message successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.deleteMessage('msg-1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/messages/msg-1', {
        method: 'DELETE',
      })
    })
  })

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { urls: ['http://uploaded.jpg'] } }),
      })

      const client = useApiClient(defaultOptions)
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const urls = await client.uploadImages([file])

      expect(urls).toEqual(['http://uploaded.jpg'])
    })
  })

  describe('streamChat', () => {
    it('should create a stream generator', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"token","content":"Hi"}\n\n'))
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('session-1', 'Hello')
      const chunks: string[] = []

      for await (const chunk of generator) {
        if (chunk.type === 'token' && chunk.content) {
          chunks.push(chunk.content)
        }
      }

      expect(chunks).toEqual(['Hi'])
    })

    it('should handle abort signal', async () => {
      const controller = new AbortController()
      controller.abort()

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('session-1', 'Hello', undefined, {
        signal: controller.signal,
      })

      const chunks = []
      for await (const chunk of generator) {
        chunks.push(chunk)
      }
      // Should complete without throwing for abort
      expect(chunks).toEqual([])
    })

    it('should throw on non-abort fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('session-1', 'Hello')

      await expect(async () => {
        for await (const _ of generator) { /* consume */ }
      }).rejects.toThrow('Network error')
    })

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('session-1', 'Hello')

      await expect(async () => {
        for await (const _ of generator) { /* consume */ }
      }).rejects.toThrow('API error: 429')
    })

    it('should handle reasoning content in stream', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"reasoningContent":"thinking..."}\n\n'))
          controller.enqueue(encoder.encode('data: {"content":"answer"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('session-1', 'Hello')
      const results: Array<{ type: string; content?: string; reasoningContent?: string }> = []

      for await (const chunk of generator) {
        results.push(chunk)
      }

      expect(results[0]).toEqual({ type: 'reasoning', reasoningContent: 'thinking...' })
      expect(results[1]).toEqual({ type: 'token', content: 'answer' })
    })

    it('should handle concurrent calls independently', async () => {
      // Two concurrent streams should not interfere with each other
      const encoder = new TextEncoder()

      let callIndex = 0
      mockFetch.mockImplementation(async () => {
        callIndex++
        const content = callIndex === 1 ? 'First' : 'Second'
        return {
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: {"content":"${content}"}\n\n`))
              controller.close()
            },
          }),
        }
      })

      const client = useApiClient(defaultOptions)

      const [gen1, gen2] = [
        client.streamChat('s1', 'Hello 1'),
        client.streamChat('s2', 'Hello 2'),
      ]

      const results1: string[] = []
      const results2: string[] = []

      for await (const chunk of gen1) {
        if (chunk.content) results1.push(chunk.content)
      }
      for await (const chunk of gen2) {
        if (chunk.content) results2.push(chunk.content)
      }

      // Both streams should produce independent results
      expect(results1).toContain('First')
      expect(results2).toContain('Second')
    })
  })
})

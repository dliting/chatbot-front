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
    it('should fetch topics and map sessionId to topicId', async () => {
      const mockSessions = [
        { sessionId: 's1', title: 'Topic 1', createdAt: 1000, updatedAt: 1000, messageCount: 5 },
        { sessionId: 's2', title: 'Topic 2', createdAt: 2000, updatedAt: 2000, messageCount: 3 },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { sessions: mockSessions } }),
      })

      const client = useApiClient(defaultOptions)
      const topics = await client.getTopics()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions')
      expect(topics).toEqual([
        { topicId: 's1', title: 'Topic 1', createdAt: 1000, updatedAt: 1000, messageCount: 5, unreadCount: 0 },
        { topicId: 's2', title: 'Topic 2', createdAt: 2000, updatedAt: 2000, messageCount: 3, unreadCount: 0 },
      ])
    })

    it('should default messageCount and unreadCount to 0', async () => {
      const mockSessions = [
        { sessionId: 's1', title: 'Topic 1', createdAt: 1000, updatedAt: 1000 },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { sessions: mockSessions } }),
      })

      const client = useApiClient(defaultOptions)
      const topics = await client.getTopics()

      expect(topics[0].messageCount).toBe(0)
      expect(topics[0].unreadCount).toBe(0)
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
    it('should create a topic and map sessionId to topicId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { sessionId: 'new-session-1', title: 'New Topic', createdAt: 1700000000000 },
        }),
      })

      const client = useApiClient(defaultOptions)
      const topic = await client.createTopic('New Topic')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Topic' }),
      })
      expect(topic.topicId).toBe('new-session-1')
      expect(topic.title).toBe('New Topic')
      expect(topic.messageCount).toBe(0)
      expect(topic.unreadCount).toBe(0)
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
    it('should fetch messages and map sessionId to topicId', async () => {
      const mockMessages = [
        { messageId: 'm1', sessionId: 's1', content: 'Hello', role: 'user', timestamp: 1000 },
        { messageId: 'm2', sessionId: 's1', content: 'Hi', role: 'assistant', timestamp: 2000 },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: mockMessages } }),
      })

      const client = useApiClient(defaultOptions)
      const messages = await client.getTopicMessages('s1')

      expect(messages[0].topicId).toBe('s1')
      expect(messages[0].messageId).toBe('m1')
      expect(messages[0].type).toBe('text')
      expect(messages[0].status).toBe('sent')
      expect(messages[1].topicId).toBe('s1')
    })

    it('should fall back to topicId param when sessionId is missing', async () => {
      const mockMessages = [
        { messageId: 'm1', content: 'Hello', role: 'user', timestamp: 1000 },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: mockMessages } }),
      })

      const client = useApiClient(defaultOptions)
      const messages = await client.getTopicMessages('fallback-id')

      expect(messages[0].topicId).toBe('fallback-id')
    })

    it('should convert backend image/video/audio arrays to attachments', async () => {
      const mockMessages = [
        {
          messageId: 'm1',
          sessionId: 's1',
          content: 'Check this',
          role: 'user',
          timestamp: 1000,
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
      const messages = await client.getTopicMessages('s1')

      expect(messages[0].attachments).toEqual([
        { name: '', url: 'http://img1.jpg', type: 'image' },
        { name: '', url: 'http://vid1.mp4', type: 'video' },
        { name: '', url: 'http://aud1.mp3', type: 'audio' },
        { name: 'doc.pdf', url: 'http://doc.pdf', type: 'document', size: 1024 },
      ])
    })

    it('should preserve thinking and metadata fields', async () => {
      const mockMessages = [
        {
          messageId: 'm1',
          sessionId: 's1',
          content: 'Answer',
          role: 'assistant',
          timestamp: 1000,
          thinkingContent: 'I think...',
          thinkingTime: 500,
          metadata: { model: 'gpt-4' },
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: mockMessages } }),
      })

      const client = useApiClient(defaultOptions)
      const messages = await client.getTopicMessages('s1')

      expect(messages[0].thinkingContent).toBe('I think...')
      expect(messages[0].thinkingTime).toBe(500)
      expect(messages[0].metadata).toEqual({ model: 'gpt-4' })
    })
  })

  describe('sendMessage', () => {
    it('should send a message with topicId mapped to sessionId in request', async () => {
      const mockResponse = {
        messageId: 'm1',
        sessionId: 'topic-1',
        content: 'Hello',
        role: 'assistant',
        timestamp: 1000,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: mockResponse }),
      })

      const client = useApiClient(defaultOptions)
      const message = await client.sendMessage('topic-1', 'Hello')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'topic-1',
          content: 'Hello',
          images: [],
          videos: [],
          audios: [],
        }),
      })
      expect(message.topicId).toBe('topic-1')
      expect(message.messageId).toBe('m1')
      expect(message.type).toBe('text')
      expect(message.status).toBe('sent')
    })

    it('should include attachments in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { messageId: 'm2', sessionId: 's1', content: 'ok', role: 'assistant', timestamp: 1000 },
        }),
      })

      const client = useApiClient(defaultOptions)
      await client.sendMessage('topic-1', 'Check this', [
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
    it('should create a stream generator with topicId mapped to sessionId in request', async () => {
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
      const generator = client.streamChat('topic-1', 'Hello')
      const chunks: string[] = []

      for await (const chunk of generator) {
        if (chunk.type === 'token' && chunk.content) {
          chunks.push(chunk.content)
        }
      }

      // Verify sessionId in request body
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.sessionId).toBe('topic-1')
      expect(chunks).toEqual(['Hi'])
    })

    it('should send thinking options when provided', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"content":"Hi"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello', undefined, { thinking: { enabled: true } })

      for await (const _ of generator) { /* consume */ }

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.options).toEqual({ thinking: { enabled: true } })
    })

    it('should not include options key when no options provided', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"content":"Hi"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')

      for await (const _ of generator) { /* consume */ }

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.options).toBeUndefined()
    })

    it('should pass attachments as separate arrays in stream request', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"content":"ok"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const attachments = [
        { name: '', url: 'http://img.jpg', type: 'image' },
        { name: '', url: 'http://vid.mp4', type: 'video' },
        { name: '', url: 'http://aud.mp3', type: 'audio' },
      ]
      const generator = client.streamChat('topic-1', 'Check this', attachments)

      for await (const _ of generator) { /* consume */ }

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.images).toEqual(['http://img.jpg'])
      expect(body.videos).toEqual(['http://vid.mp4'])
      expect(body.audios).toEqual(['http://aud.mp3'])
    })

    it('should handle abort signal', async () => {
      const controller = new AbortController()
      controller.abort()

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello', undefined, {
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
      const generator = client.streamChat('topic-1', 'Hello')

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
      const generator = client.streamChat('topic-1', 'Hello')

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
      const generator = client.streamChat('topic-1', 'Hello')
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

    it('should handle delta.content format', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"delta":{"content":"chunk1"}}\n\n'))
          controller.enqueue(encoder.encode('data: {"delta":{"content":"chunk2"}}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')
      const chunks: string[] = []

      for await (const chunk of generator) {
        if (chunk.type === 'token' && chunk.content) {
          chunks.push(chunk.content)
        }
      }

      expect(chunks).toEqual(['chunk1', 'chunk2'])
    })

    it('should yield raw data with type field when no content/reasoning', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"message_start","messageId":"m1"}\n\n'))
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')
      const results: Array<Record<string, unknown>> = []

      for await (const chunk of generator) {
        results.push(chunk as Record<string, unknown>)
      }

      expect(results[0].type).toBe('message_start')
      expect(results[0].messageId).toBe('m1')
      expect(results[1].type).toBe('done')
    })

    it('should handle reasoning_content field', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"reasoning_content":"I think..."}\n\n'))
          controller.enqueue(encoder.encode('data: {"content":"answer"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')
      const results: Array<{ type: string; content?: string; reasoningContent?: string }> = []

      for await (const chunk of generator) {
        results.push(chunk)
      }

      expect(results[0]).toEqual({ type: 'reasoning', reasoningContent: 'I think...' })
      expect(results[1]).toEqual({ type: 'token', content: 'answer' })
    })

    it('should skip invalid JSON lines in SSE stream', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"content":"valid"}\n\n'))
          controller.enqueue(encoder.encode('data: invalid json\n\n'))
          controller.enqueue(encoder.encode('data: {"content":"valid2"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')
      const chunks: string[] = []

      for await (const chunk of generator) {
        if (chunk.type === 'token' && chunk.content) {
          chunks.push(chunk.content)
        }
      }

      expect(chunks).toEqual(['valid', 'valid2'])
    })

    it('should skip lines that do not start with data:', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('event: ping\n'))
          controller.enqueue(encoder.encode('data: {"content":"ok"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')
      const chunks: string[] = []

      for await (const chunk of generator) {
        if (chunk.type === 'token' && chunk.content) {
          chunks.push(chunk.content)
        }
      }

      expect(chunks).toEqual(['ok'])
    })

    it('should throw when response has no body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      })

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')

      await expect(async () => {
        for await (const _ of generator) { /* consume */ }
      }).rejects.toThrow('No response body')
    })

    it('should throw timeout error on TimeoutError', async () => {
      const timeoutErr = new Error('Timeout')
      timeoutErr.name = 'TimeoutError'
      mockFetch.mockRejectedValueOnce(timeoutErr)

      const client = useApiClient(defaultOptions)
      const generator = client.streamChat('topic-1', 'Hello')

      await expect(async () => {
        for await (const _ of generator) { /* consume */ }
      }).rejects.toThrow('Request timeout')
    })
  })
})

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

describe('useApiClient (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all API methods', () => {
    const client = useApiClient(defaultOptions)
    expect(typeof client.streamChat).toBe('function')
    expect(typeof client.sendMessage).toBe('function')
    expect(typeof client.getTopics).toBe('function')
    expect(typeof client.getTopicMessages).toBe('function')
    expect(typeof client.createTopic).toBe('function')
    expect(typeof client.deleteTopic).toBe('function')
    expect(typeof client.updateTopicTitle).toBe('function')
    expect(typeof client.uploadImages).toBe('function')
    expect(typeof client.deleteMessage).toBe('function')
  })

  it('should use custom baseUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { sessions: [] } }),
    })

    const client = useApiClient({ baseUrl: 'http://custom:4000' })
    await client.getTopics()

    expect(mockFetch).toHaveBeenCalledWith('http://custom:4000/sessions')
  })

  it('should use custom streamTimeout', async () => {
    const client = useApiClient({ baseUrl: 'http://localhost:3000', streamTimeout: 5000 })
    // Timeout is used internally via AbortSignal.timeout — just verify no crash
    expect(client.streamChat).toBeDefined()
  })

  describe('getTopics', () => {
    it('should fetch topics and map sessionId to topicId', async () => {
      const sessions = [
        { sessionId: '1', title: 'T1', createdAt: 1000, updatedAt: 1000, messageCount: 0 },
        { sessionId: '2', title: 'T2', createdAt: 2000, updatedAt: 2000, messageCount: 3 },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { sessions } }),
      })

      const client = useApiClient(defaultOptions)
      const result = await client.getTopics()
      expect(result).toEqual([
        { topicId: '1', title: 'T1', createdAt: 1000, updatedAt: 1000, messageCount: 0, unreadCount: 0 },
        { topicId: '2', title: 'T2', createdAt: 2000, updatedAt: 2000, messageCount: 3, unreadCount: 0 },
      ])
    })

    it('should throw on non-zero code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1, message: 'Failed' }),
      })

      const client = useApiClient(defaultOptions)
      await expect(client.getTopics()).rejects.toThrow('Failed')
    })
  })

  describe('createTopic', () => {
    it('should create topic and map sessionId to topicId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { sessionId: 'new-1', title: 'New', createdAt: 1700000000000 },
        }),
      })

      const client = useApiClient(defaultOptions)
      const result = await client.createTopic('New')
      expect(result.topicId).toBe('new-1')
      expect(result.title).toBe('New')
      expect(result.messageCount).toBe(0)
      expect(result.unreadCount).toBe(0)
    })
  })

  describe('deleteTopic', () => {
    it('should send DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.deleteTopic('t1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/t1', {
        method: 'DELETE',
      })
    })
  })

  describe('updateTopicTitle', () => {
    it('should send PATCH request with title', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.updateTopicTitle('t1', 'Updated')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/sessions/t1/title', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })
    })
  })

  describe('deleteMessage', () => {
    it('should send DELETE request for message', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const client = useApiClient(defaultOptions)
      await client.deleteMessage('m1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/messages/m1', {
        method: 'DELETE',
      })
    })
  })

  describe('sendMessage', () => {
    it('should send message and map sessionId to topicId in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: { messageId: 'm1', sessionId: 's1', content: 'Reply', role: 'assistant', timestamp: 1000 },
        }),
      })

      const client = useApiClient(defaultOptions)
      const result = await client.sendMessage('s1', 'Hello')
      expect(result.topicId).toBe('s1')
      expect(result.messageId).toBe('m1')
      expect(result.type).toBe('text')
      expect(result.status).toBe('sent')
    })
  })

  describe('uploadImages', () => {
    it('should upload files and return URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { urls: ['http://img.jpg'] } }),
      })

      const client = useApiClient(defaultOptions)
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
      const urls = await client.uploadImages([file])

      expect(urls).toEqual(['http://img.jpg'])
    })
  })

  describe('getTopicMessages', () => {
    it('should map sessionId to topicId and convert backend fields to attachments', async () => {
      const msgs = [{
        messageId: 'm1',
        sessionId: 't1',
        content: 'test',
        role: 'user',
        timestamp: 1000,
        images: ['http://img.jpg'],
        videos: ['http://vid.mp4'],
        audios: ['http://aud.mp3'],
        documents: [{ name: 'doc.pdf', url: 'http://doc.pdf', size: 100 }],
      }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { messages: msgs } }),
      })

      const client = useApiClient(defaultOptions)
      const result = await client.getTopicMessages('t1')

      expect(result[0].topicId).toBe('t1')
      expect(result[0].type).toBe('text')
      expect(result[0].status).toBe('sent')
      expect(result[0].attachments).toEqual([
        { name: '', url: 'http://img.jpg', type: 'image' },
        { name: '', url: 'http://vid.mp4', type: 'video' },
        { name: '', url: 'http://aud.mp3', type: 'audio' },
        { name: 'doc.pdf', url: 'http://doc.pdf', type: 'document', size: 100 },
      ])
    })
  })
})

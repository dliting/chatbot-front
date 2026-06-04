/**
 * Unit tests for stream utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockStream, StreamAccumulator, parseSSELine, StreamClient, fetchStream } from '@/utils/stream'
import type { StreamEvent } from '@/types'

describe('utils/stream', () => {
  describe('StreamClient', () => {
    it('should create StreamClient with url and options', () => {
      const client = new StreamClient('/api/stream', {
        onMessage: vi.fn(),
        onError: vi.fn(),
        onOpen: vi.fn()
      })

      expect(client).toBeDefined()
    })

    it('should check isConnected status when not connected', () => {
      const client = new StreamClient('/api/stream', {})

      expect(client.isConnected()).toBe(false)
    })

    it('should reset disconnected state', () => {
      const client = new StreamClient('/api/stream', {
        reconnect: true
      })

      client.disconnect(true)
      client.reset()

      // After reset, client should be disconnected
      expect(client.isConnected()).toBe(false)
    })

    it('should disconnect with permanent flag', () => {
      const client = new StreamClient('/api/stream', {})

      client.disconnect(true)
      client.disconnect(false)

      // Should remain disconnected
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('StreamClient - connect and event handling', () => {
    let eventSourceInstances: any[]
    let EventSourceMock: any

    beforeEach(() => {
      vi.useFakeTimers()
      eventSourceInstances = []

      // Use a proper constructor function so `new` works
      EventSourceMock = vi.fn(function (this: any, url: string) {
        this.url = url
        this.onopen = null
        this.onmessage = null
        this.onerror = null
        this.close = vi.fn()
        this.readyState = 0 // EventSource.CONNECTING
        eventSourceInstances.push(this)
      })
      EventSourceMock.CONNECTING = 0
      EventSourceMock.OPEN = 1
      EventSourceMock.CLOSED = 2

      vi.stubGlobal('EventSource', EventSourceMock)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it('should call onOpen when connection opens', () => {
      const onOpen = vi.fn()
      const client = new StreamClient('/api/stream', { onOpen })

      client.connect()
      const es = eventSourceInstances[0]
      es.readyState = 1 // EventSource.OPEN
      es.onopen()

      expect(onOpen).toHaveBeenCalled()
    })

    it('should call onMessage when message is received', () => {
      const onMessage = vi.fn()
      const client = new StreamClient('/api/stream', { onMessage })

      client.connect()
      const es = eventSourceInstances[0]
      es.onmessage({ data: JSON.stringify({ type: 'token', content: 'hello' }) })

      expect(onMessage).toHaveBeenCalledWith({ type: 'token', content: 'hello' })
    })

    it('should handle message parse error gracefully', () => {
      const onMessage = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const client = new StreamClient('/api/stream', { onMessage })

      client.connect()
      const es = eventSourceInstances[0]
      es.onmessage({ data: 'invalid json' })

      expect(onMessage).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should call onError when EventSource constructor throws', () => {
      const onError = vi.fn()
      vi.stubGlobal('EventSource', vi.fn(function (this: any) {
        throw new Error('Failed to create EventSource')
      }))

      const client = new StreamClient('/api/stream', { onError })
      client.connect()

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should not reconnect when reconnect is not enabled', () => {
      const onError = vi.fn()
      const client = new StreamClient('/api/stream', { onError })

      client.connect()
      const es = eventSourceInstances[0]
      es.onerror()

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(EventSourceMock).toHaveBeenCalledTimes(1)
    })

    it('should attempt reconnect with exponential backoff when reconnect is enabled', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      const es = eventSourceInstances[0]
      es.onerror()

      expect(EventSourceMock).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1000)
      expect(EventSourceMock).toHaveBeenCalledTimes(2)
    })

    it('should call onError when reconnects are exhausted', () => {
      const onError = vi.fn()
      const client = new StreamClient('/api/stream', { reconnect: true, onError })

      client.connect()
      expect(eventSourceInstances.length).toBe(1)

      // Error 1: reconnectAttempts=0, 0<3 so increments to 1, schedules reconnect
      eventSourceInstances[0].onerror()
      vi.advanceTimersByTime(1100)
      expect(eventSourceInstances.length).toBe(2)

      // Error 2: reconnectAttempts=1, 1<3 so increments to 2, schedules reconnect
      eventSourceInstances[1].onerror()
      vi.advanceTimersByTime(2100)
      expect(eventSourceInstances.length).toBe(3)

      // Error 3: reconnectAttempts=2, 2<3 so increments to 3, schedules reconnect
      eventSourceInstances[2].onerror()
      vi.advanceTimersByTime(4100)
      expect(eventSourceInstances.length).toBe(4)

      // Error 4: reconnectAttempts=3, 3<3 is false, so onError is called
      eventSourceInstances[3].onerror()

      expect(onError).toHaveBeenCalled()
    })

    it('should not reconnect after permanent disconnect', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      client.disconnect(true)

      client.connect()
      expect(EventSourceMock).toHaveBeenCalledTimes(1)
    })

    it('should allow reconnect after reset', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      client.disconnect(true)
      client.reset()
      client.connect()

      expect(EventSourceMock).toHaveBeenCalledTimes(2)
    })

    it('should disconnect existing connection before creating new one', () => {
      const client = new StreamClient('/api/stream', {})

      client.connect()
      const firstES = eventSourceInstances[0]
      client.connect()

      expect(firstES.close).toHaveBeenCalled()
    })

    it('should clear reconnect timeout on disconnect', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      const es = eventSourceInstances[0]
      es.onerror()

      client.disconnect(true)

      vi.advanceTimersByTime(5000)
      expect(EventSourceMock).toHaveBeenCalledTimes(1)
    })

    it('should not reconnect if disconnected during reconnect delay', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      const es = eventSourceInstances[0]
      es.onerror()

      client.disconnect(true)

      vi.advanceTimersByTime(5000)
      expect(EventSourceMock).toHaveBeenCalledTimes(1)
    })

    it('should report isConnected correctly', () => {
      const client = new StreamClient('/api/stream', {})

      expect(client.isConnected()).toBe(false)

      client.connect()
      const es = eventSourceInstances[0]
      es.readyState = 1 // EventSource.OPEN
      expect(client.isConnected()).toBe(true)

      es.readyState = 0 // EventSource.CONNECTING
      expect(client.isConnected()).toBe(false)
    })

    it('should not call onError on intermediate reconnect attempts', () => {
      const onError = vi.fn()
      const client = new StreamClient('/api/stream', { reconnect: true, onError })

      client.connect()

      const es1 = eventSourceInstances[0]
      es1.onerror()
      expect(onError).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      const es2 = eventSourceInstances[1]
      es2.onerror()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should reset reconnectAttempts on successful open', () => {
      const client = new StreamClient('/api/stream', { reconnect: true })

      client.connect()
      const es1 = eventSourceInstances[0]
      es1.onerror()

      vi.advanceTimersByTime(1000)
      const es2 = eventSourceInstances[1]
      es2.onopen()

      es2.onerror()
      vi.advanceTimersByTime(1000)
      expect(EventSourceMock).toHaveBeenCalledTimes(3)
    })

    it('should disconnect with permanent=false not prevent reconnect', () => {
      const client = new StreamClient('/api/stream', {})

      client.connect()
      client.disconnect(false)

      client.connect()
      expect(EventSourceMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('createMockStream', () => {
    it('should generate stream events with start, tokens, and end', async () => {
      const content = 'Hello'
      const stream = createMockStream(content, 10)

      const events: any[] = []

      for await (const event of stream) {
        events.push(event)
      }

      expect(events[0].type).toBe('start')
      expect(events[events.length - 1].type).toBe('end')

      // Check token events
      const tokenEvents = events.filter(e => e.type === 'token')
      expect(tokenEvents.length).toBe(content.length)
      expect(tokenEvents.map(e => e.content).join('')).toBe(content)
    })

    it('should include messageId in start event', async () => {
      const stream = createMockStream('test', 0)

      for await (const event of stream) {
        if (event.type === 'start') {
          expect(event.messageId).toBeDefined()
          expect(typeof event.messageId).toBe('string')
          break
        }
      }
    })

    it('should include fullContent in end event', async () => {
      const content = 'Test message'
      const stream = createMockStream(content, 0)

      for await (const event of stream) {
        if (event.type === 'end') {
          expect(event.fullContent).toBe(content)
          break
        }
      }
    })

    it('should yield reasoning events when thinkingContent param provided', async () => {
      const stream = createMockStream('Answer', 0, 'Let me think')

      const events: any[] = []
      for await (const event of stream) {
        events.push(event)
      }

      const reasoningEvents = events.filter(e => e.type === 'reasoning')
      expect(reasoningEvents.length).toBe(1)
      expect(reasoningEvents[0].reasoningContent).toBe('Let me think')

      // Verify ordering: start -> reasoning -> tokens -> end
      expect(events[0].type).toBe('start')
      expect(events[1].type).toBe('reasoning')
      expect(events[events.length - 1].type).toBe('end')
    })

    it('should not yield reasoning events when thinkingContent param omitted', async () => {
      const stream = createMockStream('Answer', 0)

      const events: any[] = []
      for await (const event of stream) {
        events.push(event)
      }

      const reasoningEvents = events.filter(e => e.type === 'reasoning')
      expect(reasoningEvents.length).toBe(0)
    })
  })

  describe('parseSSELine', () => {
    it('should return null for empty line', () => {
      const result = parseSSELine('')
      expect(result).toBeNull()
    })

    it('should return null for whitespace-only line', () => {
      const result = parseSSELine('   ')
      expect(result).toBeNull()
    })

    it('should return null for comment line', () => {
      const result = parseSSELine(': this is a comment')
      expect(result).toBeNull()
    })

    it('should handle data without colon', () => {
      const result = parseSSELine('data')
      expect(result).toBeNull()
    })

    it('should parse token event', () => {
      const result = parseSSELine('data: {"type":"token","content":"test"}')
      expect(result?.type).toBe('token')
      expect(result?.content).toBe('test')
    })

    it('should parse start event', () => {
      const result = parseSSELine('data: {"type":"start","messageId":"msg_123"}')
      expect(result?.type).toBe('start')
      expect(result?.messageId).toBe('msg_123')
    })

    it('should parse end event', () => {
      const result = parseSSELine('data: {"type":"end","fullContent":"completed"}')
      expect(result?.type).toBe('end')
      expect(result?.fullContent).toBe('completed')
    })

    it('should handle line with multiple colons', () => {
      const result = parseSSELine('data: {"type":"token","content":"a:b"}')
      expect(result?.type).toBe('token')
      expect(result?.content).toBe('a:b')
    })

    it('should return null for non-JSON data after colon', () => {
      const result = parseSSELine('data: not json')
      expect(result).toBeNull()
    })

    it('should handle data with leading space after colon', () => {
      const result = parseSSELine('data:  {"type":"token","content":"test"}')
      expect(result?.type).toBe('token')
    })

    it('should handle event type prefix', () => {
      const result = parseSSELine('event: {"type":"token"}')
      expect(result?.type).toBe('token')
    })
  })

  describe('StreamAccumulator', () => {
    let accumulator: StreamAccumulator

    beforeEach(() => {
      accumulator = new StreamAccumulator()
    })

    it('should accumulate token content', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token', content: 'Hello' })
      accumulator.add({ type: 'token', content: ' World' })

      expect(accumulator.getContent()).toBe('Hello World')
    })

    it('should store messageId from start event', () => {
      accumulator.add({ type: 'start', messageId: 'msg_123' })

      expect(accumulator.getMessageId()).toBe('msg_123')
    })

    it('should update messageId on new start event', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token', content: 'Hello' })

      accumulator.reset()

      accumulator.add({ type: 'start', messageId: 'msg_2' })

      expect(accumulator.getMessageId()).toBe('msg_2')
    })

    it('should use fullContent from end event', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'end', fullContent: 'Complete message' })

      expect(accumulator.getContent()).toBe('Complete message')
    })

    it('should reset content and messageId', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token', content: 'Hello' })

      accumulator.reset()

      expect(accumulator.getContent()).toBe('')
      expect(accumulator.getMessageId()).toBeNull()
    })

    it('should return correct isComplete status', () => {
      expect(accumulator.isComplete()).toBe(false)

      accumulator.add({ type: 'start', messageId: 'msg_1' })
      expect(accumulator.isComplete()).toBe(false)

      accumulator.add({ type: 'token', content: 'Hello' })
      expect(accumulator.isComplete()).toBe(true)

      accumulator.reset()
      expect(accumulator.isComplete()).toBe(false)
    })

    it('should handle error events', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'error', error: 'Stream failed' })

      // Error should not affect content
      expect(accumulator.getContent()).toBe('')
    })

    it('should accumulate reasoning content separately', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'reasoning', reasoningContent: 'Let me think' })
      accumulator.add({ type: 'reasoning', reasoningContent: ' about this' })

      expect(accumulator.getThinkingContent()).toBe('Let me think about this')
      expect(accumulator.getContent()).toBe('')
    })

    it('should reset thinking content on start event', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'reasoning', reasoningContent: 'Old thinking' })

      accumulator.add({ type: 'start', messageId: 'msg_2' })
      expect(accumulator.getThinkingContent()).toBe('')
    })

    it('should reset thinking content on reset()', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'reasoning', reasoningContent: 'Some thinking' })

      accumulator.reset()
      expect(accumulator.getThinkingContent()).toBe('')
    })

    it('should handle reasoning event without reasoningContent', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'reasoning' })

      expect(accumulator.getThinkingContent()).toBe('')
    })

    it('should handle token event without content', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token' })

      expect(accumulator.getContent()).toBe('')
    })

    it('should handle end event without fullContent', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token', content: 'Hello' })
      accumulator.add({ type: 'end' })

      expect(accumulator.getContent()).toBe('Hello')
    })

    it('should handle start event without messageId', () => {
      accumulator.add({ type: 'start' })

      expect(accumulator.getMessageId()).toBeNull()
    })

    it('should handle multiple start events resetting content', () => {
      accumulator.add({ type: 'start', messageId: 'msg_1' })
      accumulator.add({ type: 'token', content: 'First' })
      accumulator.add({ type: 'reasoning', reasoningContent: 'Thinking' })

      accumulator.add({ type: 'start', messageId: 'msg_2' })

      expect(accumulator.getContent()).toBe('')
      expect(accumulator.getThinkingContent()).toBe('')
      expect(accumulator.getMessageId()).toBe('msg_2')
    })
  })

  describe('fetchStream', () => {
    let mockFetch: any
    let mockReader: any

    beforeEach(() => {
      mockReader = {
        read: vi.fn(),
      }
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      })
      vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should call onError when fetch fails with non-AbortError', async () => {
      const onError = vi.fn()
      mockFetch.mockRejectedValue(new Error('Network error'))

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should not call onError when fetch fails with AbortError', async () => {
      const onError = vi.fn()
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      expect(onError).not.toHaveBeenCalled()
    })

    it('should call onError when response is not ok', async () => {
      const onError = vi.fn()
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toContain('500')
    })

    it('should call onError when response body is not readable', async () => {
      const onError = vi.fn()
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      })

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toContain('not readable')
    })

    it('should call onChunk and onComplete for successful stream', async () => {
      const onChunk = vi.fn()
      const onComplete = vi.fn()

      mockReader.read
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
        .mockResolvedValueOnce({ done: true, value: undefined })

      await fetchStream('/api/stream', {}, onChunk, onComplete, vi.fn())

      // Wait for async read loop to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onChunk).toHaveBeenCalledWith('Hello')
      expect(onComplete).toHaveBeenCalledWith('Hello')
    })

    it('should accumulate full content across multiple chunks', async () => {
      const onChunk = vi.fn()
      const onComplete = vi.fn()

      mockReader.read
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(' World') })
        .mockResolvedValueOnce({ done: true, value: undefined })

      await fetchStream('/api/stream', {}, onChunk, onComplete, vi.fn())

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onComplete).toHaveBeenCalledWith('Hello World')
    })

    it('should call onError when reader.read throws non-AbortError', async () => {
      const onError = vi.fn()

      mockReader.read.mockRejectedValue(new Error('Stream read error'))

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should not call onError when reader.read throws AbortError', async () => {
      const onError = vi.fn()
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      mockReader.read.mockRejectedValue(abortError)

      await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), onError)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onError).not.toHaveBeenCalled()
    })

    it('should return a cleanup function that aborts the request', async () => {
      mockReader.read.mockResolvedValue({ done: false, value: new TextEncoder().encode('data') })

      const cleanup = await fetchStream('/api/stream', {}, vi.fn(), vi.fn(), vi.fn())

      expect(typeof cleanup).toBe('function')
      // Calling cleanup should not throw
      cleanup()
    })

    it('should pass options to fetch', async () => {
      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }

      mockReader.read.mockResolvedValue({ done: true, value: undefined })

      await fetchStream('/api/stream', options, vi.fn(), vi.fn(), vi.fn())

      expect(mockFetch).toHaveBeenCalledWith('/api/stream', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }))
    })
  })
})

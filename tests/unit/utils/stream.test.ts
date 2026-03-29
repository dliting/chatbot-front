/**
 * Unit tests for stream utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockStream, StreamAccumulator, parseSSELine, StreamClient } from '@/utils/stream'

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
  })
})

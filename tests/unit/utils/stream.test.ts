/**
 * Unit tests for stream utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockStream, StreamAccumulator } from '@/utils/stream'

describe('utils/stream', () => {
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
  })
})

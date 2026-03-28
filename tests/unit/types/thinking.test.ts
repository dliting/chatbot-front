import { describe, it, expect } from 'vitest'
import type { Message, StreamEvent } from '@/types'

describe('Thinking type extensions', () => {
  it('Message should accept thinkingContent and thinkingTime', () => {
    const message: Message = {
      messageId: 'msg-1', sessionId: 'sess-1', role: 'assistant',
      type: 'text', content: 'Hello', timestamp: Date.now(), status: 'sent',
      thinkingContent: 'Let me think about this...', thinkingTime: 3500,
    }
    expect(message.thinkingContent).toBe('Let me think about this...')
    expect(message.thinkingTime).toBe(3500)
  })

  it('Message should work without thinking fields (backward compat)', () => {
    const message: Message = {
      messageId: 'msg-2', sessionId: 'sess-1', role: 'user',
      type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent',
    }
    expect(message.thinkingContent).toBeUndefined()
  })

  it('StreamEvent should support reasoning type', () => {
    const event: StreamEvent = {
      type: 'reasoning', reasoningContent: 'Thinking step...', thinkingTime: 1200,
    }
    expect(event.type).toBe('reasoning')
    expect(event.reasoningContent).toBe('Thinking step...')
  })
})

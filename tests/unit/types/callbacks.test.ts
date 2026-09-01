import { describe, it, expect } from 'vitest'
import type { ChatbotCallbacks, SendMessageParams } from '@/types/config'
import type { Topic, Attachment } from '@/types'

describe('ChatbotCallbacks', () => {
  it('should accept all optional callbacks (empty object)', () => {
    const callbacks: ChatbotCallbacks = {}
    expect(callbacks).toBeDefined()
  })

  it('should accept onSendMessage callback returning AsyncGenerator', async () => {
    const callbacks: ChatbotCallbacks = {
      async *onSendMessage(params: SendMessageParams) {
        yield { type: 'start', messageId: 'm1' }
        yield { type: 'token', content: 'hello' }
        yield { type: 'end', fullContent: 'hello' }
      },
    }
    expect(callbacks.onSendMessage).toBeDefined()
  })

  it('should accept onDeleteMessage callback', () => {
    const callbacks: ChatbotCallbacks = {
      onDeleteMessage: async (messageId: string, topicId: string) => {
        // call backend
      },
    }
    expect(callbacks.onDeleteMessage).toBeDefined()
  })

  it('should accept onEditMessage callback', () => {
    const callbacks: ChatbotCallbacks = {
      async *onEditMessage(params: SendMessageParams) {
        yield { type: 'start', messageId: 'm1' }
        yield { type: 'end', fullContent: 'edited' }
      },
    }
    expect(callbacks.onEditMessage).toBeDefined()
  })

  it('should accept onRegenerateMessage callback', () => {
    const callbacks: ChatbotCallbacks = {
      async *onRegenerateMessage(params: SendMessageParams) {
        yield { type: 'start', messageId: 'm1' }
        yield { type: 'end', fullContent: 'regenerated' }
      },
    }
    expect(callbacks.onRegenerateMessage).toBeDefined()
  })

  it('should accept onLoadTopics callback', () => {
    const callbacks: ChatbotCallbacks = {
      onLoadTopics: async () => [],
    }
    expect(callbacks.onLoadTopics).toBeDefined()
  })

  it('should accept onLoadMessages callback', () => {
    const callbacks: ChatbotCallbacks = {
      onLoadMessages: async (topicId: string) => [],
    }
    expect(callbacks.onLoadMessages).toBeDefined()
  })

  it('should accept onCreateTopic returning Topic', () => {
    const callbacks: ChatbotCallbacks = {
      onCreateTopic: async (title?: string) => ({
        topicId: 'new-topic',
        title: title || 'New Topic',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        unreadCount: 0,
      }),
    }
    expect(callbacks.onCreateTopic).toBeDefined()
  })

  it('should accept onSwitchTopic callback', () => {
    const callbacks: ChatbotCallbacks = {
      onSwitchTopic: async (topicId: string) => {},
    }
    expect(callbacks.onSwitchTopic).toBeDefined()
  })

  it('should accept onDeleteTopic callback', () => {
    const callbacks: ChatbotCallbacks = {
      onDeleteTopic: async (topicId: string) => {},
    }
    expect(callbacks.onDeleteTopic).toBeDefined()
  })

  it('should accept onUpdateTopicTitle callback', () => {
    const callbacks: ChatbotCallbacks = {
      onUpdateTopicTitle: async (topicId: string, title: string) => {},
    }
    expect(callbacks.onUpdateTopicTitle).toBeDefined()
  })

  it('should accept onClearMessages callback', () => {
    const callbacks: ChatbotCallbacks = {
      onClearMessages: async (topicId: string) => {},
    }
    expect(callbacks.onClearMessages).toBeDefined()
  })

  it('should accept onUploadImages callback', () => {
    const callbacks: ChatbotCallbacks = {
      onUploadImages: async (files: File[]) => ({ urls: ['http://example.com/img.jpg'] }),
    }
    expect(callbacks.onUploadImages).toBeDefined()
  })
})

describe('SendMessageParams', () => {
  it('should accept required fields only', () => {
    const params: SendMessageParams = {
      topicId: 't1',
      content: 'hello',
    }
    expect(params.topicId).toBe('t1')
    expect(params.content).toBe('hello')
  })

  it('should accept optional fields', () => {
    const params: SendMessageParams = {
      topicId: 't1',
      content: 'hello',
      attachments: [{ name: 'a.jpg', url: 'http://x', type: 'image' }],
      thinking: { enabled: true },
      signal: AbortSignal.timeout(5000),
      messageId: 'msg_edit_1',
    }
    expect(params.attachments).toHaveLength(1)
    expect(params.messageId).toBe('msg_edit_1')
  })
})

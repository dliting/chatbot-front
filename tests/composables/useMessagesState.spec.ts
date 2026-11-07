import { describe, it, expect } from 'vitest'
import { useMessagesState } from '@/composables/useMessagesState'
import type { Message } from '@/types'

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    messageId: 'm1',
    topicId: 'topic_1',
    role: 'user',
    type: 'text',
    content: 'hello',
    timestamp: Date.now(),
    status: 'sent',
    ...overrides,
  }
}

describe('useMessagesState', () => {
  it('adds a message to an existing topic', () => {
    const { messages, addMessage } = useMessagesState()
    messages.byTopic['topic_1'] = []

    addMessage(createMessage())

    expect(messages.byTopic['topic_1']).toHaveLength(1)
  })

  it('creates the topic array lazily on first add', () => {
    const { messages, addMessage } = useMessagesState()

    addMessage(createMessage({ topicId: 'topic_new' }))

    expect(messages.byTopic['topic_new']).toHaveLength(1)
  })

  it('updateMessage replaces in place and ignores unknown ids/topics', () => {
    const { messages, addMessage, updateMessage } = useMessagesState()
    messages.byTopic['topic_1'] = []
    addMessage(createMessage())

    updateMessage('m1', 'topic_1', { content: 'edited' })
    expect(messages.byTopic['topic_1'][0].content).toBe('edited')

    // unknown message id → no-op
    updateMessage('ghost', 'topic_1', { content: 'x' })
    expect(messages.byTopic['topic_1'][0].content).toBe('edited')

    // unknown topic → no-op
    updateMessage('m1', 'topic_missing', { content: 'x' })
    expect(messages.byTopic['topic_1'][0].content).toBe('edited')
  })

  it('clearCurrentMessages empties the topic but keeps the key', () => {
    const { messages, addMessage, clearCurrentMessages } = useMessagesState()
    messages.byTopic['topic_1'] = []
    addMessage(createMessage())

    clearCurrentMessages('topic_1')

    expect(messages.byTopic['topic_1']).toEqual([])
    expect('topic_1' in messages.byTopic).toBe(true)
  })

  it('deleteMessagesForTopic removes the key entirely', () => {
    const { messages, addMessage, deleteMessagesForTopic } = useMessagesState()
    messages.byTopic['topic_1'] = []
    addMessage(createMessage())

    deleteMessagesForTopic('topic_1')

    expect('topic_1' in messages.byTopic).toBe(false)
  })

  it('setStreamingMessage and isStreaming reflect streaming state', () => {
    const { messages, setStreamingMessage, isStreaming } = useMessagesState()

    expect(isStreaming()).toBe(false)
    setStreamingMessage('m-stream')
    expect(messages.streamingMessageId).toBe('m-stream')
    expect(isStreaming()).toBe(true)
    setStreamingMessage(null)
    expect(isStreaming()).toBe(false)
  })
})

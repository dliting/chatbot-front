/**
 * Unit tests for useChatActions composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useChatActions } from '@/composables/useChatActions'
import type { Message, StreamEvent } from '@/types'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'

function createMockDeps(overrides: Record<string, unknown> = {}) {
  const state = {
    messages: { byTopic: {} as Record<string, Message[]>, currentTopicId: 'topic_1' },
    topics: { currentId: 'topic_1' },
  }
  state.messages.byTopic['topic_1'] = []

  const emitted: Array<{ event: string; args: unknown[] }> = []
  const emit = (event: string, ...args: unknown[]) => {
    emitted.push({ event, args })
  }

  const deps = {
    config: computed(() => ({ ...defaultChatbotConfig, ...overrides }) as Required<ChatbotConfig>),
    state,
    apiClient: ref(undefined),
    emit,
    ensureMessages: (topicId: string) => {
      if (!state.messages.byTopic[topicId]) {
        state.messages.byTopic[topicId] = []
      }
      return state.messages.byTopic[topicId]
    },
    removeMessage: (topicId: string, messageId: string) => {
      const msgs = state.messages.byTopic[topicId]
      if (!msgs) return
      const index = msgs.findIndex(m => m.messageId === messageId)
      if (index > -1) msgs.splice(index, 1)
    },
    insertMessage: (topicId: string, index: number, message: Message) => {
      const msgs = state.messages.byTopic[topicId]
      if (!msgs) return
      msgs.splice(index, 0, message)
    },
    updateMessage: (messageId: string, updates: Partial<Message>) => {
      for (const [topicId, msgs] of Object.entries(state.messages.byTopic)) {
        const index = msgs.findIndex(m => m.messageId === messageId)
        if (index > -1) {
          msgs.splice(index, 1, { ...msgs[index], ...updates })
          break
        }
      }
    },
    setCurrentTopicId: (topicId: string) => {
      state.messages.currentTopicId = topicId
    },
  }

  return { deps, emitted, state }
}

/** Create an async generator that yields given events */
async function* createMockStream(events: StreamEvent[]): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    yield event
  }
}

describe('composables/useChatActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { deps } = createMockDeps()
    const actions = useChatActions(deps)

    expect(actions.isGenerating.value).toBe(false)
    expect(actions.isThinkingActive.value).toBe(false)
  })

  it('should expose required action methods', () => {
    const { deps } = createMockDeps()
    const actions = useChatActions(deps)

    expect(typeof actions.sendMessage).toBe('function')
    expect(typeof actions.refreshMessage).toBe('function')
    expect(typeof actions.deleteMessage).toBe('function')
    expect(typeof actions.editMessage).toBe('function')
    expect(typeof actions.stopGenerating).toBe('function')
  })

  describe('sendMessage', () => {
    it('should not send when already generating', async () => {
      const { deps } = createMockDeps()
      const actions = useChatActions(deps)
      actions.isGenerating.value = true

      await actions.sendMessage({ content: 'test' })

      expect(deps.state.messages.byTopic['topic_1'].length).toBe(0)
    })

    it('should not send without active topic', async () => {
      const { deps } = createMockDeps()
      deps.state.topics.currentId = ''
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      expect(actions.isGenerating.value).toBe(false)
    })

    it('should add user and assistant messages then process stream', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => createMockStream([
            { type: 'token', content: 'Hello' },
            { type: 'end' },
          ]),
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'Hi' })

      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs.length).toBe(2)
      expect(msgs[0].role).toBe('user')
      expect(msgs[0].content).toBe('Hi')
      expect(msgs[1].role).toBe('assistant')
      expect(msgs[1].content).toBe('Hello')
      expect(msgs[1].status).toBe('sent')

      expect(actions.isGenerating.value).toBe(false)

      // Check emitted events
      expect(emitted.some(e => e.event === 'message:sent')).toBe(true)
      expect(emitted.some(e => e.event === 'message:stream-start')).toBe(true)
      expect(emitted.some(e => e.event === 'message:stream-end')).toBe(true)
    })

    it('should handle reasoning (thinking) chunks', async () => {
      const { deps } = createMockDeps({
        thinkingDefaultEnabled: true,
        callbacks: {
          onSendMessage: () => createMockStream([
            { type: 'reasoning', reasoningContent: 'Let me think...' },
            { type: 'token', content: 'Answer' },
            { type: 'end' },
          ]),
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.thinkingContent).toBe('Let me think...')
      expect(assistant.content).toBe('Answer')
      expect(assistant.thinkingTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle stream errors with user-friendly messages', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw Object.assign(new Error('Failed to fetch'), { name: 'TypeError' })
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('error')
      expect(emitted.some(e => e.event === 'message:error')).toBe(true)
      expect(actions.isGenerating.value).toBe(false)
    })

    it('should handle timeout errors', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            const err = new Error('Timeout') as Error & { code: string }
            err.name = 'TimeoutError'
            err.code = 'TIMEOUT'
            throw err
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toBeDefined()
    })
  })

  describe('refreshMessage', () => {
    it('should regenerate with callback', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onRegenerateMessage: () => createMockStream([
            { type: 'token', content: 'New answer' },
            { type: 'end' },
          ]),
        },
      })
      // Pre-populate messages
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'Old', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][1])

      const msgs = deps.state.messages.byTopic['topic_1']
      // Old assistant removed, new one added
      expect(msgs.length).toBe(2)
      expect(msgs[1].content).toBe('New answer')
    })

    it('should fall back to sendMessage when no regenerate callback', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => createMockStream([
            { type: 'token', content: 'Fresh' },
            { type: 'end' },
          ]),
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'Old', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][1])

      // Falls through to sendMessage which adds user+assistant
      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs.some(m => m.content === 'Fresh')).toBe(true)
    })
  })

  describe('deleteMessage', () => {
    it('should remove message after successful backend call', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onDeleteMessage: vi.fn().mockResolvedValue(undefined),
        },
      })
      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'test', timestamp: Date.now(), status: 'sent',
      }
      deps.state.messages.byTopic['topic_1'] = [msg]

      const actions = useChatActions(deps)
      await actions.deleteMessage(msg)

      expect(deps.state.messages.byTopic['topic_1'].length).toBe(0)
      expect(emitted.some(e => e.event === 'message:deleted')).toBe(true)
    })

    it('should not remove message on backend error', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onDeleteMessage: vi.fn().mockRejectedValue(new Error('Server error')),
        },
      })
      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'test', timestamp: Date.now(), status: 'sent',
      }
      deps.state.messages.byTopic['topic_1'] = [msg]

      const actions = useChatActions(deps)
      await actions.deleteMessage(msg)

      expect(deps.state.messages.byTopic['topic_1'].length).toBe(1)
    })
  })

  describe('editMessage', () => {
    it('should emit message:edited event', () => {
      const { deps, emitted } = createMockDeps()
      const actions = useChatActions(deps)

      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'user', type: 'text',
        content: 'edit me', timestamp: Date.now(), status: 'sent',
      }
      actions.editMessage(msg)

      expect(emitted[0].event).toBe('message:edited')
      expect(emitted[0].args[0]).toEqual({ messageId: 'msg_1', topicId: 'topic_1' })
    })
  })

  describe('stopGenerating', () => {
    it('should not emit when no active generation', () => {
      const { deps, emitted } = createMockDeps()
      const actions = useChatActions(deps)

      actions.stopGenerating()

      expect(emitted.length).toBe(0)
    })

    it('should reset isGenerating after stream completes', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => createMockStream([{ type: 'end' }]),
        },
      })
      const actions = useChatActions(deps)

      expect(actions.isGenerating.value).toBe(false)
      await actions.sendMessage({ content: 'test' })
      expect(actions.isGenerating.value).toBe(false)
    })
  })
})

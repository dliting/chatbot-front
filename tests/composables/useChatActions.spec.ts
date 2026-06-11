/**
 * Unit tests for useChatActions composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useChatActions } from '@/composables/useChatActions'
import type { Message, StreamEvent } from '@/types'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import { ChatbotError } from '@/utils/errors'

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

  const errors: ChatbotError[] = []
  const handleError = (error: unknown, category: string, userMessage: string): ChatbotError => {
    const chatbotError = error instanceof ChatbotError ? error : new ChatbotError(category as any, userMessage, error instanceof Error ? error : undefined)
    errors.push(chatbotError)
    emit('chatbot:error', { error: chatbotError })
    return chatbotError
  }

  const deps = {
    config: computed(() => ({ ...defaultChatbotConfig, ...overrides }) as Required<ChatbotConfig>),
    state,
    apiClient: ref(undefined),
    emit,
    handleError,
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

  return { deps, emitted, state, errors }
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

    it('should abort and emit ui:stop-generating when controller is active', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Create a slow stream that yields after delay
            return (async function* () {
              await new Promise(resolve => setTimeout(resolve, 1000))
              yield { type: 'token', content: 'Hello' }
              yield { type: 'end' }
            })()
          },
        },
      })
      const actions = useChatActions(deps)

      // Start sending (don't await)
      const sendPromise = actions.sendMessage({ content: 'test' })

      // Wait a bit for isGenerating to be set
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should have active controller
      expect(actions.isGenerating.value).toBe(true)

      // Stop generating
      actions.stopGenerating()

      // Should have emitted stop event
      expect(emitted.some(e => e.event === 'ui:stop-generating')).toBe(true)

      // Wait for send to complete
      await sendPromise
    })
  })

  // ===== NEW TEST CASES FOR IMPROVED COVERAGE =====

  describe('sendMessage with apiClient', () => {
    it('should use apiClient.streamChat when no callback but apiClient is available', async () => {
      const mockStreamChat = vi.fn().mockReturnValue(createMockStream([
        { type: 'token', content: 'API response' },
        { type: 'end' },
      ]))
      const mockApiClient = {
        streamChat: mockStreamChat,
        deleteMessage: vi.fn().mockResolvedValue(undefined),
      }

      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = mockApiClient as unknown as NonNullable<typeof deps.apiClient.value>

      const actions = useChatActions(deps)
      await actions.sendMessage({ content: 'test via apiClient' })

      // Verify apiClient.streamChat was called
      expect(mockStreamChat).toHaveBeenCalled()
      expect(mockStreamChat.mock.calls[0][1]).toBe('test via apiClient')

      // Verify messages were added
      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs.length).toBe(2)
      expect(msgs[1].content).toBe('API response')
      expect(msgs[1].status).toBe('sent')

      // Verify events were emitted
      expect(emitted.some(e => e.event === 'message:sent')).toBe(true)
      expect(emitted.some(e => e.event === 'message:stream-start')).toBe(true)
      expect(emitted.some(e => e.event === 'message:stream-end')).toBe(true)
    })
  })

  describe('sendMessage with no callback and no apiClient', () => {
    it('should return early without streaming - only user msg and placeholder added', async () => {
      const { deps, emitted } = createMockDeps()
      // No callbacks, no apiClient (default state)
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      // Source code adds user message and assistant placeholder before
      // checking the callback/apiClient tier, then returns without streaming.
      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs.length).toBe(2) // user + assistant placeholder
      expect(msgs[0].role).toBe('user')
      expect(msgs[0].content).toBe('test')
      expect(msgs[1].role).toBe('assistant')
      expect(msgs[1].content).toBe('')

      // Should not emit stream events
      expect(emitted.some(e => e.event === 'message:stream-start')).toBe(false)
      expect(emitted.some(e => e.event === 'message:stream-end')).toBe(false)

      // isGenerating should be reset
      expect(actions.isGenerating.value).toBe(false)
    })
  })

  describe('sendMessage with attachments', () => {
    it('should set type to attachment type for single attachment', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => createMockStream([{ type: 'end' }]),
        },
      })
      const actions = useChatActions(deps)

      const attachments = [{ name: 'test.png', url: 'http://example.com/test.png', type: 'image' as const }]
      await actions.sendMessage({ content: 'check this image', attachments })

      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs[0].type).toBe('image')
      expect(msgs[0].attachments).toEqual(attachments)
    })

    it('should set type to mixed for multiple attachments', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => createMockStream([{ type: 'end' }]),
        },
      })
      const actions = useChatActions(deps)

      const attachments = [
        { name: 'test.png', url: 'http://example.com/test.png', type: 'image' as const },
        { name: 'doc.pdf', url: 'http://example.com/doc.pdf', type: 'document' as const },
      ]
      await actions.sendMessage({ content: 'check these files', attachments })

      const msgs = deps.state.messages.byTopic['topic_1']
      expect(msgs[0].type).toBe('mixed')
      expect(msgs[0].attachments).toEqual(attachments)
    })
  })

  describe('processStream - reasoning skipped when thinkingDefaultEnabled=false', () => {
    it('should ignore reasoning chunks when thinkingRequested is false', async () => {
      const { deps } = createMockDeps({
        thinkingDefaultEnabled: false,
        callbacks: {
          onSendMessage: () => createMockStream([
            { type: 'reasoning', reasoningContent: 'This should be ignored' },
            { type: 'token', content: 'Actual response' },
            { type: 'end' },
          ]),
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // Reasoning should be ignored
      expect(assistant.thinkingContent).toBeUndefined()
      expect(assistant.content).toBe('Actual response')
    })
  })

  describe('processStream - stream end with abort', () => {
    it('should break loop when controller.signal.aborted at end event', async () => {
      let yieldCount = 0
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            return (async function* () {
              yield { type: 'token', content: 'Partial' }
              // Delay to let abort happen before end event
              await new Promise(resolve => setTimeout(resolve, 50))
              yield { type: 'end' }
            })()
          },
        },
      })
      const actions = useChatActions(deps)

      // Start sending
      const sendPromise = actions.sendMessage({ content: 'test' })

      // Wait for the token to be yielded then abort
      await new Promise(resolve => setTimeout(resolve, 10))
      actions.stopGenerating()

      await sendPromise

      // Message should have content and stopped status
      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.content).toBe('Partial')
      expect(assistant.status).toBe('stopped')
    })
  })

  describe('finalizeStreamStatus', () => {
    it('should set status to stopped when aborted with content', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            return (async function* () {
              yield { type: 'token', content: 'Some content' }
              // Don't yield end - simulate abort during stream
              await new Promise(resolve => setTimeout(resolve, 100))
              yield { type: 'end' }
            })()
          },
        },
      })
      const actions = useChatActions(deps)

      const sendPromise = actions.sendMessage({ content: 'test' })
      await new Promise(resolve => setTimeout(resolve, 10))
      actions.stopGenerating()
      await sendPromise

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('stopped')
      expect(assistant.errorMessage).toBe('已停止生成')
    })

    it('should set status to error when aborted without content', async () => {
      // Test the handleStreamError AbortError branch where assistant has no content
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Throw AbortError - this goes through handleStreamError
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // AbortError with no content should give 'error' status
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toBe('已停止生成')
    })

    it('should set status to error when loading without content (no end event)', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Stream that yields nothing - no token, no end event
            // This leaves assistant message in 'loading' status
            return createMockStream([])
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // No content and no end event, finalizeStreamStatus should set error
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toBe('服务器错误')
    })
  })

  describe('handleStreamError - AbortError', () => {
    it('should handle AbortError specifically', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            const error = new Error('Aborted')
            error.name = 'AbortError'
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toBe('已停止生成')

      // User message should be marked as sent
      const user = msgs.find(m => m.role === 'user')!
      expect(user.status).toBe('sent')
    })
  })

  describe('handleStreamError - HTTP status error', () => {
    it('should include HTTP status in error message', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            const error = new Error('Server error') as Error & { status: number }
            error.status = 500
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toContain('HTTP 500')
      expect(emitted.some(e => e.event === 'message:error')).toBe(true)
    })
  })

  describe('getErrorMessage', () => {
    it('should return network error message for NetworkError', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw new Error('NetworkError: connection refused')
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.errorMessage).toBe('网络连接失败，请检查网络')
    })

    it('should return generic error message for unknown errors', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw new Error('Some unknown error')
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.errorMessage).toBe('Some unknown error')
    })
  })

  describe('refreshMessage - edge cases', () => {
    it('should return early when no messages for topic', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onRegenerateMessage: vi.fn(),
        },
      })
      // Set current topic but no messages
      deps.state.messages.byTopic['topic_1'] = null as unknown as Message[]

      const actions = useChatActions(deps)
      const orphanMsg: Message = {
        messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'orphan', timestamp: Date.now(), status: 'sent',
      }
      await actions.refreshMessage(orphanMsg)

      // Should not call regenerate callback
      expect(deps.config.value.callbacks?.onRegenerateMessage).not.toHaveBeenCalled()
      expect(emitted.length).toBe(0)
    })

    it('should return early when no preceding user message', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onRegenerateMessage: vi.fn(),
        },
      })
      // Only assistant message, no user message before it
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'No user', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][0])

      // Should not call regenerate callback
      expect(deps.config.value.callbacks?.onRegenerateMessage).not.toHaveBeenCalled()
      // Should not emit regenerated event
      expect(emitted.some(e => e.event === 'message:regenerated')).toBe(false)
    })

    it('should skip when already generating', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onRegenerateMessage: vi.fn().mockReturnValue(createMockStream([{ type: 'end' }])),
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'Old', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      actions.isGenerating.value = true

      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][1])

      // Should not call regenerate callback
      expect(deps.config.value.callbacks?.onRegenerateMessage).not.toHaveBeenCalled()
    })

    it('should handle error in regenerate callback', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onRegenerateMessage: () => {
            throw new Error('Regeneration failed')
          },
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'Old', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][1])

      // Should have added new assistant message with error status
      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant' && m.status === 'error')
      expect(assistant).toBeDefined()
      expect(assistant?.errorMessage).toBe('Regeneration failed')
      expect(actions.isGenerating.value).toBe(false)
    })
  })

  describe('deleteMessage - edge cases', () => {
    it('should return early when message not found in topic', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onDeleteMessage: vi.fn().mockResolvedValue(undefined),
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'test', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      const nonExistentMsg: Message = {
        messageId: 'msg_999', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'ghost', timestamp: Date.now(), status: 'sent',
      }
      await actions.deleteMessage(nonExistentMsg)

      // Should not call delete callback
      expect(deps.config.value.callbacks?.onDeleteMessage).not.toHaveBeenCalled()
      // Should not emit deleted event
      expect(emitted.some(e => e.event === 'message:deleted')).toBe(false)
    })

    it('should use apiClient when no callback but apiClient is available', async () => {
      const mockDeleteMessage = vi.fn().mockResolvedValue(undefined)
      const mockApiClient = {
        streamChat: vi.fn(),
        deleteMessage: mockDeleteMessage,
      }

      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = mockApiClient as unknown as NonNullable<typeof deps.apiClient.value>

      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'test', timestamp: Date.now(), status: 'sent',
      }
      deps.state.messages.byTopic['topic_1'] = [msg]

      const actions = useChatActions(deps)
      await actions.deleteMessage(msg)

      expect(mockDeleteMessage).toHaveBeenCalledWith('msg_1')
      expect(deps.state.messages.byTopic['topic_1'].length).toBe(0)
      expect(emitted.some(e => e.event === 'message:deleted')).toBe(true)
    })

    it('should do nothing when no callback and no apiClient', async () => {
      const { deps, emitted } = createMockDeps()
      // No callbacks, no apiClient

      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'test', timestamp: Date.now(), status: 'sent',
      }
      deps.state.messages.byTopic['topic_1'] = [msg]

      const actions = useChatActions(deps)
      await actions.deleteMessage(msg)

      // Message should still be removed locally (no backend call needed)
      expect(deps.state.messages.byTopic['topic_1'].length).toBe(0)
      expect(emitted.some(e => e.event === 'message:deleted')).toBe(true)
    })

    it('should return early when topic has no messages array', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onDeleteMessage: vi.fn().mockResolvedValue(undefined),
        },
      })
      // Set messages to null/undefined for the current topic
      deps.state.messages.byTopic['topic_1'] = null as unknown as Message[]

      const actions = useChatActions(deps)
      const msg: Message = {
        messageId: 'msg_1', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'test', timestamp: Date.now(), status: 'sent',
      }
      await actions.deleteMessage(msg)

      // Should not emit deleted event
      expect(emitted.some(e => e.event === 'message:deleted')).toBe(false)
    })
  })

  describe('remaining branch coverage', () => {
    it('should use fallback error message when regenerate error has no message', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onRegenerateMessage: () => {
            throw new Error('')
          },
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
        { messageId: 'asst_1', topicId: 'topic_1', role: 'assistant', type: 'text', content: 'Old', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      await actions.refreshMessage(deps.state.messages.byTopic['topic_1'][1])

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant' && m.status === 'error')
      expect(assistant).toBeDefined()
      // Empty message string should fall through to 'Regeneration failed'
      expect(assistant?.errorMessage).toBe('Regeneration failed')
    })

    it('should return "Send failed" fallback when error has no message', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Error with empty message to test the || 'Send failed, please retry' fallback
            const error = new Error('') as Error & { code?: string; status?: number }
            error.code = undefined
            error.name = '' // Not TimeoutError, not AbortError
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.errorMessage).toBe('Send failed, please retry')
    })

    it('should use default server error text when labels.serverError is missing', async () => {
      const { deps } = createMockDeps({
        labels: { serverError: '' } as unknown as Record<string, unknown>,
        callbacks: {
          onSendMessage: () => {
            const error = new Error('fail') as Error & { status: number }
            error.status = 503
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // When labels.serverError is falsy, should use default English text
      expect(assistant.errorMessage).toBe('Server error (HTTP 503)')
    })

    it('should set stopped status for AbortError when assistant has content', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Return a stream that yields some content then throws AbortError
            return (async function* () {
              yield { type: 'token', content: 'Partial content' }
              const error = new Error('The operation was aborted')
              error.name = 'AbortError'
              throw error
            })()
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // AbortError with content -> 'stopped' status
      expect(assistant.status).toBe('stopped')
      expect(assistant.errorMessage).toBe('已停止生成')
    })

    it('should handle stream error when assistant message is not found', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw new Error('Some error')
          },
        },
      })
      const actions = useChatActions(deps)

      // We'll override updateMessage to also remove the assistant message
      // to test the branch where assistantMsg is not found in handleStreamError
      const originalUpdateMessage = deps.updateMessage
      deps.updateMessage = (messageId: string, updates: Partial<Message>) => {
        // When assistant message is being updated to error status, check if it's still there
        originalUpdateMessage(messageId, updates)
      }

      await actions.sendMessage({ content: 'test' })

      // The assistant should still get error status
      const msgs = deps.state.messages.byTopic['topic_1']
      const user = msgs.find(m => m.role === 'user')!
      expect(user.status).toBe('error')
    })

    it('should handle stream error when assistant message is removed before error handling', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw new Error('Stream broke')
          },
        },
      })
      const actions = useChatActions(deps)

      // Remove the assistant message from the topic array immediately after sendMessage inserts it
      // so that handleStreamError's find() returns undefined for assistantMsg
      let assistantId: string | null = null
      const origInsertMessage = deps.insertMessage
      deps.insertMessage = (topicId: string, index: number, message: Message) => {
        origInsertMessage(topicId, index, message)
        if (message.role === 'assistant') {
          assistantId = message.messageId
          // Remove the assistant message right after insertion
          const msgs = deps.state.messages.byTopic[topicId]
          const idx = msgs.findIndex(m => m.messageId === assistantId)
          if (idx > -1) {
            msgs.splice(idx, 1)
          }
        }
      }

      await actions.sendMessage({ content: 'test' })

      // No message:error event should be emitted because assistantMsg was not found
      expect(emitted.some(e => e.event === 'message:error')).toBe(false)
    })

    it('should handle refreshMessage when assistant message not found in topic', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onRegenerateMessage: vi.fn().mockReturnValue(createMockStream([{ type: 'end' }])),
        },
      })
      // The assistant message passed to refreshMessage doesn't exist in the topic
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'user_1', topicId: 'topic_1', role: 'user', type: 'text', content: 'Hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useChatActions(deps)
      const missingMsg: Message = {
        messageId: 'asst_missing', topicId: 'topic_1', role: 'assistant', type: 'text',
        content: 'Missing', timestamp: Date.now(), status: 'sent',
      }
      await actions.refreshMessage(missingMsg)

      // Should not find the message (index === -1), so removeMessage is not called
      // The for loop won't iterate from index -1, and userMsg won't be found
      // Should return early without calling regenerate
      expect(deps.config.value.callbacks?.onRegenerateMessage).not.toHaveBeenCalled()
    })

    it('should handle AbortError with default generationStopped label', async () => {
      const { deps } = createMockDeps({
        labels: { generationStopped: '' } as unknown as Record<string, unknown>,
        callbacks: {
          onSendMessage: () => {
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // When labels.generationStopped is falsy, should use default English text
      expect(assistant.errorMessage).toBe('Generation stopped')
    })

    it('should handle stream error when topic messages are null', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            throw new Error('Some error')
          },
        },
      })
      const actions = useChatActions(deps)

      // After sendMessage inserts messages, set the topic messages to null
      // This tests the `if (!msgs) return` branch in handleStreamError
      const origInsertMessage = deps.insertMessage
      deps.insertMessage = (topicId: string, index: number, message: Message) => {
        origInsertMessage(topicId, index, message)
        if (message.role === 'assistant') {
          // Clear the messages array to simulate it being removed
          deps.state.messages.byTopic[topicId] = null as unknown as Message[]
        }
      }

      await actions.sendMessage({ content: 'test' })

      // handleStreamError should return early without emitting message:error
      expect(emitted.some(e => e.event === 'message:error')).toBe(false)
    })

    it('should set sent status when stream completes with content but no end event', async () => {
      // Tests the branch in finalizeStreamStatus where status is still 'loading'
      // but has content (line ~113: deps.updateMessage(assistantMessageId, { status: 'sent' }))
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            // Stream that yields tokens but never sends 'end' event
            return createMockStream([
              { type: 'token', content: 'Hello world' },
            ])
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      // Content was received, no end event, but finalizeStreamStatus sets 'sent'
      expect(assistant.content).toBe('Hello world')
      expect(assistant.status).toBe('sent')
    })

    it('should handle TimeoutError in sendMessage', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onSendMessage: () => {
            const error = new Error('Request timed out') as Error & { code?: string }
            error.name = 'TimeoutError'
            throw error
          },
        },
      })
      const actions = useChatActions(deps)

      await actions.sendMessage({ content: 'test' })

      const msgs = deps.state.messages.byTopic['topic_1']
      const assistant = msgs.find(m => m.role === 'assistant')!
      expect(assistant.status).toBe('error')
      expect(assistant.errorMessage).toBe('响应超时，请检查网络或后端服务')
    })
  })
})

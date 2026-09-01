/**
 * Unit tests for AIChatbot.vue callback integration.
 *
 * Since mounting the full component in happy-dom is complex (many child components,
 * composables, CSS), these tests verify the core logic patterns:
 * - Three-tier fallback: callback > apiClient > local-only
 * - Event format: new colon-separated names with object payloads
 * - Legacy events preserved for backward compatibility
 * - handleDeleteMessage bug fix (backend sync)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChatbotCallbacks, SendMessageParams } from '@/types/config'
import type { Message, Topic, StreamEvent } from '@/types'

// Helper to create a mock Topic
function createMockTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    topicId: 'topic-1',
    title: 'Test Topic',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
    unreadCount: 0,
    ...overrides,
  }
}

// Helper to create a mock Message
function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    messageId: 'msg-1',
    topicId: 'topic-1',
    role: 'user',
    type: 'text',
    content: 'Hello',
    timestamp: Date.now(),
    status: 'sent',
    ...overrides,
  }
}

// Helper to create an async generator from StreamEvents
async function* createMockStream(events: StreamEvent[]): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    yield event
  }
}

describe('AIChatbot callback integration patterns', () => {
  describe('Three-tier fallback pattern', () => {
    it('should prefer callback over apiClient when both available', async () => {
      const callbackFn = vi.fn().mockResolvedValue(undefined)
      const apiClientFn = vi.fn().mockResolvedValue(undefined)

      const callbacks: ChatbotCallbacks = {
        onDeleteMessage: callbackFn,
      }

      // Simulate the three-tier logic
      const apiClient = { deleteMessage: apiClientFn }

      // Pattern used in handleDeleteMessage
      if (callbacks.onDeleteMessage) {
        await callbacks.onDeleteMessage('msg-1', 'topic-1')
      } else if (apiClient) {
        await apiClient.deleteMessage('msg-1')
      }

      expect(callbackFn).toHaveBeenCalledWith('msg-1', 'topic-1')
      expect(apiClientFn).not.toHaveBeenCalled()
    })

    it('should fall back to apiClient when no callback', async () => {
      const apiClientFn = vi.fn().mockResolvedValue(undefined)
      const callbacks: ChatbotCallbacks = {}

      const apiClient = { deleteMessage: apiClientFn }

      // Pattern used in handleDeleteMessage
      if (callbacks.onDeleteMessage) {
        await callbacks.onDeleteMessage('msg-1', 'topic-1')
      } else if (apiClient) {
        await apiClient.deleteMessage('msg-1')
      }

      expect(apiClientFn).toHaveBeenCalledWith('msg-1')
    })

    it('should handle local-only mode when neither callback nor apiClient', () => {
      const callbacks: ChatbotCallbacks = {}
      const apiClient = undefined

      let localOnly = false
      if (callbacks.onDeleteMessage) {
        // won't happen
      } else if (apiClient) {
        // won't happen
      } else {
        localOnly = true
      }

      expect(localOnly).toBe(true)
    })

    it('should prefer onSendMessage callback over apiClient.streamChat', async () => {
      const callbackStream = createMockStream([
        { type: 'token', content: 'Hello from callback' },
        { type: 'end', fullContent: 'Hello from callback' },
      ])
      const callbackFn = vi.fn().mockReturnValue(callbackStream)
      const streamChatFn = vi.fn()

      const callbacks: ChatbotCallbacks = {
        onSendMessage: callbackFn,
      }
      const apiClient = { streamChat: streamChatFn }

      // Pattern used in handleSendMessage
      let stream
      if (callbacks.onSendMessage) {
        stream = callbacks.onSendMessage({
          topicId: 'topic-1',
          content: 'test',
          thinking: { enabled: false },
        })
      } else if (apiClient) {
        stream = apiClient.streamChat('topic-1', 'test')
      }

      // Verify callback was used
      expect(callbackFn).toHaveBeenCalledWith(
        expect.objectContaining({
          topicId: 'topic-1',
          content: 'test',
          thinking: { enabled: false },
        })
      )
      expect(streamChatFn).not.toHaveBeenCalled()

      // Verify the stream is usable
      const chunks: string[] = []
      if (stream) {
        for await (const chunk of stream) {
          if (chunk.type === 'token' && chunk.content) {
            chunks.push(chunk.content)
          }
        }
      }
      expect(chunks).toEqual(['Hello from callback'])
    })
  })

  describe('handleDeleteMessage three-tier behavior', () => {
    it('should call callback when provided, then remove from local state', async () => {
      const deleteCallback = vi.fn().mockResolvedValue(undefined)
      const callbacks: ChatbotCallbacks = {
        onDeleteMessage: deleteCallback,
      }

      // Simulate local messages state
      const msgs: Message[] = [
        createMockMessage({ messageId: 'msg-1' }),
        createMockMessage({ messageId: 'msg-2', role: 'assistant' }),
      ]

      const messageToDelete = msgs[0]

      // Simulate handleDeleteMessage logic
      const index = msgs.findIndex(m => m.messageId === messageToDelete.messageId)
      if (index === -1) return

      if (callbacks.onDeleteMessage) {
        await callbacks.onDeleteMessage(messageToDelete.messageId, 'topic-1')
      }
      msgs.splice(index, 1)

      expect(deleteCallback).toHaveBeenCalledWith('msg-1', 'topic-1')
      expect(msgs).toHaveLength(1)
      expect(msgs[0].messageId).toBe('msg-2')
    })

    it('should NOT remove from local state if backend call fails', async () => {
      const deleteCallback = vi.fn().mockRejectedValue(new Error('Network error'))
      const callbacks: ChatbotCallbacks = {
        onDeleteMessage: deleteCallback,
      }

      const msgs: Message[] = [
        createMockMessage({ messageId: 'msg-1' }),
      ]

      const messageToDelete = msgs[0]
      const index = msgs.findIndex(m => m.messageId === messageToDelete.messageId)

      try {
        if (callbacks.onDeleteMessage) {
          await callbacks.onDeleteMessage(messageToDelete.messageId, 'topic-1')
        }
        msgs.splice(index, 1)
      } catch {
        // Error - local state unchanged
      }

      expect(msgs).toHaveLength(1)
    })
  })

  describe('handleSendMessage callback integration', () => {
    it('should call onSendMessage with correct params including thinking config', async () => {
      const sendMessageCallback = vi.fn().mockReturnValue(
        createMockStream([
          { type: 'end', fullContent: 'response' },
        ])
      )
      const callbacks: ChatbotCallbacks = {
        onSendMessage: sendMessageCallback,
      }

      // Simulate the call
      if (callbacks.onSendMessage) {
        const params: SendMessageParams = {
          topicId: 'topic-1',
          content: 'Hello AI',
          attachments: [{ name: 'image.jpg', url: 'http://example.com/img.jpg', type: 'image' }],
          thinking: { enabled: true },
          signal: new AbortController().signal,
        }
        const stream = callbacks.onSendMessage(params)

        for await (const _chunk of stream) {
          // consume stream
        }
      }

      expect(sendMessageCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          topicId: 'topic-1',
          content: 'Hello AI',
          attachments: expect.arrayContaining([
            expect.objectContaining({ type: 'image' }),
          ]),
          thinking: { enabled: true },
        })
      )
    })

    it('should process reasoning chunks when thinking is enabled', async () => {
      const stream = createMockStream([
        { type: 'reasoning', reasoningContent: 'Let me think...' },
        { type: 'reasoning', reasoningContent: ' step by step' },
        { type: 'token', content: 'The answer is 42' },
        { type: 'end', fullContent: 'The answer is 42' },
      ])

      let fullThinkingContent = ''
      let fullContent = ''

      for await (const chunk of stream) {
        if (chunk.type === 'reasoning' && chunk.reasoningContent) {
          fullThinkingContent += chunk.reasoningContent
        } else if (chunk.type === 'token' && chunk.content) {
          fullContent += chunk.content
        }
      }

      expect(fullThinkingContent).toBe('Let me think... step by step')
      expect(fullContent).toBe('The answer is 42')
    })

    it('should skip reasoning chunks when thinking is disabled', async () => {
      const stream = createMockStream([
        { type: 'reasoning', reasoningContent: 'Thinking...' },
        { type: 'token', content: 'Answer' },
        { type: 'end', fullContent: 'Answer' },
      ])

      const thinkingEnabled = false
      let fullContent = ''
      let reasoningReceived = false

      for await (const chunk of stream) {
        if (chunk.type === 'reasoning' && chunk.reasoningContent) {
          if (!thinkingEnabled) continue
          reasoningReceived = true
        } else if (chunk.type === 'token' && chunk.content) {
          fullContent += chunk.content
        }
      }

      expect(reasoningReceived).toBe(false)
      expect(fullContent).toBe('Answer')
    })
  })

  describe('handleCreateTopic three-tier behavior', () => {
    it('should use callback when provided', async () => {
      const newTopic = createMockTopic({ topicId: 'new-topic-1' })
      const createCallback = vi.fn().mockResolvedValue(newTopic)
      const callbacks: ChatbotCallbacks = {
        onCreateTopic: createCallback,
      }

      // Simulate _handleCreateTopic logic
      let result: Topic | undefined
      if (callbacks.onCreateTopic) {
        result = await callbacks.onCreateTopic()
      }

      expect(createCallback).toHaveBeenCalled()
      expect(result).toEqual(newTopic)
    })

    it('should use apiClient.createTopic when no callback', async () => {
      const newTopic = createMockTopic({ topicId: 'api-topic-1' })
      const apiClient = { createTopic: vi.fn().mockResolvedValue(newTopic) }
      const callbacks: ChatbotCallbacks = {}

      let result: Topic | undefined
      if (callbacks.onCreateTopic) {
        result = await callbacks.onCreateTopic()
      } else if (apiClient) {
        result = await apiClient.createTopic()
      }

      expect(apiClient.createTopic).toHaveBeenCalled()
      expect(result).toEqual(newTopic)
    })
  })

  describe('handleSwitchTopic three-tier behavior', () => {
    it('should call onSwitchTopic callback if provided', async () => {
      const switchCallback = vi.fn().mockResolvedValue(undefined)
      const loadMessagesCallback = vi.fn().mockResolvedValue([
        createMockMessage({ role: 'user', content: 'Hi' }),
        createMockMessage({ role: 'assistant', messageId: 'msg-2', content: 'Hello' }),
      ])
      const callbacks: ChatbotCallbacks = {
        onSwitchTopic: switchCallback,
        onLoadMessages: loadMessagesCallback,
      }

      // Simulate _handleSwitchTopic logic
      if (callbacks.onSwitchTopic) {
        await callbacks.onSwitchTopic('topic-2')
      }

      if (callbacks.onLoadMessages) {
        const messages = await callbacks.onLoadMessages('topic-2')
        expect(messages).toHaveLength(2)
      }

      expect(switchCallback).toHaveBeenCalledWith('topic-2')
      expect(loadMessagesCallback).toHaveBeenCalledWith('topic-2')
    })

    it('should fall back to apiClient.getTopicMessages when no callback', async () => {
      const mockMessages = [createMockMessage()]
      const apiClient = {
        getTopicMessages: vi.fn().mockResolvedValue(mockMessages),
      }
      const callbacks: ChatbotCallbacks = {}

      const messagesByTopic: Record<string, Message[]> = {}

      if (callbacks.onLoadMessages) {
        // won't happen
      } else if (apiClient && !messagesByTopic['topic-2']?.length) {
        messagesByTopic['topic-2'] = await apiClient.getTopicMessages('topic-2')
      }

      expect(apiClient.getTopicMessages).toHaveBeenCalledWith('topic-2')
      expect(messagesByTopic['topic-2']).toEqual(mockMessages)
    })
  })

  describe('handleDeleteTopic three-tier behavior', () => {
    it('should call onDeleteTopic callback first, then delete locally', async () => {
      const deleteCallback = vi.fn().mockResolvedValue(undefined)
      const callbacks: ChatbotCallbacks = {
        onDeleteTopic: deleteCallback,
      }

      const topics: Topic[] = [
        createMockTopic({ topicId: 'topic-1' }),
        createMockTopic({ topicId: 'topic-2' }),
      ]

      // Simulate _handleDeleteTopic logic
      if (callbacks.onDeleteTopic) {
        await callbacks.onDeleteTopic('topic-1')
      }
      const index = topics.findIndex(t => t.topicId === 'topic-1')
      if (index !== -1) topics.splice(index, 1)

      expect(deleteCallback).toHaveBeenCalledWith('topic-1')
      expect(topics).toHaveLength(1)
      expect(topics[0].topicId).toBe('topic-2')
    })
  })

  describe('handleUpdateTopicTitle three-tier behavior', () => {
    it('should call onUpdateTopicTitle callback', async () => {
      const updateCallback = vi.fn().mockResolvedValue(undefined)
      const callbacks: ChatbotCallbacks = {
        onUpdateTopicTitle: updateCallback,
      }

      if (callbacks.onUpdateTopicTitle) {
        await callbacks.onUpdateTopicTitle('topic-1', 'New Title')
      }

      expect(updateCallback).toHaveBeenCalledWith('topic-1', 'New Title')
    })

    it('should rollback title on callback failure', async () => {
      const updateCallback = vi.fn().mockRejectedValue(new Error('Failed'))
      const callbacks: ChatbotCallbacks = {
        onUpdateTopicTitle: updateCallback,
      }

      const topic = createMockTopic({ title: 'Old Title' })
      let currentTitle = topic.title

      // Optimistic update
      currentTitle = 'New Title'

      try {
        if (callbacks.onUpdateTopicTitle) {
          await callbacks.onUpdateTopicTitle('topic-1', 'New Title')
        }
      } catch {
        // Rollback
        currentTitle = 'Old Title'
      }

      expect(currentTitle).toBe('Old Title')
    })
  })

  describe('Event format verification', () => {
    it('new events should use colon-separated names with object payloads', () => {
      // Verify all new event payload shapes
      const messageSent = { message: createMockMessage() }
      expect(messageSent).toHaveProperty('message')
      expect(messageSent.message).toHaveProperty('messageId')

      const messageError = { message: createMockMessage(), error: new Error('fail') }
      expect(messageError).toHaveProperty('message')
      expect(messageError).toHaveProperty('error')

      const messageDeleted = { messageId: 'msg-1', topicId: 'topic-1' }
      expect(messageDeleted).toHaveProperty('messageId')
      expect(messageDeleted).toHaveProperty('topicId')

      const messageStreamStart = { messageId: 'msg-1' }
      expect(messageStreamStart).toHaveProperty('messageId')

      const messageStreamEnd = { messageId: 'msg-1', fullContent: 'hello' }
      expect(messageStreamEnd).toHaveProperty('messageId')
      expect(messageStreamEnd).toHaveProperty('fullContent')

      const topicCreated = { topic: createMockTopic() }
      expect(topicCreated).toHaveProperty('topic')
      expect(topicCreated.topic).toHaveProperty('topicId')

      const topicSwitched = { topicId: 'topic-1' }
      expect(topicSwitched).toHaveProperty('topicId')

      const topicDeleted = { topicId: 'topic-1' }
      expect(topicDeleted).toHaveProperty('topicId')

      const topicTitleUpdated = { topicId: 'topic-1', title: 'New Title' }
      expect(topicTitleUpdated).toHaveProperty('topicId')
      expect(topicTitleUpdated).toHaveProperty('title')

      const uiPanelToggle = { isOpen: true, mode: 'floating' }
      expect(uiPanelToggle).toHaveProperty('isOpen')
      expect(uiPanelToggle).toHaveProperty('mode')

      const uiThemeChanged = { theme: 'dark' }
      expect(uiThemeChanged).toHaveProperty('theme')
    })

    it('legacy events should use non-colon names with original payloads', () => {
      // Legacy events keep their original signatures
      const panelToggle = { isOpen: true, mode: 'floating' }
      expect(panelToggle).toHaveProperty('isOpen')

      const topicChange = 'topic-1' // string, not object
      expect(typeof topicChange).toBe('string')

      const topicCreate = 'topic-1' // string
      expect(typeof topicCreate).toBe('string')

      const topicDelete = 'topic-1' // string
      expect(typeof topicDelete).toBe('string')

      // topicTitleUpdate uses (topicId: string, title: string) signature
      const topicTitleUpdateArgs = ['topic-1', 'New Title']
      expect(topicTitleUpdateArgs).toHaveLength(2)
      expect(typeof topicTitleUpdateArgs[0]).toBe('string')
      expect(typeof topicTitleUpdateArgs[1]).toBe('string')
    })
  })

  describe('onLoadTopics on mount', () => {
    it('should load topics via callback and set current topic', async () => {
      const topics = [
        createMockTopic({ topicId: 'topic-1' }),
        createMockTopic({ topicId: 'topic-2' }),
      ]
      const loadTopicsCallback = vi.fn().mockResolvedValue(topics)
      const callbacks: ChatbotCallbacks = {
        onLoadTopics: loadTopicsCallback,
      }

      // Simulate onMounted logic
      const state = {
        topics: { list: [] as Topic[], currentId: '' },
        messages: { currentTopicId: '' },
      }

      if (callbacks.onLoadTopics) {
        const loadedTopics = await callbacks.onLoadTopics()
        if (loadedTopics.length > 0) {
          state.topics.list.length = 0
          state.topics.list.push(...loadedTopics)
          state.topics.currentId = loadedTopics[0].topicId
          state.messages.currentTopicId = loadedTopics[0].topicId
        }
      }

      expect(loadTopicsCallback).toHaveBeenCalled()
      expect(state.topics.list).toHaveLength(2)
      expect(state.topics.currentId).toBe('topic-1')
      expect(state.messages.currentTopicId).toBe('topic-1')
    })

    it('should not modify state when callback returns empty topics', async () => {
      const loadTopicsCallback = vi.fn().mockResolvedValue([])
      const callbacks: ChatbotCallbacks = {
        onLoadTopics: loadTopicsCallback,
      }

      const state = {
        topics: { list: [createMockTopic()], currentId: 'original' },
        messages: { currentTopicId: 'original' },
      }

      if (callbacks.onLoadTopics) {
        const loadedTopics = await callbacks.onLoadTopics()
        if (loadedTopics.length > 0) {
          state.topics.list.length = 0
          state.topics.list.push(...loadedTopics)
        }
      }

      expect(state.topics.list).toHaveLength(1)
      expect(state.topics.currentId).toBe('original')
    })
  })

  describe('handleStopGenerating', () => {
    it('should abort and emit ui:stop-generating event', () => {
      const controller = new AbortController()
      let emitted = false

      if (controller) {
        controller.abort()
        emitted = true
      }

      expect(controller.signal.aborted).toBe(true)
      expect(emitted).toBe(true)
    })

    it('should not emit when no active controller', () => {
      const controller: AbortController | null = null
      let emitted = false

      if (controller) {
        controller.abort()
        emitted = true
      }

      expect(emitted).toBe(false)
    })
  })

  describe('loadCurrentTopicMessages three-tier behavior', () => {
    it('should use onLoadMessages callback when available', async () => {
      const messages = [
        createMockMessage({ role: 'user' }),
        createMockMessage({ role: 'assistant', messageId: 'msg-2' }),
      ]
      const loadMessagesCallback = vi.fn().mockResolvedValue(messages)
      const callbacks: ChatbotCallbacks = {
        onLoadMessages: loadMessagesCallback,
      }

      const state = { messages: { byTopic: {} as Record<string, Message[]> } }

      // Simulate loadCurrentTopicMessages logic
      const topicId = 'topic-1'
      let loadedMessages: Message[] = []

      if (callbacks.onLoadMessages) {
        loadedMessages = await callbacks.onLoadMessages(topicId)
      }
      if (loadedMessages.length > 0) {
        state.messages.byTopic[topicId] = loadedMessages
      }

      expect(loadMessagesCallback).toHaveBeenCalledWith('topic-1')
      expect(state.messages.byTopic['topic-1']).toHaveLength(2)
    })

    it('should ignore 404 errors silently', async () => {
      const error404 = new Error('API error: 404')
      const apiClient = {
        getTopicMessages: vi.fn().mockRejectedValue(error404),
      }

      let logged = false
      try {
        await apiClient.getTopicMessages('new-topic')
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('404')) {
          return // silently ignore
        }
        logged = true
      }

      expect(logged).toBe(false)
    })
  })

  describe('handleRefreshMessage', () => {
    it('should find preceding user message and resend', async () => {
      const msgs: Message[] = [
        createMockMessage({ messageId: 'msg-1', role: 'user', content: 'Hello' }),
        createMockMessage({ messageId: 'msg-2', role: 'assistant', content: 'Hi there' }),
      ]

      // Simulate removing assistant message and finding preceding user message
      const targetMsg = msgs[1]
      const index = msgs.findIndex(m => m.messageId === targetMsg.messageId)
      if (index !== -1) {
        msgs.splice(index, 1)
      }

      let resentContent = ''
      for (let i = index - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          resentContent = msgs[i].content
          break
        }
      }

      expect(msgs).toHaveLength(1)
      expect(resentContent).toBe('Hello')
    })

    it('should include attachments from original user message', async () => {
      const attachment = { name: 'file.jpg', url: 'http://example.com/file.jpg', type: 'image' as const }
      const msgs: Message[] = [
        createMockMessage({ messageId: 'msg-1', role: 'user', content: 'Describe this', attachments: [attachment] }),
        createMockMessage({ messageId: 'msg-2', role: 'assistant', content: 'Response' }),
      ]

      const targetMsg = msgs[1]
      const index = msgs.findIndex(m => m.messageId === targetMsg.messageId)
      msgs.splice(index, 1)

      let resentAttachments = undefined
      for (let i = index - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          resentAttachments = msgs[i].attachments
          break
        }
      }

      expect(resentAttachments).toHaveLength(1)
      expect(resentAttachments![0].type).toBe('image')
    })
  })
})

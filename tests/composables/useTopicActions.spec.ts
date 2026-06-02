/**
 * Unit tests for useTopicActions composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useTopicActions } from '@/composables/useTopicActions'
import type { Message, Topic } from '@/types'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'

function createMockTopic(id: string, title: string): Topic {
  return { topicId: id, title, createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0, unreadCount: 0 }
}

function createMockDeps(overrides: Record<string, unknown> = {}) {
  const state = {
    messages: { byTopic: {} as Record<string, Message[]>, currentTopicId: 'topic_1' },
    topics: { list: [createMockTopic('topic_1', 'Topic 1')], currentId: 'topic_1' },
  }
  state.messages.byTopic['topic_1'] = []

  const emitted: Array<{ event: string; args: unknown[] }> = []
  const emit = (event: string, ...args: unknown[]) => {
    emitted.push({ event, args })
  }

  const topicListOps = {
    setTopicList: (topics: Topic[]) => {
      state.topics.list.length = 0
      state.topics.list.push(...topics)
    },
    setCurrentTopicId: (topicId: string) => {
      state.topics.currentId = topicId
      state.messages.currentTopicId = topicId
    },
    addTopicToFront: (topic: Topic) => {
      state.topics.list.unshift(topic)
    },
    setMessages: (topicId: string, messages: Message[]) => {
      state.messages.byTopic[topicId] = messages
    },
  }

  const deps = {
    config: computed(() => ({ ...defaultChatbotConfig, ...overrides }) as Required<ChatbotConfig>),
    state,
    apiClient: ref(undefined),
    emit,
    switchTopic: vi.fn(),
    createTopic: vi.fn(() => {
      const id = 'topic_new'
      state.topics.list.unshift(createMockTopic(id, 'New Topic'))
      state.topics.currentId = id
      return id
    }),
    deleteTopic: vi.fn((topicId: string) => {
      const index = state.topics.list.findIndex(t => t.topicId === topicId)
      if (index > -1) state.topics.list.splice(index, 1)
    }),
    updateTopicTitle: vi.fn(),
    ...topicListOps,
  }

  return { deps, emitted, state }
}

describe('composables/useTopicActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should expose required action methods', () => {
    const { deps } = createMockDeps()
    const actions = useTopicActions(deps)

    expect(typeof actions.createNewTopic).toBe('function')
    expect(typeof actions.switchToTopic).toBe('function')
    expect(typeof actions.removeTopic).toBe('function')
    expect(typeof actions.renameTopic).toBe('function')
    expect(typeof actions.reloadTopics).toBe('function')
    expect(typeof actions.loadCurrentTopicMessages).toBe('function')
    expect(typeof actions.loadInitialTopics).toBe('function')
  })

  describe('createNewTopic', () => {
    it('should not create topic when current topic is empty', async () => {
      const { deps, emitted } = createMockDeps()
      deps.state.messages.byTopic['topic_1'] = [] // empty topic

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(emitted.length).toBe(0)
    })

    it('should create topic via callback', async () => {
      const newTopic = createMockTopic('topic_2', 'New')
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onCreateTopic: vi.fn().mockResolvedValue(newTopic),
        },
      })
      // Current topic has messages
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(emitted.some(e => e.event === 'topic:created')).toBe(true)
      expect(deps.state.topics.list.length).toBe(2)
    })

    it('should create topic via apiClient when no callback', async () => {
      const newTopic = createMockTopic('topic_2', 'New')
      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = { createTopic: vi.fn().mockResolvedValue(newTopic) }
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(emitted.some(e => e.event === 'topic:created')).toBe(true)
    })
  })

  describe('switchToTopic', () => {
    it('should switch topic and call switchTopic', async () => {
      const { deps, emitted } = createMockDeps()
      const actions = useTopicActions(deps)

      await actions.switchToTopic('topic_1')

      expect(deps.switchTopic).toHaveBeenCalledWith('topic_1')
      expect(emitted.some(e => e.event === 'topic:switched')).toBe(true)
    })

    it('should load messages when not already loaded', async () => {
      const messages: Message[] = [
        { messageId: 'm1', topicId: 'topic_2', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue(messages),
        },
      })

      const actions = useTopicActions(deps)
      await actions.switchToTopic('topic_2')

      expect(deps.state.messages.byTopic['topic_2']).toEqual(messages)
    })
  })

  describe('removeTopic', () => {
    it('should delete topic and emit event', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onDeleteTopic: vi.fn().mockResolvedValue(undefined),
          onLoadTopics: vi.fn().mockResolvedValue([]),
        },
      })

      const actions = useTopicActions(deps)
      await actions.removeTopic('topic_1')

      expect(deps.deleteTopic).toHaveBeenCalledWith('topic_1')
      expect(emitted.some(e => e.event === 'topic:deleted')).toBe(true)
    })
  })

  describe('renameTopic', () => {
    it('should update title optimistically', async () => {
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onUpdateTopicTitle: vi.fn().mockResolvedValue(undefined),
        },
      })

      const actions = useTopicActions(deps)
      await actions.renameTopic('topic_1', 'New Title')

      expect(deps.updateTopicTitle).toHaveBeenCalledWith('topic_1', 'New Title')
      expect(emitted.some(e => e.event === 'topic:title-updated')).toBe(true)
    })

    it('should rollback on failure', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onUpdateTopicTitle: vi.fn().mockRejectedValue(new Error('fail')),
        },
      })

      const actions = useTopicActions(deps)
      await actions.renameTopic('topic_1', 'Bad Title')

      // updateTopicTitle called twice: once for optimistic, once for rollback
      expect(deps.updateTopicTitle).toHaveBeenCalledTimes(2)
    })
  })

  describe('loadInitialTopics', () => {
    it('should load topics from callback', async () => {
      const topics = [createMockTopic('t1', 'A'), createMockTopic('t2', 'B')]
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockResolvedValue(topics),
        },
      })

      const actions = useTopicActions(deps)
      await actions.loadInitialTopics()

      expect(deps.state.topics.list.length).toBe(2)
      expect(deps.state.topics.currentId).toBe('t1')
    })

    it('should do nothing when no callback', async () => {
      const { deps } = createMockDeps()
      const originalLength = deps.state.topics.list.length

      const actions = useTopicActions(deps)
      await actions.loadInitialTopics()

      expect(deps.state.topics.list.length).toBe(originalLength)
    })
  })

  describe('loadCurrentTopicMessages', () => {
    it('should load messages for current topic', async () => {
      const messages: Message[] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue(messages),
        },
      })

      const actions = useTopicActions(deps)
      await actions.loadCurrentTopicMessages()

      expect(deps.state.messages.byTopic['topic_1']).toEqual(messages)
    })
  })
})

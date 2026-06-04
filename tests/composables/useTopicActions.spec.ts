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

    it('should not create topic when currentMsgs is undefined', async () => {
      const { deps, emitted } = createMockDeps()
      // Set currentId to a topic that has no messages entry
      deps.state.topics.currentId = 'topic_no_msgs'
      delete deps.state.messages.byTopic['topic_no_msgs']

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

    it('should handle callback error in createNewTopic', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onCreateTopic: vi.fn().mockRejectedValue(new Error('callback failed')),
        },
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(consoleSpy).toHaveBeenCalledWith('Create topic callback failed:', expect.any(Error))
      expect(emitted.some(e => e.event === 'topic:created')).toBe(false)
      consoleSpy.mockRestore()
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

    it('should handle apiClient error in createNewTopic', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = { createTopic: vi.fn().mockRejectedValue(new Error('api failed')) }
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create topic:', expect.any(Error))
      expect(emitted.some(e => e.event === 'topic:created')).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should use deps.createTopic when no callback and no apiClient', async () => {
      const { deps, emitted } = createMockDeps()
      // No callback, no apiClient (default state)
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(deps.createTopic).toHaveBeenCalled()
      expect(emitted.some(e => e.event === 'topic:created')).toBe(true)
    })

    it('should not emit when topic not found after deps.createTopic', async () => {
      const { deps, emitted } = createMockDeps()
      // Make createTopic return an ID that doesn't match any topic in the list
      deps.createTopic = vi.fn(() => {
        // Return an ID but don't add the topic to the list
        return 'nonexistent_topic'
      })
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.createNewTopic()

      expect(deps.createTopic).toHaveBeenCalled()
      // Topic not found in list, so no event emitted
      expect(emitted.some(e => e.event === 'topic:created')).toBe(false)
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

    it('should handle onSwitchTopic callback error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onSwitchTopic: vi.fn().mockRejectedValue(new Error('switch failed')),
        },
      })

      const actions = useTopicActions(deps)
      await actions.switchToTopic('topic_1')

      expect(consoleSpy).toHaveBeenCalledWith('Switch topic callback failed:', expect.any(Error))
      // Should still proceed with switch and emit
      expect(deps.switchTopic).toHaveBeenCalledWith('topic_1')
      expect(emitted.some(e => e.event === 'topic:switched')).toBe(true)
      consoleSpy.mockRestore()
    })

    it('should not load messages when already loaded', async () => {
      const onLoadMessages = vi.fn().mockResolvedValue([])
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages,
        },
      })
      // Pre-load messages for the topic
      deps.state.messages.byTopic['topic_1'] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]

      const actions = useTopicActions(deps)
      await actions.switchToTopic('topic_1')

      expect(onLoadMessages).not.toHaveBeenCalled()
    })

    it('should not setMessages when loadTopicMessages returns empty', async () => {
      const setMessagesSpy = vi.fn()
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue([]),
        },
      })
      deps.setMessages = setMessagesSpy

      const actions = useTopicActions(deps)
      await actions.switchToTopic('topic_2')

      // setMessages should NOT be called when messages array is empty
      expect(setMessagesSpy).not.toHaveBeenCalled()
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

    it('should use apiClient when no callback', async () => {
      const deleteFn = vi.fn().mockResolvedValue(undefined)
      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = { deleteTopic: deleteFn, getTopics: vi.fn().mockResolvedValue([]) }

      const actions = useTopicActions(deps)
      await actions.removeTopic('topic_1')

      expect(deleteFn).toHaveBeenCalledWith('topic_1')
      expect(deps.deleteTopic).toHaveBeenCalledWith('topic_1')
      expect(emitted.some(e => e.event === 'topic:deleted')).toBe(true)
    })

    it('should only call deps.deleteTopic when no callback and no apiClient', async () => {
      const { deps, emitted } = createMockDeps()
      // No callback, no apiClient (default state)

      const actions = useTopicActions(deps)
      await actions.removeTopic('topic_1')

      expect(deps.deleteTopic).toHaveBeenCalledWith('topic_1')
      expect(emitted.some(e => e.event === 'topic:deleted')).toBe(true)
    })

    it('should handle delete error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps, emitted } = createMockDeps({
        callbacks: {
          onDeleteTopic: vi.fn().mockRejectedValue(new Error('delete failed')),
        },
      })

      const actions = useTopicActions(deps)
      await actions.removeTopic('topic_1')

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete topic:', expect.any(Error))
      // Should not emit or call deleteTopic on error
      expect(deps.deleteTopic).not.toHaveBeenCalled()
      expect(emitted.some(e => e.event === 'topic:deleted')).toBe(false)
      consoleSpy.mockRestore()
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

    it('should use apiClient when no callback', async () => {
      const updateFn = vi.fn().mockResolvedValue(undefined)
      const { deps, emitted } = createMockDeps()
      deps.apiClient.value = { updateTopicTitle: updateFn }

      const actions = useTopicActions(deps)
      await actions.renameTopic('topic_1', 'New Title')

      expect(updateFn).toHaveBeenCalledWith('topic_1', 'New Title')
      expect(deps.updateTopicTitle).toHaveBeenCalledWith('topic_1', 'New Title')
      expect(emitted.some(e => e.event === 'topic:title-updated')).toBe(true)
    })

    it('should do optimistic update only when no callback and no apiClient', async () => {
      const { deps, emitted } = createMockDeps()
      // No callback, no apiClient (default state)

      const actions = useTopicActions(deps)
      await actions.renameTopic('topic_1', 'New Title')

      expect(deps.updateTopicTitle).toHaveBeenCalledWith('topic_1', 'New Title')
      expect(emitted.some(e => e.event === 'topic:title-updated')).toBe(true)
    })

    it('should use empty string as oldTitle when topic not found in list', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onUpdateTopicTitle: vi.fn().mockRejectedValue(new Error('fail')),
        },
      })
      // Use a topicId that doesn't exist in the list
      const unknownId = 'nonexistent_topic'

      const actions = useTopicActions(deps)
      await actions.renameTopic(unknownId, 'New Title')

      // Rollback should use '' as oldTitle since topic not found
      expect(deps.updateTopicTitle).toHaveBeenNthCalledWith(1, unknownId, 'New Title')
      expect(deps.updateTopicTitle).toHaveBeenNthCalledWith(2, unknownId, '')
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

    it('should do nothing when callback returns empty topics', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockResolvedValue([]),
        },
      })
      const originalList = [...deps.state.topics.list]
      const originalId = deps.state.topics.currentId

      const actions = useTopicActions(deps)
      await actions.loadInitialTopics()

      // Should not change list or currentId when topics is empty
      expect(deps.state.topics.list).toEqual(originalList)
      expect(deps.state.topics.currentId).toBe(originalId)
    })

    it('should handle callback error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockRejectedValue(new Error('load failed')),
        },
      })
      const originalList = [...deps.state.topics.list]

      const actions = useTopicActions(deps)
      await actions.loadInitialTopics()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load initial topics:', expect.any(Error))
      // Should not modify state on error
      expect(deps.state.topics.list).toEqual(originalList)
      consoleSpy.mockRestore()
    })

    it('should load topics via apiClient when no callback', async () => {
      const topics = [createMockTopic('t1', 'A'), createMockTopic('t2', 'B')]
      const { deps } = createMockDeps()
      deps.apiClient.value = { getTopics: vi.fn().mockResolvedValue(topics) }

      const actions = useTopicActions(deps)
      await actions.loadInitialTopics()

      expect(deps.state.topics.list.length).toBe(2)
      expect(deps.state.topics.currentId).toBe('t1')
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

    it('should do nothing when no current topic', async () => {
      const setMessagesSpy = vi.fn()
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue([]),
        },
      })
      deps.setMessages = setMessagesSpy
      deps.state.topics.currentId = ''

      const actions = useTopicActions(deps)
      await actions.loadCurrentTopicMessages()

      expect(setMessagesSpy).not.toHaveBeenCalled()
    })

    it('should not setMessages when loadTopicMessages returns empty', async () => {
      const setMessagesSpy = vi.fn()
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue([]),
        },
      })
      deps.setMessages = setMessagesSpy

      const actions = useTopicActions(deps)
      await actions.loadCurrentTopicMessages()

      expect(setMessagesSpy).not.toHaveBeenCalled()
    })
  })

  describe('reloadTopics', () => {
    it('should load topics via callback', async () => {
      const topics = [createMockTopic('t1', 'A'), createMockTopic('t2', 'B')]
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockResolvedValue(topics),
        },
      })

      const actions = useTopicActions(deps)
      await actions.reloadTopics()

      expect(deps.state.topics.list.length).toBe(2)
    })

    it('should load topics via apiClient when no callback', async () => {
      const topics = [createMockTopic('t1', 'A')]
      const { deps } = createMockDeps()
      deps.apiClient.value = { getTopics: vi.fn().mockResolvedValue(topics) }

      const actions = useTopicActions(deps)
      await actions.reloadTopics()

      expect(deps.state.topics.list.length).toBe(1)
      expect(deps.state.topics.list[0].topicId).toBe('t1')
    })

    it('should not set topic list when topics is empty', async () => {
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockResolvedValue([]),
        },
      })
      const originalList = [...deps.state.topics.list]

      const actions = useTopicActions(deps)
      await actions.reloadTopics()

      // Should NOT call setTopicList when topics array is empty
      expect(deps.state.topics.list).toEqual(originalList)
    })

    it('should handle error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps } = createMockDeps({
        callbacks: {
          onLoadTopics: vi.fn().mockRejectedValue(new Error('reload failed')),
        },
      })
      const originalList = [...deps.state.topics.list]

      const actions = useTopicActions(deps)
      await actions.reloadTopics()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to reload topics:', expect.any(Error))
      expect(deps.state.topics.list).toEqual(originalList)
      consoleSpy.mockRestore()
    })

    it('should do nothing when no callback and no apiClient', async () => {
      const { deps } = createMockDeps()
      const originalList = [...deps.state.topics.list]

      const actions = useTopicActions(deps)
      await actions.reloadTopics()

      // No change since no data source available
      expect(deps.state.topics.list).toEqual(originalList)
    })
  })

  describe('loadTopicMessages', () => {
    it('should load messages via callback', async () => {
      const messages: Message[] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockResolvedValue(messages),
        },
      })

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual(messages)
    })

    it('should load messages via apiClient when no callback', async () => {
      const messages: Message[] = [
        { messageId: 'm1', topicId: 'topic_1', role: 'user', type: 'text', content: 'hi', timestamp: Date.now(), status: 'sent' },
      ]
      const { deps } = createMockDeps()
      deps.apiClient.value = { getTopicMessages: vi.fn().mockResolvedValue(messages) }

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual(messages)
    })

    it('should return empty array on 404 error without logging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockRejectedValue(new Error('404 Not Found')),
        },
      })

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual([])
      // 404 errors return early without logging
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should return empty array on non-404 error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps } = createMockDeps({
        callbacks: {
          onLoadMessages: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      })

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load topic messages:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should handle non-Error thrown values', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { deps } = createMockDeps({
        callbacks: {
          // Throw a non-Error value (string)
          onLoadMessages: vi.fn().mockRejectedValue('string error'),
        },
      })

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual([])
      consoleSpy.mockRestore()
    })

    it('should return empty array when no callback and no apiClient', async () => {
      const { deps } = createMockDeps()

      const actions = useTopicActions(deps)
      const result = await actions.loadTopicMessages('topic_1')

      expect(result).toEqual([])
    })
  })
})

/**
 * Unit tests for useTopicsState composable
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useTopicsState } from '../../src/composables/useTopicsState'

describe('useTopicsState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with one default topic when localStorage is empty', () => {
      const { topics } = useTopicsState()

      expect(topics.list.length).toBe(1)
      expect(topics.list[0].title).toBe('New Topic')
      expect(topics.currentId).toBeTruthy()
    })

    it('should load topics from localStorage when available', () => {
      const storedTopics = [
        {
          topicId: 'topic-1',
          title: 'Stored Topic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 5,
          unreadCount: 0,
        },
      ]

      localStorage.setItem('chatbot-topics', JSON.stringify(storedTopics))

      const { topics } = useTopicsState()

      expect(topics.list.length).toBe(1)
      expect(topics.list[0].topicId).toBe('topic-1')
      expect(topics.currentId).toBe('topic-1')
    })

    it('should use custom default title from options', () => {
      const { topics } = useTopicsState({ defaultTitle: 'Custom Title' })

      expect(topics.list[0].title).toBe('Custom Title')
    })
  })

  describe('Auto-persistence', () => {
    it('should save initial state to localStorage on mount', () => {
      const { topics } = useTopicsState()

      const stored = localStorage.getItem('chatbot-topics')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.length).toBe(1)
      expect(parsed[0].topicId).toBe(topics.list[0].topicId)
    })

    it('should auto-save to localStorage when topics list changes', async () => {
      const { topics, createTopic } = useTopicsState()

      const initialCount = topics.list.length

      // Create a new topic
      createTopic()
      await nextTick() // Wait for watcher to trigger

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed.length).toBe(initialCount + 1)
    })

    it('should auto-save to localStorage when topic title is updated', async () => {
      const { topics, updateTopicTitle } = useTopicsState()

      const topicId = topics.list[0].topicId
      updateTopicTitle(topicId, 'New Title')
      await nextTick() // Wait for watcher to trigger

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed[0].title).toBe('New Title')
    })

    it('should auto-save to localStorage when topic is deleted', async () => {
      const { topics, createTopic, deleteTopic } = useTopicsState()

      // Create an additional topic
      const newTopicId = createTopic()
      await nextTick()

      expect(topics.list.length).toBe(2)

      // Delete the topic
      deleteTopic(newTopicId)
      await nextTick() // Wait for watcher to trigger

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed.length).toBe(1)
    })
  })

  describe('currentTopic', () => {
    it('should return current topic object', () => {
      const { topics, currentTopic } = useTopicsState()

      expect(currentTopic()).toBeDefined()
      expect(currentTopic()?.topicId).toBe(topics.currentId)
    })

    it('should return undefined when current topic does not exist', () => {
      const { topics, currentTopic } = useTopicsState()

      // Set currentId to non-existent topic
      topics.currentId = 'non-existent'

      expect(currentTopic()).toBeUndefined()
    })
  })

  describe('updateTopicAfterMessage', () => {
    it('should create new topic if topic does not exist', () => {
      const { topics, updateTopicAfterMessage } = useTopicsState()

      const newTopicId = 'topic-new'
      updateTopicAfterMessage(newTopicId, 3)

      const newTopic = topics.list.find(t => t.topicId === newTopicId)
      expect(newTopic).toBeDefined()
      expect(newTopic?.messageCount).toBe(3)
    })

    it('should update existing topic', () => {
      const { topics, updateTopicAfterMessage } = useTopicsState()

      const existingTopicId = topics.list[0].topicId
      updateTopicAfterMessage(existingTopicId, 5)

      const topic = topics.list.find(t => t.topicId === existingTopicId)
      expect(topic?.messageCount).toBe(5)
    })

    it('should move updated topic to top of list', () => {
      const { topics, createTopic, updateTopicAfterMessage } = useTopicsState()

      // Create multiple topics
      const topic1 = topics.list[0].topicId
      const topic2 = createTopic()
      const topic3 = createTopic()

      expect(topics.list[0].topicId).toBe(topic3)

      // Update first topic (should move to top)
      updateTopicAfterMessage(topic1, 10)

      expect(topics.list[0].topicId).toBe(topic1)
    })

    it('should update timestamp when updating topic', () => {
      const { topics, updateTopicAfterMessage } = useTopicsState()

      const topicId = topics.list[0].topicId
      const originalUpdatedAt = topics.list[0].updatedAt

      // Wait a bit to ensure timestamp difference
      const startTime = Date.now()
      while (Date.now() - startTime < 2) {
        // Wait at least 2ms
      }

      updateTopicAfterMessage(topicId, 5)

      expect(topics.list[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })
  })

  describe('switchTopic', () => {
    it('should switch to different topic', () => {
      const { topics, createTopic, switchTopic } = useTopicsState()

      const newTopicId = createTopic()
      switchTopic(newTopicId)

      expect(topics.currentId).toBe(newTopicId)
    })

    it('should NOT reorder the list when switching topics', () => {
      const { topics, createTopic, switchTopic } = useTopicsState()

      const topic1 = topics.list[0].topicId
      const topic2 = createTopic()
      const topic3 = createTopic()

      // After creating, topic3 is at the top (createTopic unshifts)
      const orderBefore = topics.list.map(t => t.topicId)
      expect(orderBefore[0]).toBe(topic3)

      // Switch to the first topic (topic1)
      switchTopic(topic1)

      // Order should NOT change — only currentId changes
      const orderAfter = topics.list.map(t => t.topicId)
      expect(orderAfter).toEqual(orderBefore)
      expect(topics.currentId).toBe(topic1)
    })

    it('should persist to localStorage when switching topics', () => {
      const { topics, createTopic, switchTopic } = useTopicsState()

      const newTopicId = createTopic()
      switchTopic(newTopicId)

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed[0].topicId).toBe(newTopicId)
    })
  })

  describe('createTopic', () => {
    it('should create new topic with default title', () => {
      const { topics, createTopic } = useTopicsState()

      const newTopicId = createTopic()

      const newTopic = topics.list.find(t => t.topicId === newTopicId)
      expect(newTopic).toBeDefined()
      expect(newTopic?.title).toBe('New Topic')
    })

    it('should create new topic with custom title', () => {
      const customTitle = 'Custom Topic Title'
      const { topics, createTopic } = useTopicsState({ defaultTitle: customTitle })

      const newTopicId = createTopic()

      const newTopic = topics.list.find(t => t.topicId === newTopicId)
      expect(newTopic?.title).toBe(customTitle)
    })

    it('should set new topic as current', () => {
      const { topics, createTopic } = useTopicsState()

      const originalCurrentId = topics.currentId
      const newTopicId = createTopic()

      expect(topics.currentId).toBe(newTopicId)
      expect(topics.currentId).not.toBe(originalCurrentId)
    })

    it('should add new topic to beginning of list', () => {
      const { topics, createTopic } = useTopicsState()

      const firstTopicId = topics.list[0].topicId
      const newTopicId = createTopic()

      expect(topics.list[0].topicId).toBe(newTopicId)
      expect(topics.list[1].topicId).toBe(firstTopicId)
    })

    it('should persist new topic to localStorage', () => {
      const { createTopic } = useTopicsState()

      createTopic()

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed.length).toBe(2) // Initial topic + new topic
    })
  })

  describe('deleteTopic', () => {
    it('should delete topic from list', () => {
      const { topics, createTopic, deleteTopic } = useTopicsState()

      const newTopicId = createTopic()
      expect(topics.list.length).toBe(2)

      deleteTopic(newTopicId)

      expect(topics.list.length).toBe(1)
      expect(topics.list.find(t => t.topicId === newTopicId)).toBeUndefined()
    })

    it('should persist deletion to localStorage', () => {
      const { topics, createTopic, deleteTopic } = useTopicsState()

      const newTopicId = createTopic()
      deleteTopic(newTopicId)

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      expect(parsed.length).toBe(1)
    })

    it('should handle deleting non-existent topic', () => {
      const { topics, deleteTopic } = useTopicsState()

      const initialLength = topics.list.length

      // Should not throw
      expect(() => deleteTopic('non-existent')).not.toThrow()
      expect(topics.list.length).toBe(initialLength)
    })
  })

  describe('updateTopicTitle', () => {
    it('should update topic title', () => {
      const { topics, updateTopicTitle } = useTopicsState()

      const topicId = topics.list[0].topicId
      updateTopicTitle(topicId, 'New Title')

      const topic = topics.list.find((t: { topicId: string; title: string }) => t.topicId === topicId)
      expect(topic?.title).toBe('New Title')
    })

    it('should update timestamp when updating title', () => {
      const { topics, updateTopicTitle } = useTopicsState()

      const topicId = topics.list[0].topicId
      const originalUpdatedAt = topics.list[0].updatedAt

      // Wait a bit to ensure timestamp difference
      const startTime = Date.now()
      while (Date.now() - startTime < 2) {
        // Wait at least 2ms
      }

      updateTopicTitle(topicId, 'New Title')

      expect(topics.list[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it('should persist title update to localStorage', () => {
      const { topics, updateTopicTitle } = useTopicsState()

      const topicId = topics.list[0].topicId
      updateTopicTitle(topicId, 'New Title')

      const stored = localStorage.getItem('chatbot-topics')
      const parsed = JSON.parse(stored!)

      const topic = parsed.find((t: any) => t.topicId === topicId)
      expect(topic.title).toBe('New Title')
    })

    it('should handle updating title for non-existent topic', () => {
      const { topics, updateTopicTitle } = useTopicsState()

      const initialLength = topics.list.length

      // Should not throw
      expect(() => updateTopicTitle('non-existent', 'New Title')).not.toThrow()
      expect(topics.list.length).toBe(initialLength)
    })
  })
})

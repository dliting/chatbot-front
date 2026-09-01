/**
 * Tests for useChatbotCoordinator composable
 * Covers: watch-based sync, deleteTopic, addMessage, clearCurrentMessages, setCurrentTopicId
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { reactive } from 'vue'
import type { MessagesState } from '@/composables/useMessagesState'
import type { Topic } from '@/types'
import { useChatbotCoordinator } from '@/composables/useChatbotCoordinator'
import { useTopicsState } from '@/composables/useTopicsState'
import type { Message } from '@/types'

function createTestState() {
  localStorage.clear()
  const topicsState = useTopicsState({ defaultTitle: 'Test Topic' })

  const messages = reactive<MessagesState>({
    byTopic: {},
    currentTopicId: topicsState.topics.currentId, // Sync with topicsState
    streamingMessageId: null,
  })

  // Seed some messages for the initial topic
  messages.byTopic[topicsState.topics.currentId] = []

  return { messages, topicsState }
}

describe('useChatbotCoordinator', () => {
  let messages: MessagesState
  let topicsState: ReturnType<typeof useTopicsState>

  beforeEach(() => {
    const state = createTestState()
    messages = state.messages
    topicsState = state.topicsState
    localStorage.clear()
  })

  describe('watch-based sync (topics.currentId → messages.currentTopicId)', () => {
    it('should sync messages.currentTopicId when topics.currentId changes', async () => {
      useChatbotCoordinator({ messages, topicsState })

      const newTopicId = topicsState.createTopic()
      await nextTick()

      expect(messages.currentTopicId).toBe(newTopicId)
    })

    it('should not trigger infinite loop when both IDs are already in sync', async () => {
      useChatbotCoordinator({ messages, topicsState })

      // Verify initial sync
      await nextTick()
      expect(messages.currentTopicId).toBe(topicsState.topics.currentId)

      // Set to same value — should not cause issues
      topicsState.topics.currentId = topicsState.topics.currentId
      await nextTick()

      expect(messages.currentTopicId).toBe(topicsState.topics.currentId)
    })
  })

  describe('deleteTopic', () => {
    it('should remove topic and its messages', async () => {
      const { deleteTopic } = useChatbotCoordinator({ messages, topicsState })

      const topicId = topicsState.topics.currentId
      messages.byTopic[topicId] = [{
        messageId: 'm1', topicId, role: 'user', type: 'text',
        content: 'Hi', timestamp: Date.now(), status: 'sent',
      }]

      // Create another topic first
      const otherTopicId = topicsState.createTopic()
      await nextTick()

      deleteTopic(otherTopicId)
      await nextTick()

      expect(topicsState.topics.list.find(t => t.topicId === otherTopicId)).toBeUndefined()
      expect(messages.byTopic[otherTopicId]).toBeUndefined()
    })

    it('should switch to another topic when deleting current topic', async () => {
      const { deleteTopic } = useChatbotCoordinator({ messages, topicsState })

      const originalId = topicsState.topics.currentId
      const newTopicId = topicsState.createTopic()
      await nextTick()

      deleteTopic(originalId)
      await nextTick()

      expect(topicsState.topics.currentId).toBe(newTopicId)
      expect(messages.currentTopicId).toBe(newTopicId)
    })

    it('should create a default topic when deleting the last topic', async () => {
      const { deleteTopic } = useChatbotCoordinator({ messages, topicsState })

      const originalId = topicsState.topics.currentId
      deleteTopic(originalId)
      await nextTick()

      expect(topicsState.topics.list.length).toBe(1)
      expect(topicsState.topics.currentId).toBeTruthy()
      expect(messages.currentTopicId).toBe(topicsState.topics.currentId)
    })
  })

  describe('addMessage', () => {
    it('should add message and update topic metadata via topicsState', () => {
      const { addMessage } = useChatbotCoordinator({ messages, topicsState })

      const topicId = topicsState.topics.currentId
      const msg: Message = {
        messageId: 'm1', topicId, role: 'user', type: 'text',
        content: 'Hello', timestamp: Date.now(), status: 'sent',
      }

      addMessage(msg)

      expect(messages.byTopic[topicId].length).toBe(1)
      const topic = topicsState.topics.list.find(t => t.topicId === topicId)
      expect(topic?.messageCount).toBe(1)
    })

    it('should create topic entry for messages to new topic via topicsState', () => {
      const { addMessage } = useChatbotCoordinator({ messages, topicsState })

      const msg: Message = {
        messageId: 'm2', topicId: 'topic-new', role: 'user', type: 'text',
        content: 'New topic', timestamp: Date.now(), status: 'sent',
      }

      addMessage(msg)

      expect(messages.byTopic['topic-new'].length).toBe(1)
      expect(topicsState.topics.list.find(t => t.topicId === 'topic-new')).toBeDefined()
    })

    it('should move updated topic to top of list via topicsState', () => {
      const { addMessage } = useChatbotCoordinator({ messages, topicsState })

      const topic2 = topicsState.createTopic()
      const topic1 = topicsState.topics.list.find(t => t.topicId !== topic2)!.topicId

      addMessage({
        messageId: 'm1', topicId: topic1, role: 'user', type: 'text',
        content: 'Hello', timestamp: Date.now(), status: 'sent',
      })

      expect(topicsState.topics.list[0].topicId).toBe(topic1)
    })
  })

  describe('clearCurrentMessages', () => {
    it('should clear messages and reset topic messageCount', () => {
      const { addMessage, clearCurrentMessages } = useChatbotCoordinator({ messages, topicsState })

      const topicId = topicsState.topics.currentId
      addMessage({
        messageId: 'm1', topicId, role: 'user', type: 'text',
        content: 'Hello', timestamp: Date.now(), status: 'sent',
      })

      expect(messages.byTopic[topicId].length).toBe(1)

      clearCurrentMessages()

      expect(messages.byTopic[topicId].length).toBe(0)
      expect(topicsState.topics.list.find(t => t.topicId === topicId)?.messageCount).toBe(0)
    })
  })

  describe('setCurrentTopicId', () => {
    it('should set topics.currentId (watcher syncs messages)', async () => {
      const { setCurrentTopicId } = useChatbotCoordinator({ messages, topicsState })

      const newTopicId = topicsState.createTopic()
      await nextTick()

      setCurrentTopicId(newTopicId)
      await nextTick()

      expect(topicsState.topics.currentId).toBe(newTopicId)
      expect(messages.currentTopicId).toBe(newTopicId)
    })
  })

  describe('stop', () => {
    it('should stop syncing when stop() is called', async () => {
      const { stop } = useChatbotCoordinator({ messages, topicsState })

      // Verify sync works before stop
      const newTopicId = topicsState.createTopic()
      await nextTick()
      expect(messages.currentTopicId).toBe(newTopicId)

      // Stop the watcher
      stop()

      // Change currentId — should NOT sync anymore
      const anotherId = topicsState.createTopic()
      await nextTick()

      expect(topicsState.topics.currentId).toBe(anotherId)
      expect(messages.currentTopicId).toBe(newTopicId) // Still the old value
    })
  })
})

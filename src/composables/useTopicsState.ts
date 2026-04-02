/**
 * Composable for topics state management
 * Follows Single Responsibility Principle - only handles topic state logic
 */
import { reactive, watch } from 'vue'
import type { Topic } from '@/types'
import { TOPIC_DEFAULTS } from '@/constants'
import { loadTopicsFromStorage, saveTopicsToStorage } from './useStorage'

// Module-level counter for unique ID generation (avoids Date.now() collisions)
let topicIdCounter = 0

function generateTopicId(): string {
  return `topic_${Date.now()}_${++topicIdCounter}`
}

export interface TopicsState {
  list: Topic[]
  currentId: string
}

export interface UseTopicsStateOptions {
  defaultTitle?: string
}

export function useTopicsState(options: UseTopicsStateOptions = {}) {
  const { defaultTitle = TOPIC_DEFAULTS.TITLE } = options

  // Load from localStorage or create new
  const storedTopics = loadTopicsFromStorage()
  const initialTopicId = storedTopics.length > 0
    ? storedTopics[0].topicId
    : generateTopicId()

  const topics = reactive<TopicsState>({
    list: storedTopics.length > 0 ? storedTopics : [{
      topicId: initialTopicId,
      title: defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }],
    currentId: initialTopicId,
  })

  // Save initial state to localStorage
  saveTopicsToStorage(topics.list)

  // Auto-persist topics to localStorage on changes
  watch(
    () => topics.list,
    (list) => {
      saveTopicsToStorage(list)
    },
    { deep: true }
  )

  const currentTopic = (): Topic | undefined => {
    return topics.list.find(t => t.topicId === topics.currentId)
  }

  const updateTopicAfterMessage = (topicId: string, messageCount: number) => {
    const topicIndex = topics.list.findIndex(t => t.topicId === topicId)

    if (topicIndex === -1) {
      // Create new topic
      const newTopic: Topic = {
        topicId,
        title: defaultTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount,
        unreadCount: 0,
      }
      topics.list.unshift(newTopic)
    } else {
      // Update existing topic
      const topic = topics.list[topicIndex]
      topic.messageCount = messageCount
      topic.updatedAt = Date.now()

      // Move to top
      topics.list.splice(topicIndex, 1)
      topics.list.unshift(topic)
    }
  }

  const switchTopic = (topicId: string) => {
    topics.currentId = topicId
    // Only update currentId — do NOT reorder the list.
    // Topics are sorted by updatedAt; only updateTopicAfterMessage should reorder.
  }

  const createTopic = (): string => {
    const newTopic: Topic = {
      topicId: generateTopicId(),
      title: defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }
    topics.list.unshift(newTopic)
    topics.currentId = newTopic.topicId
    saveTopicsToStorage(topics.list)
    return newTopic.topicId
  }

  const deleteTopic = (topicId: string) => {
    // Remove from list
    const index = topics.list.findIndex(t => t.topicId === topicId)
    if (index > -1) {
      topics.list.splice(index, 1)
      saveTopicsToStorage(topics.list)
    }
  }

  const updateTopicTitle = (topicId: string, title: string) => {
    const topic = topics.list.find(t => t.topicId === topicId)
    if (topic) {
      topic.title = title
      topic.updatedAt = Date.now()
      saveTopicsToStorage(topics.list)
    }
  }

  return {
    topics,
    currentTopic,
    updateTopicAfterMessage,
    switchTopic,
    createTopic,
    deleteTopic,
    updateTopicTitle,
  }
}

export type UseTopicsStateReturn = ReturnType<typeof useTopicsState>

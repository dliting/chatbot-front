/**
 * Composable for topics state management
 */
import { reactive } from 'vue'
import type { Topic } from '@/types'

// Storage key for topics
const TOPICS_STORAGE_KEY = 'chatbot-topics'

// Load topics from localStorage
function loadTopicsFromStorage(): Topic[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(TOPICS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // localStorage disabled, quota exceeded, or corrupted data - return empty
  }
  return []
}

// Save topics to localStorage
function saveTopicsToStorage(topics: Topic[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics))
  } catch (e) {
    // localStorage disabled or quota exceeded - silently fail
  }
}

export interface TopicsState {
  list: Topic[]
  currentId: string
}

export function useTopicsState() {
  // Load from localStorage or create new
  const storedTopics = loadTopicsFromStorage()
  const initialTopicId = storedTopics.length > 0
    ? storedTopics[0].topicId
    : `topic_${Date.now()}`

  const topics = reactive<TopicsState>({
    list: storedTopics.length > 0 ? storedTopics : [{
      topicId: initialTopicId,
      title: 'New Topic',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }],
    currentId: initialTopicId,
  })

  const currentTopic = (): Topic | undefined => {
    return topics.list.find(t => t.topicId === topics.currentId)
  }

  const updateTopicAfterMessage = (topicId: string, messageCount: number) => {
    const topicIndex = topics.list.findIndex(t => t.topicId === topicId)

    if (topicIndex === -1) {
      // Create new topic
      const newTopic: Topic = {
        topicId,
        title: 'New Topic',
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
    // Move topic to top of list
    const index = topics.list.findIndex(t => t.topicId === topicId)
    if (index > 0) {
      const topic = topics.list.splice(index, 1)[0]
      topics.list.unshift(topic)
      saveTopicsToStorage(topics.list)
    }
  }

  const createTopic = (): string => {
    const newTopic: Topic = {
      topicId: `topic_${Date.now()}`,
      title: 'New Topic',
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

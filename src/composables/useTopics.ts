/**
 * Composable for topic management
 */
import { ref, computed, watch } from 'vue'
import type { Topic } from '@/types'
import { generateId } from '@/utils/helpers'
import { extractTopicTitle } from '@/utils/message'
import { TOPIC_DEFAULTS } from '@/constants'

export interface UseTopicsOptions {
  maxTopics?: number
  storageKey?: string
  persistToStorage?: boolean
  defaultTitle?: string
}

export function useTopics(options: UseTopicsOptions = {}) {
  const {
    maxTopics = 50,
    storageKey = TOPIC_DEFAULTS.STORAGE_KEY,
    persistToStorage = true,
    defaultTitle = TOPIC_DEFAULTS.TITLE,
  } = options

  const topics = ref<Topic[]>([])
  const currentTopicId = ref<string>('')

  // Load topics from storage
  const loadFromStorage = (): Topic[] => {
    if (!persistToStorage || typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load topics from storage:', error)
    }

    return []
  }

  // Save topics to storage
  const saveToStorage = (topicList: Topic[]): void => {
    if (!persistToStorage || typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(topicList))
    } catch (error) {
      console.warn('Failed to save topics to storage:', error)
    }
  }

  /**
   * Create a new topic
   */
  const createTopic = (): string => {
    const newTopic: Topic = {
      topicId: generateId('topic'),
      title: defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0,
    }

    // Add to beginning of list
    topics.value.unshift(newTopic)

    // Enforce max topics
    if (topics.value.length > maxTopics) {
      topics.value = topics.value.slice(0, maxTopics)
    }

    // Switch to new topic
    currentTopicId.value = newTopic.topicId

    saveToStorage(topics.value)

    return newTopic.topicId
  }

  /**
   * Initialize topics (auto-called)
   */
  const init = () => {
    const stored = loadFromStorage()
    topics.value = stored

    if (stored.length > 0) {
      // Use most recent topic
      currentTopicId.value = stored[0].topicId
    } else {
      // Create new topic
      createTopic()
    }
  }

  // Auto-initialize on mount
  init()

  /**
   * Switch to a different topic
   */
  const switchTopic = (topicId: string): void => {
    const topic = topics.value.find(t => t.topicId === topicId)
    if (topic) {
      currentTopicId.value = topicId
      // Move to top
      const index = topics.value.findIndex(t => t.topicId === topicId)
      topics.value.splice(index, 1)
      topics.value.unshift(topic)
      saveToStorage(topics.value)
    }
  }

  /**
   * Update a topic
   */
  const updateTopic = (topicId: string, updates: Partial<Topic>): void => {
    const index = topics.value.findIndex(t => t.topicId === topicId)
    if (index > -1) {
      Object.assign(topics.value[index], updates, { updatedAt: Date.now() })
      saveToStorage(topics.value)
    }
  }

  /**
   * Update topic title
   */
  const updateTopicTitle = (topicId: string, messages: import('@/types').Message[]): void => {
    const index = topics.value.findIndex(t => t.topicId === topicId)
    if (index > -1) {
      const title = extractTopicTitle(messages)
      topics.value[index].title = title
      saveToStorage(topics.value)
    }
  }

  /**
   * Delete a topic
   */
  const deleteTopic = (topicId: string): void => {
    const index = topics.value.findIndex(t => t.topicId === topicId)
    if (index === -1) return

    // Remove topic
    topics.value.splice(index, 1)

    // If deleted topic was current, switch to another
    if (topicId === currentTopicId.value) {
      if (topics.value.length > 0) {
        currentTopicId.value = topics.value[0].topicId
      } else {
        createTopic()
      }
    }

    saveToStorage(topics.value)
  }

  /**
   * Delete all topics
   */
  const deleteAllTopics = (): void => {
    topics.value = []
    createTopic()
  }

  /**
   * Get current topic
   */
  const getCurrentTopic = computed((): Topic | undefined => {
    return topics.value.find(t => t.topicId === currentTopicId.value)
  })

  /**
   * Get topics sorted by update time (already sorted)
   */
  const sortedTopics = computed(() => topics.value)

  // Watch for changes and save to storage
  watch(
    topics,
    (newTopics) => {
      saveToStorage(newTopics)
    },
    { deep: true }
  )

  return {
    // State
    topics,
    currentTopicId,

    // Computed
    currentTopic: getCurrentTopic,
    sortedTopics,

    // Methods
    init,
    createTopic,
    switchTopic,
    updateTopic,
    updateTopicTitle,
    deleteTopic,
    deleteAllTopics,
  }
}

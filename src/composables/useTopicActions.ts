/**
 * Topic actions composable - handles topic CRUD operations
 */
import type { Ref, ComputedRef } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message } from '@/types'

interface TopicActionsDeps {
  config: ComputedRef<Required<ChatbotConfig>>
  state: {
    messages: {
      byTopic: Record<string, Message[]>
      currentTopicId: string
    }
    topics: {
      list: import('@/types').Topic[]
      currentId: string
    }
  }
  apiClient: Ref<ReturnType<typeof import('@/composables/useApiClient')['useApiClient']> | undefined>
  emit: (event: string, ...args: unknown[]) => void
  switchTopic: (topicId: string) => void
  createTopic: () => string
  deleteTopic: (topicId: string) => void
  updateTopicTitle: (topicId: string, title: string) => void
  // Mutation helpers from useChatbotState
  setTopicList: (topics: import('@/types').Topic[]) => void
  setCurrentTopicId: (topicId: string) => void
  addTopicToFront: (topic: import('@/types').Topic) => void
  setMessages: (topicId: string, messages: Message[]) => void
}

export function useTopicActions(deps: TopicActionsDeps) {
  const { config, state, apiClient, emit } = deps

  /**
   * Reload topics list from callback or apiClient
   */
  async function reloadTopics() {
    try {
      let topics: import('@/types').Topic[] = []
      if (config.value.callbacks?.onLoadTopics) {
        topics = await config.value.callbacks.onLoadTopics()
      } else if (apiClient.value) {
        topics = await apiClient.value.getTopics()
      }
      if (topics.length > 0) {
        deps.setTopicList(topics)
      }
    } catch (error) {
      console.error('Failed to reload topics:', error)
    }
  }

  /**
   * Load messages for a specific topic from backend
   */
  async function loadTopicMessages(topicId: string): Promise<Message[]> {
    try {
      if (config.value.callbacks?.onLoadMessages) {
        return await config.value.callbacks.onLoadMessages(topicId)
      } else if (apiClient.value) {
        return await apiClient.value.getTopicMessages(topicId)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('404')) return []
      console.error('Failed to load topic messages:', error)
    }
    return []
  }

  /**
   * Create a new topic
   */
  async function createNewTopic() {
    // Reuse current topic if it's empty
    const currentMsgs = state.messages.byTopic[state.topics.currentId]
    if (currentMsgs && currentMsgs.length > 0) {
      if (config.value.callbacks?.onCreateTopic) {
        try {
          const topic = await config.value.callbacks.onCreateTopic()
          deps.addTopicToFront(topic)
          deps.setCurrentTopicId(topic.topicId)
          emit('topic:created', { topic })
        } catch (error) {
          console.error('Create topic callback failed:', error)
        }
      } else if (apiClient.value) {
        try {
          const topic = await apiClient.value.createTopic()
          deps.addTopicToFront(topic)
          deps.setCurrentTopicId(topic.topicId)
          emit('topic:created', { topic })
        } catch (error) {
          console.error('Failed to create topic:', error)
        }
      } else {
        const newId = deps.createTopic()
        const topic = state.topics.list.find(t => t.topicId === newId)
        if (topic) {
          emit('topic:created', { topic })
        }
      }
    }
  }

  /**
   * Switch to a topic
   */
  async function switchToTopic(topicId: string) {
    if (config.value.callbacks?.onSwitchTopic) {
      try {
        await config.value.callbacks.onSwitchTopic(topicId)
      } catch (error) {
        console.error('Switch topic callback failed:', error)
      }
    }

    deps.switchTopic(topicId)
    emit('topic:switched', { topicId })

    // Load messages if not already loaded
    if (!state.messages.byTopic[topicId]?.length) {
      const messages = await loadTopicMessages(topicId)
      if (messages.length > 0) {
        deps.setMessages(topicId, messages)
      }
    }
  }

  /**
   * Delete a topic
   */
  async function removeTopic(topicId: string) {
    try {
      if (config.value.callbacks?.onDeleteTopic) {
        await config.value.callbacks.onDeleteTopic(topicId)
      } else if (apiClient.value) {
        await apiClient.value.deleteTopic(topicId)
      }
      deps.deleteTopic(topicId)
      emit('topic:deleted', { topicId })
      await reloadTopics()
    } catch (error) {
      console.error('Failed to delete topic:', error)
    }
  }

  /**
   * Update topic title (with optimistic update and rollback)
   */
  async function renameTopic(topicId: string, title: string) {
    const currentTopic = state.topics.list.find(t => t.topicId === topicId)
    const oldTitle = currentTopic?.title || ''

    deps.updateTopicTitle(topicId, title)

    try {
      if (config.value.callbacks?.onUpdateTopicTitle) {
        await config.value.callbacks.onUpdateTopicTitle(topicId, title)
      } else if (apiClient.value) {
        await apiClient.value.updateTopicTitle(topicId, title)
      }
      emit('topic:title-updated', { topicId, title })
    } catch (error) {
      console.error('Failed to update topic title:', error)
      deps.updateTopicTitle(topicId, oldTitle)
    }
  }

  /**
   * Load messages for current topic on mount
   */
  async function loadCurrentTopicMessages() {
    const topicId = state.topics.currentId
    if (!topicId) return

    const messages = await loadTopicMessages(topicId)
    if (messages.length > 0) {
      deps.setMessages(topicId, messages)
    }
  }

  /**
   * Load initial topics from backend on mount
   */
  async function loadInitialTopics() {
    try {
      let topics: import('@/types').Topic[] = []
      if (config.value.callbacks?.onLoadTopics) {
        topics = await config.value.callbacks.onLoadTopics()
      } else if (apiClient.value) {
        topics = await apiClient.value.getTopics()
      }
      if (topics.length > 0) {
        deps.setTopicList(topics)
        deps.setCurrentTopicId(topics[0].topicId)
      }
    } catch (error) {
      console.error('Failed to load initial topics:', error)
    }
  }

  return {
    createNewTopic,
    switchToTopic,
    removeTopic,
    renameTopic,
    reloadTopics,
    loadTopicMessages,
    loadCurrentTopicMessages,
    loadInitialTopics,
  }
}

export type UseTopicActionsReturn = ReturnType<typeof useTopicActions>

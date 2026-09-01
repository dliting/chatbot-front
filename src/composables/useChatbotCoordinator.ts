/**
 * Coordinator for cross-cutting concerns between sub-composables.
 *
 * Uses watch-based sync for reactive state (currentId ↔ currentTopicId)
 * and coordinated methods for multi-state operations (deleteTopic, addMessage).
 * Delegates single-domain operations to sub-composables instead of reimplementing.
 */
import { watch } from 'vue'
import type { MessagesState } from './useMessagesState'
import type { UseTopicsStateReturn } from './useTopicsState'
import type { Message } from '@/types'

interface CoordinatorDeps {
  messages: MessagesState
  topicsState: UseTopicsStateReturn
}

export function useChatbotCoordinator(deps: CoordinatorDeps) {
  const { messages, topicsState } = deps
  const { topics } = topicsState

  // Watch-based sync: topics.currentId → messages.currentTopicId
  // Any change to topics.currentId automatically syncs messages state.
  const stopWatch = watch(
    () => topics.currentId,
    (newId) => {
      if (messages.currentTopicId !== newId) {
        messages.currentTopicId = newId
      }
    },
  )

  // Coordinated: delete topic + its messages + auto-switch if needed
  const deleteTopic = (topicId: string) => {
    // Determine next topic BEFORE deletion (list will change after deleteTopic)
    const isCurrent = topicId === topics.currentId
    const nextTopic = isCurrent
      ? topics.list.find(t => t.topicId !== topicId)
      : null

    // Remove messages for this topic (cross-cutting: messages domain)
    delete messages.byTopic[topicId]

    // Remove topic (delegates to topicsState for single-domain operation)
    topicsState.deleteTopic(topicId)

    // If deleted topic was current, switch to another (cross-cutting: sync currentId)
    if (isCurrent) {
      if (nextTopic) {
        topics.currentId = nextTopic.topicId
      } else {
        // No topics left — create a default one using topicsState
        topicsState.createTopic()
      }
    }
  }

  // Coordinated: add message + update topic metadata
  const addMessage = (message: Message) => {
    const { topicId } = message

    // Add message to messages state
    if (!messages.byTopic[topicId]) {
      messages.byTopic[topicId] = []
    }
    messages.byTopic[topicId].push(message)

    // Update topic metadata (delegates to topicsState)
    const messageCount = messages.byTopic[topicId]?.length || 0
    topicsState.updateTopicAfterMessage(topicId, messageCount)
  }

  // Coordinated: clear messages + reset topic metadata
  const clearCurrentMessages = () => {
    const topicId = messages.currentTopicId
    messages.byTopic[topicId] = []

    const topic = topics.list.find(t => t.topicId === topicId)
    if (topic) {
      topic.messageCount = 0
    }
  }

  // Coordinated: set current topic ID (write to topics.currentId; watcher syncs messages)
  const setCurrentTopicId = (topicId: string) => {
    topics.currentId = topicId
  }

  return {
    deleteTopic,
    addMessage,
    clearCurrentMessages,
    setCurrentTopicId,
    stop: stopWatch,
  }
}

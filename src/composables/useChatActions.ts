/**
 * Chat actions composable - handles message send/stream/delete/edit logic
 */
import { ref, type Ref, type ComputedRef } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Attachment, StreamEvent } from '@/types'
import type { ChatbotError, ErrorCategory } from '@/utils/errors'
import { generateId } from '@/utils/helpers'

interface ChatActionsDeps {
  config: ComputedRef<Required<ChatbotConfig>>
  state: {
    messages: {
      byTopic: Record<string, Message[]>
      currentTopicId: string
    }
    topics: {
      currentId: string
    }
  }
  apiClient: Ref<
    ReturnType<(typeof import('@/composables/useApiClient'))['useApiClient']> | undefined
  >
  emit: (event: string, ...args: unknown[]) => void
  handleError: (error: unknown, category: ErrorCategory, userMessage: string) => ChatbotError
  // Mutation helpers from useChatbotState
  ensureMessages: (topicId: string) => Message[]
  removeMessage: (topicId: string, messageId: string) => void
  insertMessage: (topicId: string, index: number, message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setCurrentTopicId: (topicId: string) => void
}

export function useChatActions(deps: ChatActionsDeps) {
  const { config, state, apiClient, emit } = deps

  const isGenerating = ref(false)
  const isThinkingActive = ref(false)
  const abortController = ref<AbortController | null>(null)

  /**
   * Process a stream, updating the assistant message in place.
   * Shared between send and regenerate flows.
   */
  async function processStream(
    stream: AsyncGenerator<StreamEvent>,
    controller: AbortController,
    assistantMessageId: string,
    thinkingRequested: boolean
  ): Promise<{ fullContent: string; fullThinkingContent: string }> {
    let fullContent = ''
    let fullThinkingContent = ''
    let thinkingStartTime = 0

    for await (const chunk of stream) {
      if (chunk.type === 'reasoning' && chunk.reasoningContent) {
        if (!thinkingRequested) continue
        if (!thinkingStartTime) thinkingStartTime = Date.now()
        isThinkingActive.value = true
        fullThinkingContent += chunk.reasoningContent
        deps.updateMessage(assistantMessageId, {
          thinkingContent: fullThinkingContent,
          thinkingTime: Date.now() - thinkingStartTime,
        })
      } else if (chunk.type === 'token' && chunk.content) {
        isThinkingActive.value = false
        fullContent += chunk.content
        const updates: Partial<Message> = { content: fullContent }
        if (thinkingStartTime) {
          updates.thinkingTime = Date.now() - thinkingStartTime
        }
        deps.updateMessage(assistantMessageId, updates)
      } else if (chunk.type === 'end') {
        if (controller.signal.aborted) break
        isThinkingActive.value = false
        deps.updateMessage(assistantMessageId, { status: 'sent' })
      }
    }

    return { fullContent, fullThinkingContent }
  }

  /**
   * Finalize assistant message status after stream ends
   */
  function finalizeStreamStatus(
    assistantMessageId: string,
    controller: AbortController,
    userMessageId?: string
  ) {
    isThinkingActive.value = false

    const msgs = state.messages.byTopic[state.topics.currentId]
    if (!msgs) return

    // Finalize user message
    if (userMessageId) {
      const userMsg = msgs.find((m) => m.messageId === userMessageId)
      if (userMsg?.status === 'sending') {
        deps.updateMessage(userMessageId, { status: 'sent' })
      }
    }

    // Finalize assistant message
    const assistantMsg = msgs.find((m) => m.messageId === assistantMessageId)
    if (!assistantMsg) return

    if (controller.signal.aborted) {
      deps.updateMessage(assistantMessageId, {
        status: assistantMsg.content ? 'stopped' : 'error',
        errorMessage: config.value.labels?.generationStopped || 'Generation stopped',
      })
    } else if (assistantMsg.status === 'loading') {
      const hasContent = !!(assistantMsg.content || assistantMsg.thinkingContent)
      deps.updateMessage(assistantMessageId, {
        status: hasContent ? 'sent' : 'error',
        ...(hasContent
          ? {}
          : { errorMessage: config.value.labels?.serverError || 'Stream ended unexpectedly' }),
      })
    }
  }

  /**
   * Generate user-friendly error message
   */
  function getErrorMessage(error: Error): string {
    const labels = config.value.labels
    const err = error as Error & { code?: string; status?: number }
    if (err.code === 'TIMEOUT' || err.name === 'TimeoutError') {
      return labels?.timeout || 'Response timeout, check network or backend'
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return labels?.networkError || 'Network connection failed'
    }
    if (err.status) {
      return labels?.serverError
        ? `${labels.serverError} (HTTP ${err.status})`
        : `Server error (HTTP ${err.status})`
    }
    return err.message || 'Send failed, please retry'
  }

  /**
   * Send a new message and stream the AI response
   */
  async function sendMessage(data: {
    content: string
    attachments?: Attachment[]
    extraInfo?: string
  }) {
    if (isGenerating.value) return

    const topicId = state.topics.currentId
    if (!topicId) return

    deps.setCurrentTopicId(topicId)
    deps.ensureMessages(topicId)

    isGenerating.value = true
    const controller = new AbortController()
    abortController.value = controller

    let userMessageId = ''
    let assistantMessageId = ''

    try {
      // Add user message
      const userMessage: Message = {
        messageId: generateId('msg'),
        topicId,
        role: 'user',
        type: data.attachments?.length
          ? data.attachments.length === 1
            ? data.attachments[0].type
            : 'mixed'
          : 'text',
        content: data.content,
        attachments: data.attachments,
        timestamp: Date.now(),
        status: 'sending',
      }
      userMessageId = userMessage.messageId
      deps.insertMessage(topicId, state.messages.byTopic[topicId].length, userMessage)
      emit('message:sent', { message: userMessage })

      // Add assistant placeholder
      assistantMessageId = generateId('msg')
      deps.insertMessage(topicId, state.messages.byTopic[topicId].length, {
        messageId: assistantMessageId,
        topicId,
        role: 'assistant',
        type: 'text',
        content: '',
        timestamp: Date.now(),
        status: 'loading',
      })

      const thinkingRequested = config.value.thinkingDefaultEnabled

      // Three-tier fallback: callback > apiClient > error
      let stream: AsyncGenerator<StreamEvent>
      if (config.value.callbacks?.onSendMessage) {
        stream = config.value.callbacks.onSendMessage({
          topicId,
          content: data.content,
          attachments: data.attachments,
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
          extraInfo: data.extraInfo,
        })
      } else if (apiClient.value) {
        stream = apiClient.value.streamChat(topicId, data.content, data.attachments, {
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
        })
      } else {
        deps.handleError(
          new Error('No API client or callback provided'),
          'config',
          'No API client or callback provided'
        )
        isGenerating.value = false
        return
      }

      emit('message:stream-start', { messageId: assistantMessageId })

      await processStream(stream, controller, assistantMessageId, thinkingRequested)
      finalizeStreamStatus(assistantMessageId, controller, userMessageId)
      emit('message:stream-end', { messageId: assistantMessageId })
    } catch (error) {
      handleStreamError(error as Error, assistantMessageId, userMessageId)
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  }

  /**
   * Regenerate (refresh) an AI response
   */
  async function refreshMessage(message: Message) {
    const topicId = state.topics.currentId
    const msgs = state.messages.byTopic[topicId]
    if (!msgs) return

    // Remove the assistant message
    const index = msgs.findIndex((m) => m.messageId === message.messageId)
    if (index !== -1) {
      deps.removeMessage(topicId, message.messageId)
    }

    // Find the preceding user message
    let userMsg: Message | undefined
    for (let i = index - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        userMsg = msgs[i]
        break
      }
    }
    if (!userMsg) return

    emit('message:regenerated', { messageId: message.messageId, topicId })

    // Use onRegenerateMessage callback if available
    if (config.value.callbacks?.onRegenerateMessage) {
      if (isGenerating.value) return

      isGenerating.value = true
      const controller = new AbortController()
      abortController.value = controller
      const assistantMessageId = generateId('msg')

      try {
        // Add placeholder for new AI response
        deps.insertMessage(topicId, index, {
          messageId: assistantMessageId,
          topicId,
          role: 'assistant',
          type: 'text',
          content: '',
          timestamp: Date.now(),
          status: 'loading',
        })

        const thinkingRequested = config.value.thinkingDefaultEnabled
        const stream = config.value.callbacks.onRegenerateMessage({
          topicId,
          content: userMsg.content,
          attachments: userMsg.attachments,
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
          messageId: userMsg.messageId,
        })

        await processStream(stream, controller, assistantMessageId, thinkingRequested)
        finalizeStreamStatus(assistantMessageId, controller)
      } catch (error) {
        deps.handleError(error, 'stream', 'Failed to regenerate message')
        isThinkingActive.value = false
        deps.updateMessage(assistantMessageId, {
          status: 'error',
          errorMessage: (error as Error).message || 'Regeneration failed',
        })
      } finally {
        isGenerating.value = false
        abortController.value = null
      }
    } else {
      // No regenerate callback — delegate to sendMessage
      await sendMessage({ content: userMsg.content, attachments: userMsg.attachments })
    }
  }

  /**
   * Handle stream errors (network, timeout, server)
   */
  function handleStreamError(error: Error, assistantMessageId: string, userMessageId: string) {
    isThinkingActive.value = false

    const msgs = state.messages.byTopic[state.topics.currentId]
    if (!msgs) return

    if (error.name === 'AbortError') {
      // Defense-in-depth: normally unreachable via useApiClient
      deps.updateMessage(userMessageId, { status: 'sent' })
      const assistantMsg = msgs.find((m) => m.messageId === assistantMessageId)
      deps.updateMessage(assistantMessageId, {
        status: assistantMsg?.content ? 'stopped' : 'error',
        errorMessage: config.value.labels?.generationStopped || 'Generation stopped',
      })
    } else {
      deps.handleError(error, 'stream', 'Failed to send message')
      deps.updateMessage(userMessageId, { status: 'error' })
      const assistantMsg = msgs.find((m) => m.messageId === assistantMessageId)
      if (assistantMsg) {
        deps.updateMessage(assistantMessageId, {
          status: 'error',
          errorMessage: getErrorMessage(error),
        })
        emit('message:error', { message: assistantMsg, error })
      }
    }
  }

  /**
   * Delete a message
   */
  async function deleteMessage(message: Message) {
    const topicId = state.topics.currentId
    const msgs = state.messages.byTopic[topicId]
    if (!msgs) return

    const exists = msgs.some((m) => m.messageId === message.messageId)
    if (!exists) return

    try {
      if (config.value.callbacks?.onDeleteMessage) {
        await config.value.callbacks.onDeleteMessage(message.messageId, topicId)
      } else if (apiClient.value) {
        await apiClient.value.deleteMessage(message.messageId)
      }
      deps.removeMessage(topicId, message.messageId)
      emit('message:deleted', { messageId: message.messageId, topicId })
    } catch (error) {
      deps.handleError(error, 'message', 'Failed to delete message')
    }
  }

  /**
   * Edit a message (emit event for host to handle)
   */
  function editMessage(message: Message) {
    emit('message:edited', { messageId: message.messageId, topicId: message.topicId })
  }

  /**
   * Stop generating
   */
  function stopGenerating() {
    if (abortController.value) {
      abortController.value.abort()
      emit('ui:stop-generating')
    }
  }

  return {
    // State
    isGenerating,
    isThinkingActive,

    // Actions
    sendMessage,
    refreshMessage,
    deleteMessage,
    editMessage,
    stopGenerating,
  }
}

export type UseChatActionsReturn = ReturnType<typeof useChatActions>

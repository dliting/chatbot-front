/**
 * Chat actions composable - handles message send/stream/delete/edit logic
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Attachment, StreamEvent, ChatTransport } from '@/types'
import type { ChatbotError, ErrorCategory } from '@/utils/errors'
import { generateId } from '@/utils/helpers'
import { useStreamProcessor, type StreamRunHandle } from './useStreamProcessor'

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
  /** Transport Bridge tier: sits between callbacks and apiClient */
  transport?: ComputedRef<ChatTransport | undefined>
  emit: (event: string, ...args: unknown[]) => void
  handleError: (error: unknown, category: ErrorCategory, userMessage: string) => ChatbotError
  // Mutation helpers from useChatbotState
  ensureMessages: (topicId: string) => Message[]
  removeMessage: (topicId: string, messageId: string) => void
  insertMessage: (topicId: string, index: number, message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  renameMessage: (oldId: string, newId: string) => void
  setCurrentTopicId: (topicId: string) => void
}

export function useChatActions(deps: ChatActionsDeps) {
  const { config, state, apiClient, emit, transport } = deps

  const isGenerating = ref(false)
  const abortController = ref<AbortController | null>(null)

  // Stream-processing state machine (shared by send / regenerate / edit)
  const streamProcessor = useStreamProcessor({
    updateMessage: deps.updateMessage,
    renameMessage: deps.renameMessage,
    labels: computed(() => config.value.labels),
    getMessages: () => state.messages.byTopic[state.topics.currentId],
  })
  const { processStream, finalizeStreamStatus, isThinkingActive } = streamProcessor

  /** Assistant loading placeholder — identical shape at all three insertion sites */
  function createAssistantPlaceholder(topicId: string, messageId: string): Message {
    return {
      messageId,
      topicId,
      role: 'assistant',
      type: 'text',
      content: '',
      timestamp: Date.now(),
      status: 'loading',
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

  /** Adopt the server-assigned id when it differs from the local placeholder */
  function adoptServerId(localId: string, serverId?: string): string {
    if (serverId && serverId !== localId) {
      deps.renameMessage(localId, serverId)
      return serverId
    }
    return localId
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
    // Function scope so the catch below sees the id the server adopted
    // mid-stream (a stale placeholder id would orphan the error state)
    const assistantIdRef: StreamRunHandle = { current: '' }

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
      deps.insertMessage(topicId, state.messages.byTopic[topicId].length, createAssistantPlaceholder(topicId, assistantMessageId))

      const thinkingRequested = config.value.thinkingDefaultEnabled

      // Tiered fallback: callback > transport (Bridge) > apiClient > error
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
      } else if (transport?.value && !config.value.streamEnabled) {
        const reply = await transport.value.sendMessage({
          topicId,
          content: data.content,
          attachments: data.attachments,
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
          extraInfo: data.extraInfo,
        })
        const finalId = adoptServerId(assistantMessageId, reply.messageId)
        // start/end pair on the same (server-adopted) id for host correlation
        emit('message:stream-start', { messageId: finalId })
        deps.updateMessage(finalId, { content: reply.content, status: 'sent' })
        finalizeStreamStatus(finalId, controller, userMessageId)
        emit('message:stream-end', { messageId: finalId, fullContent: reply.content })
        return
      } else if (transport?.value) {
        stream = transport.value.streamMessage({
          topicId,
          content: data.content,
          attachments: data.attachments,
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
          extraInfo: data.extraInfo,
        })
      } else if (apiClient.value && !config.value.streamEnabled) {
        const reply = await apiClient.value.sendMessage(topicId, data.content, data.attachments)
        const finalId = adoptServerId(assistantMessageId, reply.messageId)
        emit('message:stream-start', { messageId: finalId })
        deps.updateMessage(finalId, { content: reply.content, status: 'sent' })
        finalizeStreamStatus(finalId, controller, userMessageId)
        emit('message:stream-end', { messageId: finalId, fullContent: reply.content })
        return
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

      // Holder lives in function scope so the catch below sees the id the
      // server adopted mid-stream (a stale id would orphan the error state)
      assistantIdRef.current = assistantMessageId
      const { fullContent, streamStarted } = await processStream(
        stream,
        controller,
        assistantIdRef,
        thinkingRequested,
        () => emit('message:stream-start', { messageId: assistantIdRef.current })
      )
      finalizeStreamStatus(assistantIdRef.current, controller, userMessageId)
      // stream-end pairs with stream-start — degenerate streams stay unpaired
      if (streamStarted) {
        emit('message:stream-end', { messageId: assistantIdRef.current, fullContent })
      }
    } catch (error) {
      handleStreamError(error as Error, assistantIdRef.current || assistantMessageId, userMessageId)
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
      const assistantIdRef: StreamRunHandle = { current: assistantMessageId }

      try {
        // Add placeholder for new AI response
        deps.insertMessage(topicId, index, createAssistantPlaceholder(topicId, assistantMessageId))

        const thinkingRequested = config.value.thinkingDefaultEnabled
        const stream = config.value.callbacks.onRegenerateMessage({
          topicId,
          content: userMsg.content,
          attachments: userMsg.attachments,
          thinking: { enabled: thinkingRequested },
          signal: controller.signal,
          messageId: userMsg.messageId,
        })

        await processStream(
          stream,
          controller,
          assistantIdRef,
          thinkingRequested,
          () => emit('message:stream-start', { messageId: assistantIdRef.current })
        )
        finalizeStreamStatus(assistantIdRef.current, controller)
      } catch (error) {
        deps.handleError(error, 'stream', 'Failed to regenerate message')
        isThinkingActive.value = false
        deps.updateMessage(assistantIdRef.current, {
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
      } else if (transport?.value?.deleteMessage) {
        await transport.value.deleteMessage(message.messageId)
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
   * Edit a message: emit event for host, and when the host provides
   * onEditMessage, run the edit-resend flow (streaming replacement reply).
   */
  async function editMessage(message: Message) {
    emit('message:edited', { messageId: message.messageId, topicId: message.topicId })

    const editCallback = config.value.callbacks?.onEditMessage
    if (!editCallback || isGenerating.value) return

    const topicId = message.topicId || state.topics.currentId
    const msgs = state.messages.byTopic[topicId]
    if (!msgs) return

    const index = msgs.findIndex((m) => m.messageId === message.messageId)
    if (index === -1) return

    // Remove the assistant reply that follows the edited user message
    const replyIndex = msgs.findIndex(
      (m, i) => i > index && m.role === 'assistant'
    )
    if (replyIndex !== -1) {
      deps.removeMessage(topicId, msgs[replyIndex].messageId)
    }

    isGenerating.value = true
    const controller = new AbortController()
    abortController.value = controller
    const assistantMessageId = generateId('msg')
    const assistantIdRef: StreamRunHandle = { current: assistantMessageId }

    try {
      deps.insertMessage(topicId, index + 1, createAssistantPlaceholder(topicId, assistantMessageId))

      const thinkingRequested = config.value.thinkingDefaultEnabled
      const stream = editCallback({
        topicId,
        content: message.content,
        attachments: message.attachments,
        thinking: { enabled: thinkingRequested },
        signal: controller.signal,
        messageId: message.messageId,
      })

      await processStream(
        stream,
        controller,
        assistantIdRef,
        thinkingRequested,
        () => emit('message:stream-start', { messageId: assistantIdRef.current })
      )
      finalizeStreamStatus(assistantIdRef.current, controller)
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        deps.handleError(error, 'message', 'Failed to edit message')
        // Mark the placeholder with the adopted id, not the stale local one
        deps.updateMessage(assistantIdRef.current, {
          status: 'error',
          errorMessage: (error as Error).message || 'Edit failed',
        })
      }
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  }

  /**
   * Submit message feedback (👍/👎). 'none' clears a previous feedback.
   * Tiered fallback: callback > transport (Bridge) > apiClient > local-only.
   * Local state applies first; a failed upload reports but never rolls back
   * (feedback is best-effort and flipping UI state would only add noise).
   */
  async function submitMessageFeedback(
    message: Message,
    feedback: 'up' | 'down' | 'none'
  ) {
    deps.updateMessage(message.messageId, {
      feedback: feedback === 'none' ? undefined : feedback,
    })
    emit('message:feedback', { messageId: message.messageId, topicId: message.topicId, feedback })

    try {
      if (config.value.callbacks?.onMessageFeedback) {
        await config.value.callbacks.onMessageFeedback({
          messageId: message.messageId,
          topicId: message.topicId,
          feedback,
        })
      } else if (transport?.value?.submitFeedback) {
        await transport.value.submitFeedback(message.messageId, feedback)
      } else if (apiClient.value) {
        await apiClient.value.submitFeedback(message.messageId, feedback)
      }
    } catch (error) {
      deps.handleError(error, 'message', 'Failed to submit feedback')
    }
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
    submitMessageFeedback,
    stopGenerating,
  }
}

export type UseChatActionsReturn = ReturnType<typeof useChatActions>

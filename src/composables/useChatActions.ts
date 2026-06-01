/**
 * Chat actions composable - handles message send/stream/delete/edit logic
 */
import { ref, type Ref, type ComputedRef } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Attachment, StreamEvent } from '@/types'
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
  apiClient: Ref<ReturnType<typeof import('@/composables/useApiClient')['useApiClient']> | undefined>
  emit: (event: string, ...args: unknown[]) => void
}

export function useChatActions(deps: ChatActionsDeps) {
  const { config, state, apiClient, emit } = deps

  const isGenerating = ref(false)
  const isThinkingActive = ref(false)
  const abortController = ref<AbortController | null>(null)

  /**
   * Get messages array for a topic, creating it if needed
   */
  function ensureMessages(topicId: string): Message[] {
    if (!state.messages.byTopic[topicId]) {
      state.messages.byTopic[topicId] = []
    }
    return state.messages.byTopic[topicId]
  }

  /**
   * Process a stream, updating the assistant message in place.
   * Shared between send and regenerate flows.
   */
  async function processStream(
    stream: AsyncGenerator<StreamEvent>,
    controller: AbortController,
    assistantMessageId: string,
    thinkingRequested: boolean,
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
        updateAssistantMessage(assistantMessageId, {
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
        updateAssistantMessage(assistantMessageId, updates)
      } else if (chunk.type === 'end') {
        if (controller.signal.aborted) break
        isThinkingActive.value = false
        updateAssistantMessage(assistantMessageId, { status: 'sent' })
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
    userMessageId?: string,
  ) {
    isThinkingActive.value = false

    const msgs = state.messages.byTopic[state.topics.currentId]
    if (!msgs) return

    // Finalize user message
    if (userMessageId) {
      const userMsg = msgs.find(m => m.messageId === userMessageId)
      if (userMsg && userMsg.status === 'sending') {
        userMsg.status = 'sent'
      }
    }

    // Finalize assistant message
    const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
    if (!assistantMsg) return

    if (controller.signal.aborted) {
      assistantMsg.status = assistantMsg.content ? 'stopped' : 'error'
      assistantMsg.errorMessage = config.value.labels?.generationStopped || 'Generation stopped'
    } else if (assistantMsg.status === 'loading') {
      assistantMsg.status = (assistantMsg.content || assistantMsg.thinkingContent) ? 'sent' : 'error'
      if (assistantMsg.status === 'error') {
        assistantMsg.errorMessage = config.value.labels?.serverError || 'Stream ended unexpectedly'
      }
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
   * Update an assistant message in the current topic
   */
  function updateAssistantMessage(messageId: string, updates: Partial<Message>) {
    const msgs = state.messages.byTopic[state.topics.currentId]
    if (!msgs) return
    const msg = msgs.find(m => m.messageId === messageId)
    if (msg) {
      Object.assign(msg, updates)
    }
  }

  /**
   * Send a new message and stream the AI response
   */
  async function sendMessage(data: { content: string; attachments?: Attachment[] }) {
    if (isGenerating.value) return

    const topicId = state.topics.currentId
    if (!topicId) return

    state.messages.currentTopicId = topicId
    const currentMessages = ensureMessages(topicId)

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
          ? (data.attachments.length === 1 ? data.attachments[0].type : 'mixed')
          : 'text',
        content: data.content,
        attachments: data.attachments,
        timestamp: Date.now(),
        status: 'sending',
      }
      userMessageId = userMessage.messageId
      currentMessages.push(userMessage)
      emit('message:sent', { message: userMessage })

      // Add assistant placeholder
      assistantMessageId = generateId('msg')
      currentMessages.push({
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
        })
      } else if (apiClient.value) {
        stream = apiClient.value.streamChat(
          topicId, data.content, data.attachments,
          { thinking: { enabled: thinkingRequested }, signal: controller.signal },
        )
      } else {
        console.error('No API client or callback provided')
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
    const index = msgs.findIndex(m => m.messageId === message.messageId)
    if (index !== -1) {
      msgs.splice(index, 1)
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
        msgs.splice(index, 0, {
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
        console.error('Failed to regenerate message:', error)
        isThinkingActive.value = false
        const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.status = 'error'
          assistantMsg.errorMessage = (error as Error).message || 'Regeneration failed'
        }
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
      const userMsg = msgs.find(m => m.messageId === userMessageId)
      if (userMsg) userMsg.status = 'sent'
      const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
      if (assistantMsg) {
        assistantMsg.status = assistantMsg.content ? 'stopped' : 'error'
        assistantMsg.errorMessage = config.value.labels?.generationStopped || 'Generation stopped'
      }
    } else {
      console.error('Failed to send message:', error)
      const userMsg = msgs.find(m => m.messageId === userMessageId)
      if (userMsg) userMsg.status = 'error'
      const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
      if (assistantMsg) {
        assistantMsg.status = 'error'
        assistantMsg.errorMessage = getErrorMessage(error)
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

    const index = msgs.findIndex(m => m.messageId === message.messageId)
    if (index === -1) return

    try {
      if (config.value.callbacks?.onDeleteMessage) {
        await config.value.callbacks.onDeleteMessage(message.messageId, topicId)
      } else if (apiClient.value) {
        await apiClient.value.deleteMessage(message.messageId)
      }
      msgs.splice(index, 1)
      emit('message:deleted', { messageId: message.messageId, topicId })
    } catch (error) {
      console.error('Failed to delete message:', error)
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

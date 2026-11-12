/**
 * Stream-processing state machine shared by send / regenerate / edit flows.
 * Extracted from useChatActions: owns the thinking-active flag and the
 * assistant-message update protocol, independent of topic-list mutations.
 */
import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Message, StreamEvent } from '@/types'
import type { ChatbotLabels } from '@/types/config'

/** Mutable assistant-message id: renamed in place when the server announces its own */
export interface StreamRunHandle {
  current: string
}

export interface UseStreamProcessorDeps {
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  /** Re-key a message when the backend announces its own id on the start event */
  renameMessage: (oldId: string, newId: string) => void
  labels: ComputedRef<Partial<ChatbotLabels>>
  /** Current topic's message list (for finalize lookups) */
  getMessages: () => Message[] | undefined
}

export interface UseStreamProcessorReturn {
  processStream: (
    stream: AsyncGenerator<StreamEvent>,
    controller: AbortController,
    assistantIdRef: StreamRunHandle,
    thinkingRequested: boolean,
    /** Fired once before the first content-affecting event, after id adoption —
     *  lets callers emit message:stream-start with the FINAL message id so
     *  start/end events always pair for hosts */
    onStreamStart?: () => void
  ) => Promise<{ fullContent: string; fullThinkingContent: string; streamStarted: boolean }>
  finalizeStreamStatus: (
    assistantMessageId: string,
    controller: AbortController,
    userMessageId?: string
  ) => void
  isThinkingActive: Ref<boolean>
}

export function useStreamProcessor(deps: UseStreamProcessorDeps): UseStreamProcessorReturn {
  const { updateMessage, renameMessage, labels } = deps
  const isThinkingActive = ref(false)

  /**
   * Process a stream, updating the assistant message in place.
   * Shared between send and regenerate flows.
   * When the backend announces its own message id on the start event, the
   * placeholder id is re-keyed (assistantIdRef.current updated) so later
   * updates (feedback, delete) and error paths correlate with the persisted
   * server record.
   */
  async function processStream(
    stream: AsyncGenerator<StreamEvent>,
    controller: AbortController,
    assistantIdRef: StreamRunHandle,
    thinkingRequested: boolean,
    onStreamStart?: () => void
  ): Promise<{ fullContent: string; fullThinkingContent: string; streamStarted: boolean }> {
    let fullContent = ''
    let fullThinkingContent = ''
    let thinkingStartTime = 0
    let streamStartEmitted = false

    const emitStreamStartOnce = () => {
      if (!streamStartEmitted) {
        streamStartEmitted = true
        onStreamStart?.()
      }
    }

    for await (const chunk of stream) {
      if (chunk.type === 'start' && chunk.messageId && chunk.messageId !== assistantIdRef.current) {
        renameMessage(assistantIdRef.current, chunk.messageId)
        assistantIdRef.current = chunk.messageId
      } else if (chunk.type === 'reasoning' && chunk.reasoningContent) {
        if (!thinkingRequested) continue
        emitStreamStartOnce()
        if (!thinkingStartTime) thinkingStartTime = Date.now()
        isThinkingActive.value = true
        fullThinkingContent += chunk.reasoningContent
        updateMessage(assistantIdRef.current, {
          thinkingContent: fullThinkingContent,
          thinkingTime: Date.now() - thinkingStartTime,
        })
      } else if (chunk.type === 'token' && chunk.content) {
        emitStreamStartOnce()
        isThinkingActive.value = false
        fullContent += chunk.content
        const updates: Partial<Message> = { content: fullContent }
        if (thinkingStartTime) {
          updates.thinkingTime = Date.now() - thinkingStartTime
        }
        updateMessage(assistantIdRef.current, updates)
      } else if (chunk.type === 'error') {
        // Backend SSE error contract ({type:'error', error}) — surface it
        // through the standard error path instead of a silent empty stream
        emitStreamStartOnce()
        throw new Error(chunk.error || 'Stream error')
      } else if (chunk.type === 'end') {
        emitStreamStartOnce()
        if (controller.signal.aborted) break
        isThinkingActive.value = false
        updateMessage(assistantIdRef.current, { status: 'sent' })
      }
    }

    // Callers emit message:stream-end only when streamStarted — a degenerate
    // stream (start-only or erroring before content) must not emit an
    // unpaired end event
    return { fullContent, fullThinkingContent, streamStarted: streamStartEmitted }
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

    const msgs = deps.getMessages()
    if (!msgs) return

    // Finalize user message
    if (userMessageId) {
      const userMsg = msgs.find((m) => m.messageId === userMessageId)
      if (userMsg?.status === 'sending') {
        updateMessage(userMessageId, { status: 'sent' })
      }
    }

    // Finalize assistant message
    const assistantMsg = msgs.find((m) => m.messageId === assistantMessageId)
    if (!assistantMsg) return

    if (controller.signal.aborted) {
      updateMessage(assistantMessageId, {
        status: assistantMsg.content ? 'stopped' : 'error',
        errorMessage: labels.value.generationStopped || 'Generation stopped',
      })
    } else if (assistantMsg.status === 'loading') {
      const hasContent = !!(assistantMsg.content || assistantMsg.thinkingContent)
      updateMessage(assistantMessageId, {
        status: hasContent ? 'sent' : 'error',
        ...(hasContent
          ? {}
          : { errorMessage: labels.value.serverError || 'Stream ended unexpectedly' }),
      })
    }
  }

  return { processStream, finalizeStreamStatus, isThinkingActive }
}

/**
 * Stream-processing state machine shared by send / regenerate / edit flows.
 * Extracted from useChatActions: owns the thinking-active flag and the
 * assistant-message update protocol, independent of topic-list mutations.
 */
import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Message, StreamEvent } from '@/types'
import type { ChatbotLabels } from '@/types/config'

export interface UseStreamProcessorDeps {
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  labels: ComputedRef<Partial<ChatbotLabels>>
  /** Current topic's message list (for finalize lookups) */
  getMessages: () => Message[] | undefined
}

export interface UseStreamProcessorReturn {
  processStream: (
    stream: AsyncGenerator<StreamEvent>,
    controller: AbortController,
    assistantMessageId: string,
    thinkingRequested: boolean
  ) => Promise<{ fullContent: string; fullThinkingContent: string }>
  finalizeStreamStatus: (
    assistantMessageId: string,
    controller: AbortController,
    userMessageId?: string
  ) => void
  isThinkingActive: Ref<boolean>
}

export function useStreamProcessor(deps: UseStreamProcessorDeps): UseStreamProcessorReturn {
  const { updateMessage, labels } = deps
  const isThinkingActive = ref(false)

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
        updateMessage(assistantMessageId, {
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
        updateMessage(assistantMessageId, updates)
      } else if (chunk.type === 'end') {
        if (controller.signal.aborted) break
        isThinkingActive.value = false
        updateMessage(assistantMessageId, { status: 'sent' })
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

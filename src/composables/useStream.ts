/**
 * Composable for handling streaming responses
 */
import { ref } from 'vue'
import type { StreamEvent } from '@/types'
import { StreamClient, fetchStream, StreamAccumulator } from '@/utils/stream'

export interface UseStreamOptions {
  enabled?: boolean
  onChunk?: (content: string) => void
  onComplete?: (content: string) => void
  onError?: (error: Error) => void
}

export function useStream(options: UseStreamOptions = {}) {
  const { enabled = true, onChunk, onComplete, onError } = options

  const isStreaming = ref(false)
  const streamedContent = ref('')
  const streamedThinkingContent = ref('')
  const isThinking = ref(false)
  const accumulator = new StreamAccumulator()

  /**
   * Stream from SSE endpoint
   */
  const streamFromSSE = (url: string): void => {
    if (!enabled) return

    isStreaming.value = true
    streamedContent.value = ''
    streamedThinkingContent.value = ''
    isThinking.value = false
    accumulator.reset()

    const client = new StreamClient(url, {
      onMessage: (event: StreamEvent) => {
        accumulator.add(event)

        if (event.type === 'start') {
          streamedContent.value = ''
          streamedThinkingContent.value = ''
          isThinking.value = false
        } else if (event.type === 'reasoning' && event.reasoningContent) {
          isThinking.value = true
          streamedThinkingContent.value += event.reasoningContent
        } else if (event.type === 'token' && event.content) {
          isThinking.value = false
          streamedContent.value += event.content
          onChunk?.(event.content)
        } else if (event.type === 'end') {
          isThinking.value = false
          isStreaming.value = false
          onComplete?.(accumulator.getContent())
        }
      },
      onError: (error: Error) => {
        isThinking.value = false
        isStreaming.value = false
        onError?.(error)
      },
    })

    client.connect()
  }

  /**
   * Stream from fetch with ReadableStream
   */
  const streamFromFetch = async (
    url: string,
    fetchOptions: RequestInit = {}
  ): Promise<void> => {
    if (!enabled) return

    isStreaming.value = true
    streamedContent.value = ''
    streamedThinkingContent.value = ''
    isThinking.value = false
    accumulator.reset()

    await fetchStream(
      url,
      fetchOptions,
      (chunk: string) => {
        streamedContent.value += chunk
        onChunk?.(chunk)
      },
      (content: string) => {
        isThinking.value = false
        isStreaming.value = false
        onComplete?.(content)
      },
      (error: Error) => {
        isThinking.value = false
        isStreaming.value = false
        onError?.(error)
      }
    )
  }

  /**
   * Stream from async generator
   */
  const streamFromGenerator = async (
    generator: AsyncGenerator<StreamEvent, void, unknown>
  ): Promise<void> => {
    if (!enabled) return

    isStreaming.value = true
    streamedContent.value = ''
    streamedThinkingContent.value = ''
    isThinking.value = false
    accumulator.reset()

    try {
      for await (const event of generator) {
        accumulator.add(event)

        if (event.type === 'start') {
          streamedContent.value = ''
          streamedThinkingContent.value = ''
          isThinking.value = false
        } else if (event.type === 'reasoning' && event.reasoningContent) {
          isThinking.value = true
          streamedThinkingContent.value += event.reasoningContent
        } else if (event.type === 'token' && event.content) {
          isThinking.value = false
          streamedContent.value += event.content
          onChunk?.(event.content)
        } else if (event.type === 'end') {
          isThinking.value = false
          isStreaming.value = false
          onComplete?.(accumulator.getContent())
        } else if (event.type === 'error') {
          isThinking.value = false
          throw new Error(event.error || 'Stream error')
        }
      }
    } catch (error) {
      isThinking.value = false
      isStreaming.value = false
      onError?.(error as Error)
    }
  }

  /**
   * Cancel current stream
   */
  const cancel = (): void => {
    isStreaming.value = false
  }

  /**
   * Reset stream state
   */
  const reset = (): void => {
    isStreaming.value = false
    streamedContent.value = ''
    streamedThinkingContent.value = ''
    isThinking.value = false
    accumulator.reset()
  }

  return {
    // State
    isStreaming,
    streamedContent,
    streamedThinkingContent,
    isThinking,

    // Methods
    streamFromSSE,
    streamFromFetch,
    streamFromGenerator,
    cancel,
    reset,
  }
}

/**
 * Composable for mock streaming (for development)
 */
export function useMockStream() {
  const { isStreaming, streamedContent, streamFromGenerator } = useStream()

  /**
   * Stream mock response
   */
  const streamMock = async (text: string, charDelay = 50) => {
    async function* generate(): AsyncGenerator<StreamEvent> {
      yield { type: 'start', messageId: `msg_${Date.now()}` }

      for (const char of text) {
        await new Promise(resolve => setTimeout(resolve, charDelay))
        yield { type: 'token', content: char }
      }

      yield { type: 'end', fullContent: text }
    }

    await streamFromGenerator(generate())
  }

  return {
    isStreaming,
    streamedContent,
    streamMock,
  }
}

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
  const accumulator = new StreamAccumulator()

  /**
   * Stream from SSE endpoint
   */
  const streamFromSSE = (url: string): void => {
    if (!enabled) return

    isStreaming.value = true
    streamedContent.value = ''
    accumulator.reset()

    const client = new StreamClient(url, {
      onMessage: (event: StreamEvent) => {
        accumulator.add(event)

        if (event.type === 'start') {
          streamedContent.value = ''
        } else if (event.type === 'token' && event.content) {
          streamedContent.value += event.content
          onChunk?.(event.content)
        } else if (event.type === 'end') {
          isStreaming.value = false
          onComplete?.(accumulator.getContent())
        }
      },
      onError: (error: Error) => {
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
    accumulator.reset()

    await fetchStream(
      url,
      fetchOptions,
      (chunk: string) => {
        streamedContent.value += chunk
        onChunk?.(chunk)
      },
      (content: string) => {
        isStreaming.value = false
        onComplete?.(content)
      },
      (error: Error) => {
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
    accumulator.reset()

    try {
      for await (const event of generator) {
        accumulator.add(event)

        if (event.type === 'start') {
          streamedContent.value = ''
        } else if (event.type === 'token' && event.content) {
          streamedContent.value += event.content
          onChunk?.(event.content)
        } else if (event.type === 'end') {
          isStreaming.value = false
          onComplete?.(accumulator.getContent())
        } else if (event.type === 'error') {
          throw new Error(event.error || 'Stream error')
        }
      }
    } catch (error) {
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
    accumulator.reset()
  }

  return {
    // State
    isStreaming,
    streamedContent,

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

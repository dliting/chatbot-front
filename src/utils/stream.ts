/**
 * Stream utilities for SSE and streaming responses
 */
import type { StreamEvent } from '@/types'

/**
 * Stream client for Server-Sent Events
 */
export class StreamClient {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 1000

  constructor(
    private url: string,
    private options: {
      onMessage?: (event: StreamEvent) => void
      onError?: (error: Error) => void
      onOpen?: () => void
      reconnect?: boolean
    } = {}
  ) {}

  /**
   * Connect to the SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect()
    }

    try {
      this.eventSource = new EventSource(this.url)

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0
        this.options.onOpen?.()
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent
          this.options.onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse stream data:', error)
        }
      }

      this.eventSource.onerror = () => {
        this.handleError()
      }
    } catch (error) {
      this.options.onError?.(error as Error)
    }
  }

  /**
   * Handle connection errors
   */
  private handleError(): void {
    this.disconnect()

    if (this.options.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      this.options.onError?.(new Error('Stream connection failed'))
    }
  }

  /**
   * Disconnect from the stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

/**
 * Fetch with streaming response using ReadableStream
 */
export async function fetchStream(
  url: string,
  options: RequestInit = {},
  onChunk: (chunk: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const controller = new AbortController()

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let fullContent = ''

    const read = async (): Promise<void> => {
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            onComplete(fullContent)
            return
          }

          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          onChunk(chunk)
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError(error as Error)
        }
      }
    }

    read()
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      onError(error as Error)
    }
  }

  // Return cleanup function
  return () => {
    controller.abort()
  }
}

/**
 * Parse SSE line data
 */
export function parseSSELine(line: string): StreamEvent | null {
  if (!line.trim() || line.startsWith(':')) {
    return null
  }

  const parts = line.split(':', 2)
  if (parts.length < 2) {
    return null
  }

  const [, data] = parts

  try {
    return JSON.parse(data.trim()) as StreamEvent
  } catch {
    return null
  }
}

/**
 * Create a mock stream for testing
 */
export function createMockStream(
  content: string,
  delay = 50
): AsyncGenerator<StreamEvent, void, unknown> {
  return (async function* () {
    yield { type: 'start', messageId: `msg_${Date.now()}` }

    for (const char of content) {
      await new Promise(resolve => setTimeout(resolve, delay))
      yield { type: 'token', content: char }
    }

    yield { type: 'end', fullContent: content }
  })()
}

/**
 * Accumulator for streaming content
 */
export class StreamAccumulator {
  private content = ''
  private messageId: string | null = null

  add(event: StreamEvent): void {
    switch (event.type) {
      case 'start':
        this.content = ''
        this.messageId = event.messageId ?? null
        break
      case 'token':
        if (event.content) {
          this.content += event.content
        }
        break
      case 'end':
        if (event.fullContent) {
          this.content = event.fullContent
        }
        break
    }
  }

  getContent(): string {
    return this.content
  }

  getMessageId(): string | null {
    return this.messageId
  }

  reset(): void {
    this.content = ''
    this.messageId = null
  }

  isComplete(): boolean {
    return this.content.length > 0
  }
}

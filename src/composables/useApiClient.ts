/**
 * API client composable for connecting to backend
 */
import { ref } from 'vue'
import type { Message, Topic } from '@/types'

export interface ApiClientOptions {
  baseUrl: string
  streamTimeout?: number
}

export function useApiClient(options: ApiClientOptions) {
  const { baseUrl, streamTimeout = 120000 } = options
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Create streaming response generator
   */
  async function* streamChat(
    sessionId: string,
    content: string,
    images?: string[],
    videos?: string[],
    audios?: string[],
    options?: { thinking?: { enabled?: boolean }; signal?: AbortSignal }
  ): AsyncGenerator<{ type: string; messageId?: string; content?: string; fullContent?: string; reasoningContent?: string }> {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    try {
      const { signal, ...chatOptions } = options ?? {} as { signal?: AbortSignal; thinking?: { enabled?: boolean } }

      // Combine user-provided signal with timeout signal
      const signals: AbortSignal[] = []
      signals.push(AbortSignal.timeout(streamTimeout))
      if (signal) {
        signals.push(signal)
      }
      const combinedSignal = signals.length > 1 ? AbortSignal.any(signals) : signals[0]

      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content,
          images: images || [],
          videos: videos || [],
          audios: audios || [],
          stream: true,
          ...(Object.keys(chatOptions).length > 0 ? { options: chatOptions } : {}),
        }),
        signal: combinedSignal,
      })

      if (!response.ok) {
        const error = new Error(`API error: ${response.status}`) as Error & { status?: number }
        error.status = response.status
        throw error
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            // Support both camelCase (our backend) and snake_case (OpenAI) field names
            if (data.reasoningContent || data.reasoning_content) {
              yield { type: 'reasoning', reasoningContent: data.reasoningContent || data.reasoning_content }
            } else {
              yield data
            }
          } catch (e) {
            // Skip invalid JSON lines in SSE stream
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // AbortError: client intentionally stopped generation, exit gracefully
        return
      }
      // Re-throw with type info for timeout vs other errors
      if ((error as Error).name === 'TimeoutError') {
        const timeoutError = new Error('请求超时') as Error & { code: string }
        timeoutError.code = 'TIMEOUT'
        throw timeoutError
      }
      throw error
    } finally {
      if (reader) {
        reader.releaseLock()
      }
    }
  }

  /**
   * Send message (non-streaming)
   */
  async function sendMessage(
    sessionId: string,
    content: string,
    images?: string[],
    videos?: string[],
    audios?: string[]
  ): Promise<Message> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content,
          images: images || [],
          videos: videos || [],
          audios: audios || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return result.data
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get topics
   */
  async function getTopics(): Promise<Topic[]> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/sessions`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return result.data.sessions
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get topic messages
   */
  async function getTopicMessages(topicId: string): Promise<Message[]> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/sessions/${topicId}/messages`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return result.data.messages
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create topic
   */
  async function createTopic(title?: string): Promise<Topic> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return {
        topicId: result.data.topicId,
        title: result.data.title,
        createdAt: result.data.createdAt,
        updatedAt: result.data.createdAt,
        messageCount: 0,
        unreadCount: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete topic
   */
  async function deleteTopic(topicId: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/sessions/${topicId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update topic title
   */
  async function updateTopicTitle(topicId: string, title: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl}/sessions/${topicId}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Upload images
   */
  async function uploadImages(files: File[]): Promise<string[]> {
    isLoading.value = true
    error.value = null

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(`${baseUrl}/upload/images`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return result.data.urls
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading,
    error,

    // Methods
    streamChat,
    sendMessage,
    getTopics,
    getTopicMessages,
    createTopic,
    deleteTopic,
    updateTopicTitle,
    uploadImages,
  }
}

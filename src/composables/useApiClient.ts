/**
 * API client composable for connecting to backend
 */
import { ref } from 'vue'
import type { Message, Topic } from '@/types'

export interface ApiClientOptions {
  baseUrl: string
}

export function useApiClient(options: ApiClientOptions) {
  const { baseUrl } = options
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Create streaming response generator
   */
  async function* streamChat(
    topicId: string,
    content: string,
    images?: string[],
    videos?: string[],
    audios?: string[]
  ): AsyncGenerator<{ type: string; messageId?: string; content?: string; fullContent?: string }> {
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicId,
        content,
        images: images || [],
        videos: videos || [],
        audios: audios || [],
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
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
            yield data
          } catch (e) {
            // Skip invalid JSON lines in SSE stream
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Send message (non-streaming)
   */
  async function sendMessage(
    topicId: string,
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
          topicId,
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
      const response = await fetch(`${baseUrl}/topics`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || 'API error')
      }

      return result.data.topics
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
      const response = await fetch(`${baseUrl}/topics/${topicId}/messages`)

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
      const response = await fetch(`${baseUrl}/topics`, {
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
      const response = await fetch(`${baseUrl}/topics/${topicId}`, {
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
    uploadImages,
  }
}

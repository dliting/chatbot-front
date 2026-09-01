/**
 * API client composable for connecting to backend
 */
import type { Message, Topic, Attachment, StreamEvent } from '@/types'
import type {
  BackendSession,
  BackendMessage,
  BackendCreateSessionResponse,
  BackendSendMessageResponse,
} from '@/types/api'
import {
  mapSession,
  mapMessage,
  mapCreateSessionResponse,
  mapSendMessageResponse,
} from '@/utils/mappers'

export interface ApiClientOptions {
  baseUrl: string
  streamEnabled?: boolean
  streamTimeout?: number
}

export function useApiClient(options: ApiClientOptions) {
  const { baseUrl, streamTimeout = 120000 } = options

  /**
   * Create streaming response generator
   */
  async function* streamChat(
    topicId: string,
    content: string,
    attachments?: Attachment[],
    options?: { thinking?: { enabled?: boolean }; signal?: AbortSignal }
  ): AsyncGenerator<StreamEvent> {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    try {
      const { signal, ...chatOptions } =
        options ?? ({} as { signal?: AbortSignal; thinking?: { enabled?: boolean } })

      // Combine user-provided signal with timeout signal
      const signals: AbortSignal[] = []
      signals.push(AbortSignal.timeout(streamTimeout))
      if (signal) {
        signals.push(signal)
      }
      const combinedSignal = signals.length > 1 ? AbortSignal.any(signals) : signals[0]

      // Convert attachments to separate arrays for backend compatibility
      const images = attachments?.filter((a) => a.type === 'image').map((a) => a.url) || []
      const videos = attachments?.filter((a) => a.type === 'video').map((a) => a.url) || []
      const audios = attachments?.filter((a) => a.type === 'audio').map((a) => a.url) || []

      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: topicId,
          content,
          images,
          videos,
          audios,
          stream: true,
          ...(Object.keys(chatOptions).length > 0 ? { options: chatOptions } : {}),
        }),
        signal: combinedSignal,
      })

      if (!response.ok) {
        const err = new Error(`API error: ${response.status}`) as Error & { status?: number }
        err.status = response.status
        throw err
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
            const reasoning = data.reasoningContent ?? data.reasoning_content
            const content = data.content ?? data.delta?.content
            if (reasoning) {
              yield { type: 'reasoning', reasoningContent: reasoning }
            }
            if (content) {
              yield { type: 'token', content }
            }
            if (!reasoning && !content && data.type) {
              yield data
            }
          } catch {
            // Skip invalid JSON lines in SSE stream
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return
      }
      if ((err as Error).name === 'TimeoutError') {
        const timeoutError = new Error('Request timeout') as Error & { code: string }
        timeoutError.code = 'TIMEOUT'
        throw timeoutError
      }
      throw err
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
    topicId: string,
    content: string,
    attachments?: Attachment[]
  ): Promise<Message> {
    const images = attachments?.filter((a) => a.type === 'image').map((a) => a.url) || []
    const videos = attachments?.filter((a) => a.type === 'video').map((a) => a.url) || []
    const audios = attachments?.filter((a) => a.type === 'audio').map((a) => a.url) || []

    const response = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: topicId, content, images, videos, audios }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()
    if (result.code !== 0) throw new Error(result.message || 'API error')

    return mapSendMessageResponse(result.data as BackendSendMessageResponse, topicId)
  }

  /**
   * Get topics
   */
  async function getTopics(): Promise<Topic[]> {
    const response = await fetch(`${baseUrl}/sessions`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()
    if (result.code !== 0) throw new Error(result.message || 'API error')

    return (result.data.sessions as BackendSession[]).map(mapSession)
  }

  /**
   * Get topic messages
   */
  async function getTopicMessages(topicId: string): Promise<Message[]> {
    const response = await fetch(`${baseUrl}/sessions/${topicId}/messages`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()
    if (result.code !== 0) throw new Error(result.message || 'API error')

    return (result.data.messages as BackendMessage[]).map((m) => mapMessage(m, topicId))
  }

  /**
   * Create topic
   */
  async function createTopic(title?: string): Promise<Topic> {
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()
    if (result.code !== 0) throw new Error(result.message || 'API error')

    return mapCreateSessionResponse(result.data as BackendCreateSessionResponse)
  }

  /**
   * Delete topic
   */
  async function deleteTopic(topicId: string): Promise<void> {
    const response = await fetch(`${baseUrl}/sessions/${topicId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  }

  /**
   * Update topic title
   */
  async function updateTopicTitle(topicId: string, title: string): Promise<void> {
    const response = await fetch(`${baseUrl}/sessions/${topicId}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  }

  /**
   * Upload images
   */
  async function uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await fetch(`${baseUrl}/upload/images`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()
    if (result.code !== 0) throw new Error(result.message || 'API error')

    return result.data.urls
  }

  /**
   * Delete message
   */
  async function deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${baseUrl}/messages/${messageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  }

  return {
    // Methods
    streamChat,
    sendMessage,
    getTopics,
    getTopicMessages,
    createTopic,
    deleteTopic,
    updateTopicTitle,
    uploadImages,
    deleteMessage,
  }
}

/**
 * Composable for message management
 */
import { ref, computed } from 'vue'
import type { Message } from '@/types'
import type { SendMessageData } from '@/types'
import { createMessage, extractSessionTitle } from '@/utils/message'

export interface UseMessagesOptions {
  onSendMessage?: (data: SendMessageData) => Promise<void>
  onMessageSuccess?: (message: Message) => void
  onMessageError?: (error: Error, message: Message) => void
  streamResponse?: (content: string) => AsyncGenerator<Message, void, unknown>
}

export function useMessages(options: UseMessagesOptions = {}) {
  const {
    onSendMessage,
    onMessageSuccess,
    onMessageError,
    streamResponse,
  } = options

  const messages = ref<Message[]>([])
  const isSending = ref(false)
  const currentStreamingMessage = ref<Message | null>(null)

  /**
   * Send a text message
   */
  const sendTextMessage = async (content: string, sessionId: string) => {
    if (!content.trim() || isSending.value) return

    isSending.value = true

    // Create user message
    const userMessage = createMessage('user', content, sessionId)
    messages.value.push(userMessage)

    try {
      // Call send handler
      await onSendMessage?.({
        type: 'text',
        content,
      })

      // Update status to sent
      userMessage.status = 'sent'

      // Get AI response
      await getAIResponse(content, sessionId, [])
    } catch (error) {
      userMessage.status = 'error'
      onMessageError?.(error as Error, userMessage)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Send a message with images
   */
  const sendImageMessage = async (content: string, images: string[], sessionId: string) => {
    if (images.length === 0 || isSending.value) return

    isSending.value = true

    // Create user message with images
    const userMessage = createMessage('user', content, sessionId, {
      type: content ? 'mixed' : 'image',
      images,
    })
    messages.value.push(userMessage)

    try {
      // Call send handler
      await onSendMessage?.({
        type: 'image',
        content,
        images,
      })

      // Update status to sent
      userMessage.status = 'sent'

      // Get AI response
      await getAIResponse(content || '[Images sent]', sessionId, [], [])
    } catch (error) {
      userMessage.status = 'error'
      onMessageError?.(error as Error, userMessage)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Send a message with videos
   */
  const sendVideoMessage = async (
    content: string,
    videos: string[],
    sessionId: string,
    images?: string[],
    audios?: string[]
  ) => {
    if (videos.length === 0 || isSending.value) return

    isSending.value = true

    // Create user message with videos
    const userMessage = createMessage('user', content, sessionId, {
      type: 'video',
      videos,
      images,
      audios,
    })
    messages.value.push(userMessage)

    try {
      // Call send handler
      await onSendMessage?.({
        type: 'video',
        content,
        videos,
        images,
        audios,
      })

      // Update status to sent
      userMessage.status = 'sent'

      // Get AI response
      await getAIResponse(content || '[Videos sent]', sessionId, images || [], videos)
    } catch (error) {
      userMessage.status = 'error'
      onMessageError?.(error as Error, userMessage)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Send a message with audios
   */
  const sendAudioMessage = async (
    content: string,
    audios: string[],
    sessionId: string,
    images?: string[],
    videos?: string[]
  ) => {
    if (audios.length === 0 || isSending.value) return

    isSending.value = true

    // Create user message with audios
    const userMessage = createMessage('user', content, sessionId, {
      type: 'audio',
      audios,
      images,
      videos,
    })
    messages.value.push(userMessage)

    try {
      // Call send handler
      await onSendMessage?.({
        type: 'audio',
        content,
        audios,
        images,
        videos,
      })

      // Update status to sent
      userMessage.status = 'sent'

      // Get AI response
      await getAIResponse(content || '[Audios sent]', sessionId, images || [], videos || [], audios)
    } catch (error) {
      userMessage.status = 'error'
      onMessageError?.(error as Error, userMessage)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Get AI response (streaming or non-streaming)
   */
  const getAIResponse = async (
    userContent: string,
    sessionId: string,
    _images: string[],
    _videos: string[] = [],
    _audios: string[] = []
  ) => {
    // Create AI message
    const aiMessage = createMessage('assistant', '', sessionId)
    messages.value.push(aiMessage)
    currentStreamingMessage.value = aiMessage

    try {
      if (streamResponse) {
        // Stream response
        for await (const update of streamResponse(userContent)) {
          Object.assign(aiMessage, update)
        }

        aiMessage.status = 'sent'
      } else {
        // Non-streaming response (mock)
        await mockStreamResponse(userContent, aiMessage)
      }

      onMessageSuccess?.(aiMessage)
    } catch (error) {
      aiMessage.status = 'error'
      onMessageError?.(error as Error, aiMessage)
    } finally {
      currentStreamingMessage.value = null
    }
  }

  /**
   * Mock streaming response for development
   */
  const mockStreamResponse = async (userContent: string, message: Message) => {
    const responses = [
      `I understand you're asking about "${userContent}". Let me help you with that.`,
      `That's an interesting question! Based on "${userContent}", here's what I can tell you...`,
      `Thanks for your message about "${userContent}". I'm processing your request.`,
      `I see you mentioned "${userContent}". Let me provide a helpful response.`,
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    // Simulate streaming
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30))
      message.content = response.substring(0, i + 1)
    }

    message.status = 'sent'
  }

  /**
   * Resend a message
   */
  const resendMessage = async (message: Message) => {
    if (message.role !== 'user') return

    // Find and remove the original message and any responses after it
    const index = messages.value.findIndex(m => m.messageId === message.messageId)
    if (index === -1) return

    const hasImages = message.images && message.images.length > 0
    const hasVideos = message.videos && message.videos.length > 0
    const hasAudios = message.audios && message.audios.length > 0

    // Remove messages
    messages.value = messages.value.slice(0, index)

    // Resend based on message type
    if (hasVideos) {
      await sendVideoMessage(
        message.content,
        message.videos || [],
        message.sessionId,
        message.images,
        message.audios
      )
    } else if (hasAudios) {
      await sendAudioMessage(
        message.content,
        message.audios || [],
        message.sessionId,
        message.images,
        message.videos
      )
    } else if (hasImages) {
      await sendImageMessage(message.content, message.images || [], message.sessionId)
    } else {
      await sendTextMessage(message.content, message.sessionId)
    }
  }

  /**
   * Delete a message
   */
  const deleteMessage = (messageId: string) => {
    const index = messages.value.findIndex(m => m.messageId === messageId)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  /**
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = []
  }

  /**
   * Get session title from messages
   */
  const getSessionTitle = (): string => {
    return extractSessionTitle(messages.value)
  }

  // Computed
  const messageCount = computed(() => messages.value.length)
  const lastMessage = computed(() => messages.value[messages.value.length - 1])

  return {
    // State
    messages,
    isSending,
    currentStreamingMessage,

    // Computed
    messageCount,
    lastMessage,

    // Methods
    sendTextMessage,
    sendImageMessage,
    sendVideoMessage,
    sendAudioMessage,
    resendMessage,
    deleteMessage,
    clearMessages,
    getSessionTitle,
  }
}

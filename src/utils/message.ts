/**
 * Message utility functions
 */
import type { Message, MessageType, MessageRole, Attachment, AttachmentType } from '@/types'
import { generateId } from './helpers'
import { TOPIC_DEFAULTS } from '@/constants'

/**
 * Derive message type from content and attachments.
 * Returns the single attachment type if all attachments share the same type,
 * 'mixed' if there are multiple types, or 'text' if there are no attachments.
 */
export function deriveMessageType(data: {
  content: string
  attachments?: Attachment[]
}): MessageType {
  if (!data.attachments?.length) return 'text'
  const types = new Set(data.attachments.map((a) => a.type))
  if (types.size === 1) return types.values().next().value as MessageType
  return 'mixed'
}

/**
 * Get attachments from a message filtered by type.
 */
export function getAttachmentsByType(message: Message, type: AttachmentType): Attachment[] {
  return message.attachments?.filter((a) => a.type === type) ?? []
}

/**
 * Create a new message object
 */
export function createMessage(
  role: MessageRole,
  content: string,
  topicId: string,
  options: {
    type?: MessageType
    attachments?: Attachment[]
    metadata?: Record<string, unknown>
  } = {}
): Message {
  const { type, attachments, metadata } = options

  // Determine message type based on content and attachments
  const messageType = type || deriveMessageType({ content, attachments })

  return {
    messageId: generateId('msg'),
    topicId,
    role,
    type: messageType,
    content,
    attachments,
    timestamp: Date.now(),
    status: role === 'user' ? 'sending' : 'loading',
    metadata,
  }
}

/**
 * Update message status
 */
export function updateMessageStatus(message: Message, status: Message['status']): Message {
  return { ...message, status }
}

/**
 * Update message content (for streaming)
 */
export function updateMessageContent(message: Message, content: string): Message {
  return { ...message, content }
}

/**
 * Check if message is from user
 */
export function isUserMessage(message: Message): boolean {
  return message.role === 'user'
}

/**
 * Check if message is from assistant
 */
export function isAssistantMessage(message: Message): boolean {
  return message.role === 'assistant'
}

/**
 * Check if message has images
 */
export function hasImages(message: Message): boolean {
  return message.type === 'image' || message.type === 'mixed'
}

/**
 * Get message display text
 */
export function getMessageText(message: Message): string {
  if (message.type === 'image') {
    const imageCount = getAttachmentsByType(message, 'image').length
    return imageCount === 1 ? 'Sent an image' : `Sent ${imageCount} images`
  }
  return message.content
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>()

  for (const message of messages) {
    const date = new Date(message.timestamp)
    const dateKey = date.toLocaleDateString()

    const existing = groups.get(dateKey)
    if (existing) {
      existing.push(message)
    } else {
      groups.set(dateKey, [message])
    }
  }

  return groups
}

/**
 * Get message preview text
 */
export function getMessagePreview(message: Message, maxLength = 50): string {
  const text = getMessageText(message)

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}

/**
 * Extract topic title from first AI message
 */
export function extractTopicTitle(messages: Message[]): string {
  const firstAIMessage = messages.find((m) => m.role === 'assistant')

  if (!firstAIMessage || !firstAIMessage.content) {
    return TOPIC_DEFAULTS.TITLE
  }

  // Get first line or up to 30 characters
  const firstLine = firstAIMessage.content.split('\n')[0]
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine
}

/**
 * Filter messages by topic
 */
export function filterMessagesByTopic(messages: Message[], topicId: string): Message[] {
  return messages.filter((m) => m.topicId === topicId)
}

/**
 * Sort messages by timestamp
 */
export function sortMessagesByTimestamp(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Get last message from a topic
 */
export function getLastMessage(messages: Message[], topicId: string): Message | undefined {
  const topicMessages = filterMessagesByTopic(messages, topicId)
  return sortMessagesByTimestamp(topicMessages)[topicMessages.length - 1]
}

/**
 * Calculate message statistics
 */
export interface MessageStats {
  total: number
  user: number
  assistant: number
  withImages: number
  totalImages: number
}

export function getMessageStats(messages: Message[]): MessageStats {
  return messages.reduce(
    (stats, message) => {
      stats.total++
      if (message.role === 'user') stats.user++
      if (message.role === 'assistant') stats.assistant++
      if (hasImages(message)) {
        stats.withImages++
        stats.totalImages += getAttachmentsByType(message, 'image').length
      }
      return stats
    },
    { total: 0, user: 0, assistant: 0, withImages: 0, totalImages: 0 }
  )
}

/**
 * Truncate message for display
 */
export function truncateMessage(message: Message, maxLength = 100): string {
  const text = getMessageText(message)

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}

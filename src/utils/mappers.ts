/**
 * Pure mapping functions from backend API types to frontend domain types.
 * All backend → frontend field conversions are centralized here.
 */
import type { BackendSession, BackendMessage, BackendCreateSessionResponse, BackendSendMessageResponse } from '@/types/api'
import type { Topic, Message, Attachment } from '@/types'

/** Map a backend session to a frontend Topic */
export function mapSession(s: BackendSession): Topic {
  return {
    topicId: s.sessionId,
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: s.messageCount ?? 0,
    unreadCount: s.unreadCount ?? 0,
  }
}

/** Convert backend media arrays to unified Attachment[] */
function mapAttachments(raw: BackendMessage): Attachment[] {
  const attachments: Attachment[] = []

  if (Array.isArray(raw.images)) {
    for (const url of raw.images) {
      attachments.push({ name: '', url, type: 'image' })
    }
  }
  if (Array.isArray(raw.videos)) {
    for (const url of raw.videos) {
      attachments.push({ name: '', url, type: 'video' })
    }
  }
  if (Array.isArray(raw.audios)) {
    for (const url of raw.audios) {
      attachments.push({ name: '', url, type: 'audio' })
    }
  }
  if (Array.isArray(raw.documents)) {
    for (const d of raw.documents) {
      attachments.push({ name: d.name, url: d.url, type: 'document', size: d.size })
    }
  }

  return attachments
}

/** Map a backend message to a frontend Message */
export function mapMessage(raw: BackendMessage, fallbackTopicId: string): Message {
  const attachments = mapAttachments(raw)
  const hasAttachments = attachments.length > 0

  return {
    messageId: raw.messageId,
    topicId: raw.sessionId || fallbackTopicId,
    role: raw.role as Message['role'],
    type: (raw.type as Message['type']) ?? 'text',
    content: raw.content,
    timestamp: raw.timestamp,
    status: (raw.status as Message['status']) ?? 'sent',
    attachments: hasAttachments ? attachments : [],
    thinkingContent: raw.thinkingContent,
    thinkingTime: raw.thinkingTime,
    errorMessage: raw.errorMessage,
    metadata: raw.metadata,
  }
}

/** Map a backend create-session response to a frontend Topic */
export function mapCreateSessionResponse(raw: BackendCreateSessionResponse): Topic {
  return {
    topicId: raw.sessionId,
    title: raw.title,
    createdAt: raw.createdAt,
    updatedAt: raw.createdAt,
    messageCount: 0,
    unreadCount: 0,
  }
}

/** Map a backend send-message response to a frontend Message */
export function mapSendMessageResponse(raw: BackendSendMessageResponse, fallbackTopicId: string): Message {
  return {
    messageId: raw.messageId,
    topicId: raw.sessionId || fallbackTopicId,
    role: raw.role as Message['role'],
    type: 'text',
    content: raw.content,
    timestamp: raw.timestamp,
    status: 'sent',
    attachments: [],
  }
}

/**
 * Backend API response types
 * These represent the raw data shapes returned by the backend server,
 * before mapping to frontend domain types (Topic, Message).
 */
export interface BackendSession {
  sessionId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount?: number
  unreadCount?: number
}

export interface BackendMessage {
  messageId: string
  sessionId: string
  role: string
  type?: string
  content: string
  timestamp: number
  status?: string

  // Thinking/reasoning fields
  thinkingContent?: string
  thinkingTime?: number
  reasoningContent?: string
  reasoning_time?: number

  // Media fields (backend uses separate arrays per type)
  images?: string[]
  videos?: string[]
  audios?: string[]
  documents?: Array<{ name: string; url: string; size?: number }>

  // Error field
  errorMessage?: string

  // Optional metadata
  metadata?: Record<string, unknown>
}

export interface BackendCreateSessionResponse {
  sessionId: string
  title: string
  createdAt: number
}

export interface BackendSendMessageResponse {
  messageId: string
  sessionId: string
  role: string
  content: string
  timestamp: number
}

export interface BackendApiResponse<T = unknown> {
  code: number
  message?: string
  data?: T
}

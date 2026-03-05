/**
 * API Response type
 */
export interface ApiResponse<T = any> {
  code: number
  message?: string
  data?: T
}

/**
 * Chat message
 */
export interface Message {
  messageId: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  type?: 'text' | 'image' | 'mixed'
  content: string
  images?: string[]
  timestamp: number
  status?: 'sending' | 'sent' | 'error'
}

/**
 * Session
 */
export interface Session {
  sessionId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

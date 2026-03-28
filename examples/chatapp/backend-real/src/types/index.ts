export interface Session {
  sessionId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

export interface Message {
  messageId: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  timestamp: number
}

export interface ChatRequest {
  sessionId: string
  content: string
  images?: string[]
  stream?: boolean
}

export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data?: T
}

export interface ChatMessage {
  type: 'start' | 'token' | 'reasoning' | 'end'
  messageId?: string
  content?: string
  fullContent?: string
  reasoningContent?: string
}

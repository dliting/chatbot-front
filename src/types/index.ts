/**
 * Core type definitions for AI Chatbot
 */

// Message Types
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'image' | 'mixed'
export type MessageStatus = 'sending' | 'sent' | 'error' | 'loading'

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  type: MessageType
  content: string
  images?: string[]
  timestamp: number
  status: MessageStatus
  metadata?: Record<string, unknown>
}

// Session Types
export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

// Position Types
export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type PanelMode = 'sidebar' | 'dialog' | 'fullscreen' | 'auto'
export type ChatMode = 'extended' | 'compact' | 'floating' | 'fullscreen'
export type Theme = 'light' | 'dark'
export type Locale = 'zh-CN' | 'en-US'

// Point coordinates
export interface Point {
  x: number
  y: number
}

// Size dimensions
export interface Size {
  width: number
  height: number
}

// Send message data
export interface SendMessageData {
  type: 'text' | 'image'
  content: string
  images?: string[]
}

// Message success data
export interface MessageSuccessData {
  sessionId: string
  messageId: string
  message: string
}

// Panel toggle data
export interface PanelToggleData {
  isOpen: boolean
  mode: PanelMode
}

// Stream event types
export type StreamEventType = 'start' | 'token' | 'end' | 'error'

export interface StreamEvent {
  type: StreamEventType
  messageId?: string
  content?: string
  fullContent?: string
  error?: string
}

// API Response
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

// Upload result
export interface UploadResult {
  urls: string[]
  errors?: Array<{ file: string; error: string }>
}

// Image file with preview
export interface ImageFile {
  file: File
  url: string
  status: 'uploading' | 'success' | 'error'
  progress: number
}

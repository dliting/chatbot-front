/**
 * Core type definitions for AI Chatbot
 */

// Message Types
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'mixed'
export type MessageStatus = 'sending' | 'sent' | 'error' | 'loading'

export interface Message {
  messageId: string
  sessionId: string
  role: MessageRole
  type: MessageType
  content: string
  images?: string[]
  videos?: string[]
  audios?: string[]
  timestamp: number
  status: MessageStatus
  metadata?: Record<string, unknown>
}

// Session Types
export interface Session {
  sessionId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  unreadCount: number
}

// Position Types
export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type PanelMode = 'sidebar' | 'dialog' | 'fullscreen' | 'auto'
export type ChatMode = 'extended' | 'floating' | 'fullscreen' | 'single' | 'dual'
export type Theme = 'light' | 'dark' | 'system'
export type Locale = 'zh-CN' | 'en-US'

// Interaction Mode Types (new dual-dimension architecture)
export type InteractionMode = 'floating' | 'extended' | 'sidebar'
export type Layout = 'dual' | 'single'

// Layout auto-derivation mapping
export const modeToLayoutMap: Record<InteractionMode, Layout> = {
  'floating': 'single',
  'extended': 'dual',
  'sidebar': 'single'
}

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
  type: 'text' | 'image' | 'video' | 'audio'
  content: string
  images?: string[]
  videos?: string[]
  audios?: string[]
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

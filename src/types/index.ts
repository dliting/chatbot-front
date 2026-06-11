/**
 * Core type definitions for AI Chatbot
 */
import type { ComputedRef } from 'vue'

// Message Types
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'mixed' | 'document'
export type MessageStatus = 'sending' | 'sent' | 'error' | 'loading' | 'stopped'

// Attachment types
export type AttachmentType = 'image' | 'video' | 'audio' | 'document'

// Unified attachment interface
export interface Attachment {
  name: string
  url: string
  type: AttachmentType
  size?: number
  mimeType?: string
}

export interface Message {
  messageId: string
  topicId: string
  role: MessageRole
  type: MessageType
  content: string
  attachments?: Attachment[]
  timestamp: number
  status: MessageStatus
  metadata?: Record<string, unknown>
  thinkingContent?: string    // Thinking/reasoning process text
  thinkingTime?: number       // Thinking elapsed time in ms
  errorMessage?: string       // User-facing error description when status is 'error' or 'stopped'
}

// Topic Types
export interface Topic {
  topicId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  unreadCount: number
}

// Position Types
export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type PanelMode = 'sidebar' | 'dialog' | 'fullscreen' | 'auto'
export type Theme = 'light' | 'dark' | 'system'
export type Locale = 'zh-CN' | 'en-US'

// Interaction Mode Types (dual-dimension architecture)
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

// Panel toggle data
export interface PanelToggleData {
  isOpen: boolean
  mode: PanelMode
}

// Stream event types
export type StreamEventType = 'start' | 'token' | 'reasoning' | 'end' | 'error'

export interface StreamEvent {
  type: StreamEventType
  messageId?: string
  content?: string
  fullContent?: string
  reasoningContent?: string   // Thinking content fragment (for reasoning events)
  thinkingTime?: number       // Cumulative thinking time in ms (for reasoning events)
  error?: string
}

// API Response
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

// Action handler interfaces for provide/inject
// Architecture: inject-primary pattern — internal actions use inject, emits are external-only
// See docs/design/component-communication-architecture.md
export interface ChatActionHandlers {
  sendMessage: (data: { content: string; attachments?: Attachment[] }) => void
  refreshMessage: (message: Message) => void
  deleteMessage: (message: Message) => void
  editMessage: (message: Message) => void
  stopGenerating: () => void
  isGenerating: { value: boolean }
  isThinkingActive: { value: boolean }
}

export interface TopicActionHandlers {
  createNewTopic: () => void
  switchToTopic: (topicId: string) => void
  removeTopic: (topicId: string) => void
  removeTopics: (topicIds: string[]) => void
  renameTopic: (topicId: string, title: string) => void
}

export interface UIActionHandlers {
  toggleTheme: () => void
  setThinkingEnabled: (enabled: boolean) => void
  thinkingEnabled: { value: boolean }
  /** Switch to chat view (only effective in single-layout modes: floating, sidebar) */
  showChatView: () => void
  /** Switch to topics view (only effective in single-layout modes: floating, sidebar) */
  showTopicsView: () => void
}

// State interface for provide/inject
// Components inject this to access reactive state without prop drilling
export interface ChatState {
  messages: ComputedRef<Message[]>
  topics: ComputedRef<Topic[]>
  currentTopicId: ComputedRef<string>
  isStreaming: ComputedRef<boolean>
  streamingMessageId: ComputedRef<string | null>
  enableThinking: boolean
  thinkingEnabled: { value: boolean }
  isThinking: { value: boolean }
  enableVoiceInput: boolean
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

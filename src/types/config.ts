/**
 * Configuration types for AI Chatbot
 */
import type { Position, Theme, Locale } from './index'

import type { PanelMode } from './index'

export interface ChatbotConfig {
  // Layout configuration
  position?: Position
  panelWidth?: number
  panelMinWidth?: number
  panelMaxWidth?: number
  defaultExpanded?: boolean
  panelMode?: PanelMode // Force specific panel mode ('auto' = based on screen size)

  // Feature toggles
  enableImageUpload?: boolean
  enableSessionManager?: boolean
  enableVoiceInput?: boolean
  enableCopyMessage?: boolean
  enableDeleteMessage?: boolean
  enableResend?: boolean
  enableClearAll?: boolean

  // Upload limits
  maxImageCount?: number
  maxImageSize?: number // in bytes
  allowedImageTypes?: string[]

  // Style configuration
  theme?: Theme
  primaryColor?: string
  customStyles?: Record<string, string>

  // API configuration
  apiBaseUrl?: string
  streamEnabled?: boolean
  streamTimeout?: number // in milliseconds

  // Iframe mode
  iframeMode?: boolean
  allowedOrigins?: string[]

  // Internationalization
  locale?: Locale

  // Messages configuration
  maxMessagesInMemory?: number
  autoScroll?: boolean

  // UI Labels (can be customized)
  labels?: Partial<ChatbotLabels>
}

export interface ChatbotLabels {
  title: string
  placeholder: string
  send: string
  newChat: string
  clearAll: string
  delete: string
  copy: string
  resend: string
  uploading: string
  uploadFailed: string
  retry: string
  close: string
  expand: string
  collapse: string
}

export const defaultChatbotLabels: ChatbotLabels = {
  title: 'AI Assistant',
  placeholder: 'Type your message...',
  send: 'Send',
  newChat: 'New Chat',
  clearAll: 'Clear All',
  delete: 'Delete',
  copy: 'Copy',
  resend: 'Resend',
  uploading: 'Uploading...',
  uploadFailed: 'Upload Failed',
  retry: 'Retry',
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse',
}

export const defaultChatbotConfig: Required<ChatbotConfig> = {
  // Layout
  position: 'bottom-right',
  panelWidth: 400,
  panelMinWidth: 320,
  panelMaxWidth: 600,
  defaultExpanded: false,
  panelMode: 'auto', // Auto-detect based on screen size

  // Features
  enableImageUpload: true,
  enableSessionManager: true,
  enableVoiceInput: false,
  enableCopyMessage: true,
  enableDeleteMessage: true,
  enableResend: true,
  enableClearAll: true,

  // Upload limits
  maxImageCount: 4,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Style
  theme: 'light',
  primaryColor: '#409eff',
  customStyles: {},

  // API
  apiBaseUrl: '/api',
  streamEnabled: true,
  streamTimeout: 60000,

  // Iframe
  iframeMode: false,
  allowedOrigins: [],

  // i18n
  locale: 'en-US',

  // Messages
  maxMessagesInMemory: 1000,
  autoScroll: true,

  // Labels
  labels: defaultChatbotLabels,
}

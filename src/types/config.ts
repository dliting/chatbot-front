/**
 * Configuration types for AI Chatbot
 */
import type { Position, Theme, Locale } from './index'

import type { PanelMode } from './index'

export interface ChatbotConfig {
  // Chat mode (determines layout and behavior)
  chatMode?: 'extended' | 'compact' | 'floating'

  // Layout configuration
  position?: Position
  panelWidth?: number
  panelHeight?: number
  panelMinWidth?: number
  panelMaxWidth?: number
  defaultExpanded?: boolean
  panelMode?: PanelMode // Force specific panel mode ('auto' = based on screen size)

  // Floating panel options
  draggable?: boolean // Enable drag for floating panel (default: true)
  resizable?: boolean // Enable resize for floating panel (default: true)
  minWidth?: number // Minimum width for floating panel (default: 300)
  minHeight?: number // Minimum height for floating panel (default: 400)
  rememberPosition?: boolean // Remember position and size (default: true)

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
  history: string
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
  history: 'History',
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
  // Chat mode
  chatMode: 'floating',

  // Layout
  position: 'bottom-right',
  panelWidth: 400,
  panelHeight: 600,
  panelMinWidth: 320,
  panelMaxWidth: 600,
  defaultExpanded: false,
  panelMode: 'auto', // Auto-detect based on screen size

  // Floating panel options
  draggable: true,
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  rememberPosition: true,

  // Features
  enableImageUpload: true,
  enableSessionManager: true,
  enableVoiceInput: false,
  enableCopyMessage: true,
  enableDeleteMessage: true,
  enableResend: true,
  enableClearAll: true,

  // Upload limits
  maxImageCount: 8,
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

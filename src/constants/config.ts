/**
 * Default configuration for AI Chatbot
 */
import type { ChatbotConfig, ChatbotCallbacks } from '@/types/config'
import { getDefaultLabels } from '@/i18n/labels'

export const defaultChatbotConfig: Required<ChatbotConfig> = {
  // Interaction mode
  mode: 'floating',
  layout: 'single',

  // Layout
  position: 'bottom-right',
  panelWidth: 400,
  panelHeight: 600,
  panelMinWidth: 320,
  panelMaxWidth: 600,
  defaultExpanded: false,
  panelMode: 'auto',

  // Sidebar width
  sidebarWidth: 280,
  sidebarMinWidth: 200,
  sidebarMaxWidth: 500,

  // Floating panel options
  draggable: true,
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  rememberPosition: true,

  // Features
  enableImageUpload: true,
  enableVoiceInput: false,
  enableCopyMessage: true,
  enableDeleteMessage: true,
  enableResend: true,
  enableClearAll: true,

  // Thinking
  enableThinking: false,
  thinkingDefaultEnabled: true,
  thinkingAutoCollapse: true,

  // Upload limits
  maxImageCount: 8,
  maxImageSize: 10 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Style
  theme: 'light',
  primaryColor: '#409eff',
  customStyles: {},

  // API
  apiBaseUrl: '/api',
  streamEnabled: true,
  streamTimeout: 120000,

  // Callbacks
  callbacks: {} as ChatbotCallbacks,

  // Iframe
  iframeMode: false,
  allowedOrigins: [],

  // i18n
  locale: 'zh-CN',

  // Messages
  maxMessagesInMemory: 1000,
  autoScroll: true,

  // Labels
  labels: getDefaultLabels('zh-CN'),
}

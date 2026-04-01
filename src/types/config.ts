/**
 * Configuration types for AI Chatbot
 */
import type { Position, Theme, Locale, InteractionMode, Layout } from './index'

import type { PanelMode } from './index'

export interface ChatbotConfig {
  // Interaction mode (new dual-dimension architecture)
  mode?: InteractionMode
  // Layout (auto-derived from mode if not specified)
  layout?: Layout
  // Legacy: Chat mode (for backward compatibility)
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
  enableTopicManager?: boolean
  enableVoiceInput?: boolean
  enableCopyMessage?: boolean
  enableDeleteMessage?: boolean
  enableResend?: boolean
  enableClearAll?: boolean

  // Thinking / Chain-of-Thought
  enableThinking?: boolean
  thinkingDefaultEnabled?: boolean
  thinkingAutoCollapse?: boolean

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
  streamTimeout?: number // Stream response timeout in milliseconds (default: 120000 = 2min)

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
  newTopic: string
  history: string
  clearAll: string
  delete: string
  copy: string
  refresh: string
  resend: string
  uploading: string
  uploadFailed: string
  retry: string
  timeout: string
  networkError: string
  serverError: string
  generationStopped: string
  close: string
  expand: string
  collapse: string
  // Welcome screen labels
  welcomeTitle?: string
  welcomeSubtitle?: string
  // Quick action labels (4 actions)
  quickAction1Title?: string
  quickAction1Desc?: string
  quickAction1Text?: string
  quickAction2Title?: string
  quickAction2Desc?: string
  quickAction2Text?: string
  quickAction3Title?: string
  quickAction3Desc?: string
  quickAction3Text?: string
  quickAction4Title?: string
  quickAction4Desc?: string
  quickAction4Text?: string
  // Copy button labels
  copied?: string
  // Thinking labels
  thinking?: {
    toggle?: string
    thinking?: string
    deeplyThought?: string
    showThinking?: string
    hideThinking?: string
  }
}

export const defaultChatbotLabels: ChatbotLabels = {
  title: 'AI Assistant',
  placeholder: 'Type your message...',
  send: 'Send',
  newTopic: '新话题',
  history: 'History',
  clearAll: 'Clear All',
  delete: 'Delete',
  copy: 'Copy',
  refresh: 'Regenerate',
  resend: 'Resend',
  uploading: 'Uploading...',
  uploadFailed: 'Upload Failed',
  retry: 'Retry',
  timeout: '响应超时，请检查网络或后端服务',
  networkError: '网络连接失败，请检查网络',
  serverError: '服务器错误',
  generationStopped: '已停止生成',
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse',
  // Default welcome screen labels (Chinese as default since original was Chinese)
  welcomeTitle: '智能助手',
  welcomeSubtitle: '有什么可以帮助您的吗？',
  quickAction1Title: '写邮件',
  quickAction1Desc: '帮我撰写邮件',
  quickAction1Text: '帮我写一封邮件',
  quickAction2Title: '总结文章',
  quickAction2Desc: '提取关键信息',
  quickAction2Text: '帮我总结这篇文章',
  quickAction3Title: '翻译',
  quickAction3Desc: '多语言翻译',
  quickAction3Text: '帮我翻译这段文字',
  quickAction4Title: '数据分析',
  quickAction4Desc: '智能分析数据',
  quickAction4Text: '帮我分析数据',
  // Copy button labels
  copied: '已复制',
  // Thinking labels
  thinking: {
    toggle: '思考',
    thinking: '思考中...',
    deeplyThought: '已深度思考 {seconds}s',
    showThinking: '查看思考过程',
    hideThinking: '收起思考过程',
  },
}

export const defaultChatbotConfig: Required<ChatbotConfig> = {
  // Interaction mode
  mode: 'floating',
  layout: 'single',

  // Legacy: Chat mode
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
  enableTopicManager: true,
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
  maxImageSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Style
  theme: 'light',
  primaryColor: '#409eff',
  customStyles: {},

  // API
  apiBaseUrl: '/api',
  streamEnabled: true,
  streamTimeout: 120000, // 2 minutes

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

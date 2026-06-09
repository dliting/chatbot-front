/**
 * Configuration types for AI Chatbot
 */
import type { Position, Theme, Locale, InteractionMode, Layout, PanelMode, Topic, Attachment, StreamEvent, Message, UploadResult } from './index'

/**
 * Parameters for send-related callbacks
 */
export interface SendMessageParams {
  topicId: string
  content: string
  attachments?: Attachment[]
  thinking?: { enabled: boolean }
  signal?: AbortSignal
  /** For edit/regenerate: original message being modified */
  messageId?: string
}

/**
 * Callback interface for host application to control operations.
 * All callbacks are optional. If not provided, the component
 * falls back to apiClient or local-only behavior.
 */
export interface ChatbotCallbacks {
  // ===== Message Operations =====

  /** Send message and get AI response via streaming.
   *  The host MUST return an AsyncGenerator<StreamEvent>. */
  onSendMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Delete a specific message. */
  onDeleteMessage?: (messageId: string, topicId: string) => Promise<void>

  /** Edit a message: replace user message content and get new AI response.
   *  params.messageId is the original message being modified. */
  onEditMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Regenerate AI response for a preceding user message.
   *  params contains the original user message's content and attachments. */
  onRegenerateMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  // ===== Topic Operations =====

  /** Load all topics. Called on mount and after topic create/delete. */
  onLoadTopics?: (signal?: AbortSignal) => Promise<Topic[]>

  /** Load messages for a specific topic. Called on topic switch and mount. */
  onLoadMessages?: (topicId: string, signal?: AbortSignal) => Promise<Message[]>

  /** Create a new topic. Returns the full Topic object. */
  onCreateTopic?: (title?: string) => Promise<Topic>

  /** Switch to a topic. Component calls onLoadMessages after this resolves. */
  onSwitchTopic?: (topicId: string) => Promise<void>

  /** Delete a topic and all its messages. */
  onDeleteTopic?: (topicId: string) => Promise<void>

  /** Update topic title. */
  onUpdateTopicTitle?: (topicId: string, title: string) => Promise<void>

  /** Clear all messages in a topic. */
  onClearMessages?: (topicId: string) => Promise<void>

  // ===== File Operations =====

  /** Upload image files. Returns URLs of uploaded files. */
  onUploadImages?: (files: File[]) => Promise<UploadResult>
}

export interface ChatbotConfig {
  // Interaction mode (new dual-dimension architecture)
  mode?: InteractionMode
  // Layout (auto-derived from mode if not specified)
  layout?: Layout

  // Layout configuration
  position?: Position
  panelWidth?: number
  panelHeight?: number
  panelMinWidth?: number
  panelMaxWidth?: number
  defaultExpanded?: boolean
  panelMode?: PanelMode // Force specific panel mode ('auto' = based on screen size)

  // Sidebar width (extended dual-layout sidebar and sidebar mode)
  sidebarWidth?: number
  sidebarMinWidth?: number
  sidebarMaxWidth?: number

  // Floating panel options
  draggable?: boolean // Enable drag for floating panel (default: true)
  resizable?: boolean // Enable resize for floating panel (default: true)
  minWidth?: number // Minimum width for floating panel (default: 300)
  minHeight?: number // Minimum height for floating panel (default: 400)
  rememberPosition?: boolean // Remember position and size (default: true)

  // Feature toggles
  enableImageUpload?: boolean
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

  /** Callback interface for host application to control operations */
  callbacks?: ChatbotCallbacks

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
  sendFailed: string
  responseFailed: string
  userLabel: string
  assistantLabel: string
  close: string
  expand: string
  collapse: string
  // Dialog & confirmation
  cancel?: string
  confirm?: string
  deleteConfirmTitle?: string
  deleteConfirm?: string
  deleteMessageTitle?: string
  messageDeleted?: string
  // Copy feedback
  noContentToCopy?: string
  copiedToClipboard?: string
  copyFailed?: string
  // Header tooltips
  historyTooltip?: string
  switchToDarkMode?: string
  switchToLightMode?: string
  // Voice
  recording?: string
  // Layout tabs
  topicsTab?: string
  chatTab?: string
  // Topic management
  unnamedTopic?: string
  searchTopics?: string
  rename?: string
  done?: string
  batchSelect?: string
  deleteSelected?: string
  noResults?: string
  noTopics?: string
  noTopicsHint?: string
  deleteTopicConfirmTitle?: string
  deleteTopicConfirmMessage?: string
  batchDeleteTopicConfirmMessage?: string
  selectedCountFormat?: string
  messageCountFormat?: string
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
  // Empty message list
  emptyMessage?: string
  // Thinking labels
  thinking?: {
    toggle?: string
    thinking?: string
    deeplyThought?: string
    showThinking?: string
    hideThinking?: string
  }
}

export const zhCNLabels: ChatbotLabels = {
  title: 'AI 助手',
  placeholder: '输入消息...',
  send: '发送',
  newTopic: '新话题',
  history: '历史',
  clearAll: '清空全部',
  delete: '删除',
  copy: '复制',
  refresh: '重新生成',
  resend: '重发',
  uploading: '上传中...',
  uploadFailed: '上传失败',
  retry: '重试',
  timeout: '响应超时，请检查网络或后端服务',
  networkError: '网络连接失败，请检查网络',
  serverError: '服务器错误',
  generationStopped: '已停止生成',
  sendFailed: '发送失败',
  responseFailed: '响应失败',
  userLabel: '你',
  assistantLabel: 'AI助手',
  close: '关闭',
  expand: '展开',
  collapse: '收起',
  // Dialog & confirmation
  cancel: '取消',
  confirm: '确定',
  deleteConfirmTitle: '删除确认',
  deleteConfirm: '确定要删除这条消息吗？',
  deleteMessageTitle: '删除消息',
  messageDeleted: '消息已删除',
  // Copy feedback
  noContentToCopy: '无内容可复制',
  copiedToClipboard: '已复制到剪贴板',
  copyFailed: '复制失败',
  // Header tooltips
  historyTooltip: '历史话题',
  switchToDarkMode: '切换到深色模式',
  switchToLightMode: '切换到浅色模式',
  // Voice
  recording: '正在录音...',
  // Layout tabs
  topicsTab: '话题',
  chatTab: '聊天',
  // Topic management
  unnamedTopic: '未命名话题',
  searchTopics: '搜索话题...',
  rename: '重命名',
  done: '完成',
  batchSelect: '批量选择',
  deleteSelected: '删除选中',
  noResults: '未找到匹配的话题',
  noTopics: '暂无历史话题',
  noTopicsHint: '点击上方按钮开始新话题',
  deleteTopicConfirmTitle: '删除话题?',
  deleteTopicConfirmMessage: '确定要删除此话题吗?',
  batchDeleteTopicConfirmMessage: '确定要删除选中的话题吗?',
  selectedCountFormat: '已选择 {count} 个',
  messageCountFormat: '{count} 条消息',
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
  copied: '已复制',
  emptyMessage: '开始对话...',
  thinking: {
    toggle: '思考',
    thinking: '思考中...',
    deeplyThought: '已深度思考 {seconds}s',
    showThinking: '查看思考过程',
    hideThinking: '收起思考过程',
  },
}

export const enUSLabels: ChatbotLabels = {
  title: 'AI Assistant',
  placeholder: 'Type your message...',
  send: 'Send',
  newTopic: 'New Topic',
  history: 'History',
  clearAll: 'Clear All',
  delete: 'Delete',
  copy: 'Copy',
  refresh: 'Regenerate',
  resend: 'Resend',
  uploading: 'Uploading...',
  uploadFailed: 'Upload Failed',
  retry: 'Retry',
  timeout: 'Response timeout, check network or backend',
  networkError: 'Network connection failed',
  serverError: 'Server error',
  generationStopped: 'Generation stopped',
  sendFailed: 'Send failed',
  responseFailed: 'Response failed',
  userLabel: 'You',
  assistantLabel: 'AI Assistant',
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse',
  // Dialog & confirmation
  cancel: 'Cancel',
  confirm: 'Confirm',
  deleteConfirmTitle: 'Delete Confirmation',
  deleteConfirm: 'Are you sure you want to delete this message?',
  deleteMessageTitle: 'Delete Message',
  messageDeleted: 'Message deleted',
  // Copy feedback
  noContentToCopy: 'No content to copy',
  copiedToClipboard: 'Copied to clipboard',
  copyFailed: 'Copy failed',
  // Header tooltips
  historyTooltip: 'Topic History',
  switchToDarkMode: 'Switch to dark mode',
  switchToLightMode: 'Switch to light mode',
  // Voice
  recording: 'Recording...',
  // Layout tabs
  topicsTab: 'Topics',
  chatTab: 'Chat',
  // Topic management
  unnamedTopic: 'Unnamed Topic',
  searchTopics: 'Search topics...',
  rename: 'Rename',
  done: 'Done',
  batchSelect: 'Batch Select',
  deleteSelected: 'Delete Selected',
  noResults: 'No matching topics found',
  noTopics: 'No topics yet',
  noTopicsHint: 'Click the button above to start a new topic',
  deleteTopicConfirmTitle: 'Delete Topic?',
  deleteTopicConfirmMessage: 'Are you sure you want to delete this topic?',
  batchDeleteTopicConfirmMessage: 'Are you sure you want to delete the selected topics?',
  selectedCountFormat: '{count} selected',
  messageCountFormat: '{count} messages',
  welcomeTitle: 'AI Assistant',
  welcomeSubtitle: 'How can I help you?',
  quickAction1Title: 'Write Email',
  quickAction1Desc: 'Help me write an email',
  quickAction1Text: 'Help me write an email',
  quickAction2Title: 'Summarize',
  quickAction2Desc: 'Extract key information',
  quickAction2Text: 'Help me summarize this article',
  quickAction3Title: 'Translate',
  quickAction3Desc: 'Multi-language translation',
  quickAction3Text: 'Help me translate this text',
  quickAction4Title: 'Data Analysis',
  quickAction4Desc: 'Smart data analysis',
  quickAction4Text: 'Help me analyze this data',
  copied: 'Copied',
  emptyMessage: 'Start a conversation...',
  thinking: {
    toggle: 'Think',
    thinking: 'Thinking...',
    deeplyThought: 'Thought deeply for {seconds}s',
    showThinking: 'Show thinking process',
    hideThinking: 'Hide thinking process',
  },
}

const localeLabelsMap: Record<Locale, ChatbotLabels> = {
  'zh-CN': zhCNLabels,
  'en-US': enUSLabels,
}

export function getDefaultLabels(locale: Locale = 'zh-CN'): ChatbotLabels {
  return localeLabelsMap[locale] ?? zhCNLabels
}

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
  panelMode: 'auto', // Auto-detect based on screen size

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

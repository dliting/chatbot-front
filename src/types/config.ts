/**
 * Configuration types for AI Chatbot
 */
import type {
  Position,
  Theme,
  Locale,
  InteractionMode,
  Layout,
  PanelMode,
  Topic,
  Attachment,
  StreamEvent,
  Message,
  UploadResult,
} from './index'

/**
 * Parameters for send-related callbacks
 */
export interface SendMessageParams {
  topicId: string
  content: string
  attachments?: Attachment[]
  thinking?: { enabled: boolean }
  signal?: AbortSignal
  /** Extra information from QuickAction.extraInfo. Available in callbacks. */
  extraInfo?: string
  /** For edit/regenerate: original message being modified */
  messageId?: string
}

/**
 * Quick action for welcome screen
 */
export interface QuickAction {
  /** Unique identifier */
  id: string
  /** Display title, e.g. "写邮件" */
  title: string
  /** Optional description, e.g. "帮我撰写邮件" */
  description?: string
  /** Prompt text sent as user message. Supports {{variable}} placeholders. */
  prompt: string
  /**
   * Icon identifier or path.
   * - Built-in name: "write", "analyze", "translate", "code", "search", "chat", "brain", "tool"
   * - Relative path: resolved against quickActionIconBase
   * - Absolute path/URL: used as-is
   * - Empty/undefined: first-letter avatar
   */
  icon?: string
  /**
   * Generic extra information string. Not used by the component internally.
   * Passed to SendMessageParams.extraInfo for host app use in callbacks.
   */
  extraInfo?: string
}

/**
 * Resolver for a prompt variable. Receives the variable name, returns the replacement value.
 */
export type PromptVariableResolver = (variable: string) => string | Promise<string>

/**
 * Configuration for prompt variable substitution
 */
export interface PromptVariableConfig {
  /** Custom variable resolvers. Key is the variable name (without {{ }}). */
  resolvers?: Record<string, PromptVariableResolver>
}

/**
 * Callback interface for host application to control operations.
 * All callbacks are optional. If not provided, the component
 * falls back to apiClient or local-only behavior.
 */
export interface ChatbotCallbacks {
  /** Send message and get AI response via streaming.
   *  The host MUST return an AsyncGenerator<StreamEvent>. */
  onSendMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Delete a specific message. */
  onDeleteMessage?: (messageId: string, topicId: string) => Promise<void>

  /** Edit a message: replace user message content and get new AI response. */
  onEditMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Regenerate AI response for a preceding user message. */
  onRegenerateMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

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

  /** Upload image files. Returns URLs of uploaded files. */
  onUploadImages?: (files: File[]) => Promise<UploadResult>
}

export interface ChatbotConfig {
  // Interaction mode
  mode?: InteractionMode
  layout?: Layout

  // Layout configuration
  position?: Position
  panelWidth?: number
  panelHeight?: number
  panelMinWidth?: number
  panelMaxWidth?: number
  defaultExpanded?: boolean
  panelMode?: PanelMode

  // Sidebar width
  sidebarWidth?: number
  sidebarMinWidth?: number
  sidebarMaxWidth?: number

  // Floating panel options
  draggable?: boolean
  resizable?: boolean
  minWidth?: number
  minHeight?: number
  rememberPosition?: boolean

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
  maxImageSize?: number
  allowedImageTypes?: string[]

  // Style configuration
  theme?: Theme
  primaryColor?: string
  customStyles?: Record<string, string>

  // API configuration
  apiBaseUrl?: string
  streamEnabled?: boolean
  streamTimeout?: number

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

  /** Quick actions list. If not configured, locale-aware defaults are used. */
  quickActions?: QuickAction[]

  /** Base path for resolving relative icon paths in QuickAction.icon */
  quickActionIconBase?: string

  /** Prompt variable substitution configuration */
  promptVariables?: PromptVariableConfig
}

/**
 * UI labels interface for internationalization
 */
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
  cancel?: string
  confirm?: string
  deleteConfirmTitle?: string
  deleteConfirm?: string
  deleteMessageTitle?: string
  messageDeleted?: string
  noContentToCopy?: string
  copiedToClipboard?: string
  copyFailed?: string
  historyTooltip?: string
  switchToDarkMode?: string
  switchToLightMode?: string
  recording?: string
  topicsTab?: string
  chatTab?: string
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
  welcomeTitle?: string
  welcomeSubtitle?: string
  copied?: string
  emptyMessage?: string
  thinking?: {
    toggle?: string
    thinking?: string
    deeplyThought?: string
    showThinking?: string
    hideThinking?: string
  }
}

// Re-export from new locations for backward compatibility
export { getDefaultLabels, zhCNLabels, enUSLabels } from '@/i18n/labels'
export { defaultChatbotConfig } from '@/constants/config'

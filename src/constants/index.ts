/**
 * Constants for the ChatBot component
 */

/**
 * Message types enumeration
 */
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error',
} as const

/**
 * Message status enumeration
 */
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  STREAMING: 'streaming',
} as const

/**
 * Chat panel states
 */
export const CHAT_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  MINIMIZED: 'minimized',
  FULLSCREEN: 'fullscreen',
} as const

/**
 * Event names
 */
export const EVENT_NAMES = {
  // Chat events
  OPEN: 'chat:open',
  CLOSE: 'chat:close',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_ERROR: 'message:error',

  // Session events
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  SESSION_SAVE: 'session:save',

  // Lifecycle events
  MOUNT: 'chat:mount',
  UNMOUNT: 'chat:unmount',
  READY: 'chatbot:ready',

  // Error events
  ERROR: 'chat:error',
  API_ERROR: 'api:error',
  NETWORK_ERROR: 'network:error',
} as const

/**
 * File upload configuration
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  maxFiles: 5,
} as const

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  MESSAGE_IN: 400,
  TYPING_INDICATOR: 1400,
} as const

/**
 * Breakpoint values for responsive design
 */
export const BREAKPOINTS = {
  XS: 320,
  SM: 480,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  SESSION: 'chatbot_session',
  HISTORY: 'chatbot_history',
  SETTINGS: 'chatbot_settings',
  THEME: 'chatbot_theme',
} as const

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  API_ERROR: 'API error. Please try again later.',
  INVALID_RESPONSE: 'Invalid response from server.',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  MESSAGE_TOO_LONG: 'Message exceeds maximum length.',
  SESSION_EXPIRED: 'Session expired. Please refresh.',
} as const

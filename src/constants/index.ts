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
 * Chat panel states
 */
export const CHAT_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  MINIMIZED: 'minimized',
  FULLSCREEN: 'fullscreen',
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
  TOPIC: 'chatbot_topic',
  HISTORY: 'chatbot_history',
  SETTINGS: 'chatbot_settings',
  THEME: 'chatbot_theme',
} as const

/**
 * Topic defaults
 */
export const TOPIC_DEFAULTS = {
  TITLE: 'New Topic',
  STORAGE_KEY: 'chatbot-topics',
} as const

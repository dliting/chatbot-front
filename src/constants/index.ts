/**
 * Constants for the ChatBot component
 */

/**
 * Message roles (aligned with MessageRole type)
 */
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
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
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
} as const

/**
 * Topic defaults
 */
export const TOPIC_DEFAULTS = {
  TITLE: 'New Topic',
  STORAGE_KEY: 'chatbot-topic-list',
} as const

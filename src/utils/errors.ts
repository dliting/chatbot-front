/**
 * Error types for the chatbot component
 */

export type ErrorCategory = 'message' | 'topic' | 'stream' | 'network' | 'config'

export class ChatbotError extends Error {
  readonly category: ErrorCategory
  readonly userMessage: string
  readonly cause?: Error

  constructor(category: ErrorCategory, userMessage: string, cause?: Error) {
    super(userMessage)
    this.name = 'ChatbotError'
    this.category = category
    this.userMessage = userMessage
    this.cause = cause
  }
}

/** Wrap an unknown error as a ChatbotError if it isn't one already */
export function toChatbotError(error: unknown, category: ErrorCategory, userMessage: string): ChatbotError {
  if (error instanceof ChatbotError) return error
  const cause = error instanceof Error ? error : new Error(String(error))
  return new ChatbotError(category, userMessage, cause)
}

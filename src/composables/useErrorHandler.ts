/**
 * Centralized error handling composable
 */
import { ChatbotError, toChatbotError } from '@/utils/errors'
import type { ErrorCategory } from '@/utils/errors'

interface ErrorHandlerOptions {
  emit: (event: string, ...args: unknown[]) => void
}

export function useErrorHandler(options: ErrorHandlerOptions) {
  const handleError = (error: unknown, category: ErrorCategory, userMessage: string): ChatbotError => {
    const chatbotError = toChatbotError(error, category, userMessage)

    // Emit for host application observability
    options.emit('chatbot:error', { error: chatbotError })

    // Log for development
    console.error(`[${category}] ${userMessage}:`, chatbotError.cause ?? chatbotError)

    return chatbotError
  }

  return { handleError }
}

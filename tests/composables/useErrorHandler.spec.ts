/**
 * Unit tests for error handling utilities and composable
 */
import { describe, it, expect, vi } from 'vitest'
import { ChatbotError, toChatbotError } from '@/utils/errors'
import { useErrorHandler } from '@/composables/useErrorHandler'

describe('ChatbotError', () => {
  it('should create error with category and userMessage', () => {
    const error = new ChatbotError('message', 'Send failed')

    expect(error.name).toBe('ChatbotError')
    expect(error.category).toBe('message')
    expect(error.userMessage).toBe('Send failed')
    expect(error.message).toBe('Send failed')
  })

  it('should preserve cause error', () => {
    const cause = new Error('Network timeout')
    const error = new ChatbotError('network', 'Connection failed', cause)

    expect(error.cause).toBe(cause)
  })

  it('should be instanceof Error', () => {
    const error = new ChatbotError('topic', 'Failed')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ChatbotError)
  })
})

describe('toChatbotError', () => {
  it('should return existing ChatbotError unchanged', () => {
    const original = new ChatbotError('stream', 'Stream failed')
    const result = toChatbotError(original, 'topic', 'Different message')

    expect(result).toBe(original)
  })

  it('should wrap Error as ChatbotError with cause', () => {
    const cause = new Error('HTTP 500')
    const result = toChatbotError(cause, 'network', 'Server error')

    expect(result.category).toBe('network')
    expect(result.userMessage).toBe('Server error')
    expect(result.cause).toBe(cause)
  })

  it('should wrap non-Error values', () => {
    const result = toChatbotError('string error', 'config', 'Config invalid')

    expect(result.category).toBe('config')
    expect(result.userMessage).toBe('Config invalid')
    expect(result.cause).toBeInstanceOf(Error)
    expect((result.cause as Error).message).toBe('string error')
  })
})

describe('useErrorHandler', () => {
  it('should emit chatbot:error event', () => {
    const emitted: Array<{ event: string; args: unknown[] }> = []
    const emit = (event: string, ...args: unknown[]) => {
      emitted.push({ event, args })
    }

    const { handleError } = useErrorHandler({ emit })
    const result = handleError(new Error('test'), 'message', 'Send failed')

    expect(emitted.length).toBe(1)
    expect(emitted[0].event).toBe('chatbot:error')
    expect(emitted[0].args[0]).toEqual({ error: result })
  })

  it('should return ChatbotError', () => {
    const emit = vi.fn()
    const { handleError } = useErrorHandler({ emit })

    const result = handleError(new Error('test'), 'topic', 'Topic error')

    expect(result).toBeInstanceOf(ChatbotError)
    expect(result.category).toBe('topic')
    expect(result.userMessage).toBe('Topic error')
  })

  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const emit = vi.fn()
    const { handleError } = useErrorHandler({ emit })

    const cause = new Error('underlying')
    handleError(cause, 'stream', 'Stream failed')

    expect(consoleSpy).toHaveBeenCalled()
    expect(consoleSpy.mock.calls[0][0]).toContain('[stream]')

    consoleSpy.mockRestore()
  })
})

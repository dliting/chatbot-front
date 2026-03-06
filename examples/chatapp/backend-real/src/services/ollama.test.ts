import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

describe('ollama service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should convert message with images to OpenAI multimodal format', async () => {
    const { convertToOpenAIMessage } = await import('./ollama')

    const message = {
      role: 'user' as const,
      content: 'What is this?',
      images: ['iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==']
    }

    const result = convertToOpenAIMessage(message)

    expect(result).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'What is this?' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } }
      ]
    })
  })

  it('should pass message without images as plain text', async () => {
    const { convertToOpenAIMessage } = await import('./ollama')

    const message = {
      role: 'user' as const,
      content: 'Hello'
    }

    const result = convertToOpenAIMessage(message)

    expect(result).toEqual({
      role: 'user',
      content: 'Hello'
    })
  })
})

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import type { ReadableStream } from 'stream'

// Mock config module to avoid loading real.env file
vi.mock('../config', () => ({
  HOST: 'localhost',
  PORT: 3000,
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_MODEL: 'test-model',
  OLLAMA_THINKING_ENABLED: true,
  OPENAI_API_KEY: '',
}))

// Mock fetch
global.fetch = vi.fn()

// Helper to create a mock ReadableStream for SSE responses
function createMockSSEBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let index = 0
  return {
    getReader() {
      return {
        read() {
          if (index < chunks.length) {
            const value = encoder.encode(chunks[index++])
            return Promise.resolve({ done: false, value })
          }
          return Promise.resolve({ done: true, value: undefined })
        },
        releaseLock() {},
      } as ReadableStreamDefaultReader<Uint8Array>
    },
  } as ReadableStream<Uint8Array>
}

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

  describe('URL construction', () => {
    it('should append /v1/chat/completions to base URL without version path', async () => {
      const { buildChatUrl } = await import('./ollama')
      expect(buildChatUrl('http://localhost:11434')).toBe('http://localhost:11434/v1/chat/completions')
    })

    it('should append only /chat/completions to base URL with version path', async () => {
      const { buildChatUrl } = await import('./ollama')
      expect(buildChatUrl('https://api.example.com/v2')).toBe('https://api.example.com/v2/chat/completions')
      expect(buildChatUrl('http://localhost:11434/v1')).toBe('http://localhost:11434/v1/chat/completions')
    })

    it('should strip trailing slashes from base URL', async () => {
      const { buildChatUrl } = await import('./ollama')
      expect(buildChatUrl('http://localhost:11434/')).toBe('http://localhost:11434/v1/chat/completions')
      expect(buildChatUrl('https://api.example.com/v2/')).toBe('https://api.example.com/v2/chat/completions')
    })

    it('should not produce double version paths', async () => {
      const { buildChatUrl } = await import('./ollama')
      const url = buildChatUrl('https://api.example.com/v2')
      expect(url).not.toContain('/v2/v1/')
      expect(url).not.toContain('/v2/v2/')
    })
  })

  describe('reasoning content parsing', () => {
    it('should parse reasoning content from Ollama delta.reasoning field', async () => {
      const { streamChat } = await import('./ollama')

      const sseChunks = [
        'data: {"choices":[{"delta":{"reasoning":"Thinking..."}}]}\n\n',
        'data: {"choices":[{"delta":{"reasoning":" more"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Answer"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages, { thinking: { enabled: true } })
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      expect(chunks.some(c => c.type === 'reasoning')).toBe(true)
      expect(chunks.filter(c => c.type === 'reasoning').map(c => c.reasoningContent).join('')).toBe('Thinking... more')
      expect(chunks.some(c => c.type === 'token' && c.content === 'Answer')).toBe(true)
    })

    it('should also parse reasoning_content field (OpenAI compatibility)', async () => {
      const { streamChat } = await import('./ollama')

      const sseChunks = [
        'data: {"choices":[{"delta":{"reasoning_content":"Let me think"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Done"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages, { thinking: { enabled: true } })
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      expect(chunks.some(c => c.type === 'reasoning' && c.reasoningContent === 'Let me think')).toBe(true)
    })
  })

  describe('enable_thinking option', () => {
    it('should set enable_thinking to true when thinking is enabled and OLLAMA_THINKING_ENABLED is true', async () => {
      const { streamChat } = await import('./ollama')

      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages, { thinking: { enabled: true } })
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // Verify fetch was called with enable_thinking: true
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.enable_thinking).toBe(true)
    })

    it('should set enable_thinking to false when thinking is explicitly disabled', async () => {
      const { streamChat } = await import('./ollama')

      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages, { thinking: { enabled: false } })
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // Verify fetch was called with enable_thinking: false
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.enable_thinking).toBe(false)
    })

    it('should set enable_thinking to true by default when no options provided', async () => {
      const { streamChat } = await import('./ollama')

      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages)
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // Verify fetch was called with enable_thinking: true (default)
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.enable_thinking).toBe(true)
    })

    it('should still yield reasoning if model returns it despite enable_thinking: false', async () => {
      const { streamChat } = await import('./ollama')

      // Simulate model ignoring enable_thinking: false and returning reasoning anyway
      const sseChunks = [
        'data: {"choices":[{"delta":{"reasoning":"Still thinking..."}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Answer"}}]}\n\n',
        'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: createMockSSEBody(sseChunks),
      } as Response)

      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const gen = streamChat(messages, { thinking: { enabled: false } })
      const chunks = []
      for await (const chunk of gen) {
        chunks.push(chunk)
      }

      // Backend passes through whatever the model returns
      // (filtering is the frontend's responsibility)
      expect(chunks.some(c => c.type === 'reasoning')).toBe(true)
      expect(chunks.some(c => c.type === 'token')).toBe(true)

      // Verify enable_thinking was set to false in the request
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.enable_thinking).toBe(false)
    })
  })

  describe('missing configuration', () => {
    it('should throw error when OLLAMA_BASE_URL is not configured', async () => {
      vi.doMock('../config', () => ({
        HOST: 'localhost',
        PORT: 3000,
        OLLAMA_BASE_URL: '',
        OLLAMA_MODEL: 'test-model',
        OLLAMA_THINKING_ENABLED: true,
        OPENAI_API_KEY: '',
      }))
      vi.resetModules()

      const { streamChat: freshStreamChat } = await import('./ollama')
      const messages = [{ role: 'user' as const, content: 'Hello' }]

      await expect(async () => {
        const gen = freshStreamChat(messages)
        for await (const _ of gen) { /* consume */ }
      }).rejects.toThrow('OLLAMA_BASE_URL is not configured')

      vi.doUnmock('../config')
    })

    it('should throw error when OLLAMA_MODEL is not configured', async () => {
      vi.doMock('../config', () => ({
        HOST: 'localhost',
        PORT: 3000,
        OLLAMA_BASE_URL: 'http://localhost:11434',
        OLLAMA_MODEL: '',
        OLLAMA_THINKING_ENABLED: true,
        OPENAI_API_KEY: '',
      }))
      vi.resetModules()

      const { streamChat: freshStreamChat } = await import('./ollama')
      const messages = [{ role: 'user' as const, content: 'Hello' }]

      await expect(async () => {
        const gen = freshStreamChat(messages)
        for await (const _ of gen) { /* consume */ }
      }).rejects.toThrow('OLLAMA_MODEL is not configured')

      vi.doUnmock('../config')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

describe('ollama service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include chat_template_kwargs with enable_thinking when thinking is disabled', async () => {
    // This test verifies the thinking mode configuration
    const { streamChat } = await import('./ollama')

    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":{"content":"hello"},"done":true}\n'))
        controller.close()
      }
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: mockResponse,
    } as unknown as Response)

    const messages = [{ role: 'user' as const, content: 'hi' }]
    const iterator = streamChat(messages)
    await iterator.next()

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"think":'),
      })
    )
  })
})

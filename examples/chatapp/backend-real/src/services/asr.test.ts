import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock config module — provider factory reads these
vi.mock('../config', () => ({
  HOST: 'localhost',
  PORT: 3000,
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_MODEL: 'test-model',
  OLLAMA_ASR_MODEL: 'test-asr-model',
  OLLAMA_ASR_PROVIDER: 'ollama',
  OLLAMA_THINKING_ENABLED: true,
  OLLAMA_KEEP_ALIVE: '',
  OPENAI_API_KEY: '',
}))

global.fetch = vi.fn()

describe('ASR provider (Adapter pattern)', () => {
  beforeEach(() => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockClear()
  })

  describe('createOllamaAsrProvider', () => {
    it('builds input_audio payload and returns the transcript', async () => {
      const { createOllamaAsrProvider } = await import('./asr')
      const provider = createOllamaAsrProvider({
        baseUrl: 'http://localhost:11434',
        model: 'test-asr-model',
        headers: {},
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hello from audio' } }] }),
      })

      const text = await provider.transcribe('QUJD', 'wav')

      expect(text).toBe('hello from audio')
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toBe('http://localhost:11434/v1/chat/completions')
      const body = JSON.parse(init.body)
      expect(body.model).toBe('test-asr-model')
      expect(body.stream).toBe(false)
      expect(body.messages[0].content[0]).toEqual({ type: 'text', text: 'Transcribe the audio exactly.' })
      expect(body.messages[0].content[1]).toEqual({
        type: 'input_audio',
        input_audio: { data: 'QUJD', format: 'wav' },
      })
    })

    it('throws on non-ok Ollama response', async () => {
      const { createOllamaAsrProvider } = await import('./asr')
      const provider = createOllamaAsrProvider({
        baseUrl: 'http://localhost:11434',
        model: 'test-asr-model',
        headers: {},
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      await expect(provider.transcribe('QUJD', 'wav')).rejects.toThrow('Ollama transcription failed: 500')
    })

    it('returns empty-string content as-is', async () => {
      const { createOllamaAsrProvider } = await import('./asr')
      const provider = createOllamaAsrProvider({
        baseUrl: 'http://localhost:11434',
        model: 'test-asr-model',
        headers: {},
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '' } }] }),
      })
      expect(await provider.transcribe('QUJD', 'wav')).toBe('')
    })
  })

  describe('createAsrProvider factory (Strategy selection)', () => {
    it('returns the ollama adapter for the ollama provider', async () => {
      const { createAsrProvider } = await import('./asr')
      const provider = createAsrProvider('ollama')
      expect(provider.name).toBe('ollama')
    })

    it('throws on unknown provider names (let errors surface)', async () => {
      const { createAsrProvider } = await import('./asr')
      expect(() => createAsrProvider('whisper-cloud')).toThrow('Unknown ASR provider')
    })
  })
})

describe('ASR model residency (keep_alive passthrough)', () => {
  beforeEach(() => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockClear()
  })

  it('includes keep_alive in the transcription request when configured', async () => {
    const { createOllamaAsrProvider } = await import('./asr')
    const provider = createOllamaAsrProvider({
      baseUrl: 'http://localhost:11434',
      model: 'test-asr-model',
      headers: {},
      keepAlive: '30m',
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'text' } }] }),
    })

    await provider.transcribe('QUJD', 'wav')

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(init.body).keep_alive).toBe('30m')
  })

  it('omits keep_alive when not configured', async () => {
    const { createOllamaAsrProvider } = await import('./asr')
    const provider = createOllamaAsrProvider({
      baseUrl: 'http://localhost:11434',
      model: 'test-asr-model',
      headers: {},
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'text' } }] }),
    })

    await provider.transcribe('QUJD', 'wav')

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(init.body)).not.toHaveProperty('keep_alive')
  })
})

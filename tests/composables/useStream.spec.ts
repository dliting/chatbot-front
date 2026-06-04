/**
 * Unit tests for useStream composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStream, useMockStream } from '@/composables/useStream'
import type { StreamEvent } from '@/types'

/** Create an async generator that yields given events */
async function* createGenerator(events: StreamEvent[]): AsyncGenerator<StreamEvent, void, unknown> {
  for (const event of events) {
    yield event
  }
}

/**
 * Create a mock EventSource that simulates SSE behavior.
 * Allows manually triggering onopen, onmessage, onerror.
 */
function createMockEventSourceClass() {
  const instances: MockEventSource[] = []

  class MockEventSource {
    url: string
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    readyState = 0 // CONNECTING

    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 2

    constructor(url: string) {
      this.url = url
      instances.push(this)
    }

    close() {
      this.readyState = MockEventSource.CLOSED
    }

    /** Simulate connection opened */
    simulateOpen() {
      this.readyState = MockEventSource.OPEN
      this.onopen?.()
    }

    /** Simulate receiving a message */
    simulateMessage(data: StreamEvent) {
      this.onmessage?.({ data: JSON.stringify(data) })
    }

    /** Simulate connection error */
    simulateError() {
      this.onerror?.()
    }
  }

  return { MockEventSource, instances }
}

describe('useStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with default reactive state', () => {
      const stream = useStream()

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('')
      expect(stream.streamedThinkingContent.value).toBe('')
      expect(stream.isThinking.value).toBe(false)
    })

    it('should expose all required methods', () => {
      const stream = useStream()

      expect(typeof stream.streamFromSSE).toBe('function')
      expect(typeof stream.streamFromFetch).toBe('function')
      expect(typeof stream.streamFromGenerator).toBe('function')
      expect(typeof stream.cancel).toBe('function')
      expect(typeof stream.reset).toBe('function')
    })
  })

  describe('streamFromGenerator', () => {
    it('should process token events and accumulate content', async () => {
      const onChunk = vi.fn()
      const onComplete = vi.fn()
      const stream = useStream({ onChunk, onComplete })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'Hello' },
        { type: 'token', content: ' world' },
        { type: 'end', fullContent: 'Hello world' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.streamedContent.value).toBe('Hello world')
      expect(stream.isStreaming.value).toBe(false)
      expect(stream.isThinking.value).toBe(false)
    })

    it('should call onChunk for each token event', async () => {
      const onChunk = vi.fn()
      const stream = useStream({ onChunk })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'A' },
        { type: 'token', content: 'B' },
        { type: 'end', fullContent: 'AB' },
      ])

      await stream.streamFromGenerator(generator)

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onChunk).toHaveBeenCalledWith('A')
      expect(onChunk).toHaveBeenCalledWith('B')
    })

    it('should call onComplete with accumulated content at end event', async () => {
      const onComplete = vi.fn()
      const stream = useStream({ onComplete })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'Result' },
        { type: 'end', fullContent: 'Result' },
      ])

      await stream.streamFromGenerator(generator)

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(onComplete).toHaveBeenCalledWith('Result')
    })

    it('should handle reasoning events and set isThinking state', async () => {
      const stream = useStream()

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'reasoning', reasoningContent: 'Let me think...' },
        { type: 'token', content: 'Answer' },
        { type: 'end', fullContent: 'Answer' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.streamedThinkingContent.value).toBe('Let me think...')
      expect(stream.streamedContent.value).toBe('Answer')
    })

    it('should set isThinking to true during reasoning and false on token', async () => {
      const stream = useStream()

      // We need to observe isThinking during iteration, not just after
      const thinkingStates: boolean[] = []

      async function* trackedGenerator(): AsyncGenerator<StreamEvent, void, unknown> {
        yield { type: 'start', messageId: 'msg_1' }
        yield { type: 'reasoning', reasoningContent: 'thinking...' }
        thinkingStates.push(stream.isThinking.value)
        yield { type: 'token', content: 'answer' }
        thinkingStates.push(stream.isThinking.value)
        yield { type: 'end', fullContent: 'answer' }
      }

      await stream.streamFromGenerator(trackedGenerator())

      expect(thinkingStates[0]).toBe(true)
      expect(thinkingStates[1]).toBe(false)
      expect(stream.isThinking.value).toBe(false)
    })

    it('should accumulate multiple reasoning chunks', async () => {
      const stream = useStream()

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'reasoning', reasoningContent: 'Step 1... ' },
        { type: 'reasoning', reasoningContent: 'Step 2...' },
        { type: 'token', content: 'Final' },
        { type: 'end', fullContent: 'Final' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.streamedThinkingContent.value).toBe('Step 1... Step 2...')
    })

    it('should set isStreaming to true during streaming and false after end', async () => {
      const stream = useStream()

      const streamingStates: boolean[] = []

      async function* trackedGenerator(): AsyncGenerator<StreamEvent, void, unknown> {
        yield { type: 'start', messageId: 'msg_1' }
        streamingStates.push(stream.isStreaming.value)
        yield { type: 'token', content: 'data' }
        streamingStates.push(stream.isStreaming.value)
        yield { type: 'end', fullContent: 'data' }
      }

      await stream.streamFromGenerator(trackedGenerator())

      expect(streamingStates[0]).toBe(true)
      expect(streamingStates[1]).toBe(true)
      expect(stream.isStreaming.value).toBe(false)
    })

    it('should handle error events from generator', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'error', error: 'Something went wrong' },
      ])

      await stream.streamFromGenerator(generator)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toBe('Something went wrong')
      expect(stream.isStreaming.value).toBe(false)
      expect(stream.isThinking.value).toBe(false)
    })

    it('should handle error event with no error message', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'error' },
      ])

      await stream.streamFromGenerator(generator)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toBe('Stream error')
    })

    it('should handle thrown errors from generator', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      async function* throwingGenerator(): AsyncGenerator<StreamEvent, void, unknown> {
        yield { type: 'start', messageId: 'msg_1' }
        throw new Error('Generator crashed')
      }

      await stream.streamFromGenerator(throwingGenerator())

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toBe('Generator crashed')
      expect(stream.isStreaming.value).toBe(false)
      expect(stream.isThinking.value).toBe(false)
    })

    it('should do nothing when enabled is false', async () => {
      const onChunk = vi.fn()
      const stream = useStream({ enabled: false, onChunk })

      const generator = createGenerator([
        { type: 'token', content: 'Should not appear' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('')
      expect(onChunk).not.toHaveBeenCalled()
    })

    it('should reset state at the beginning of streaming', async () => {
      const stream = useStream()

      // First stream
      const gen1 = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'First' },
        { type: 'end', fullContent: 'First' },
      ])
      await stream.streamFromGenerator(gen1)

      expect(stream.streamedContent.value).toBe('First')

      // Second stream should reset
      const gen2 = createGenerator([
        { type: 'start', messageId: 'msg_2' },
        { type: 'token', content: 'Second' },
        { type: 'end', fullContent: 'Second' },
      ])
      await stream.streamFromGenerator(gen2)

      expect(stream.streamedContent.value).toBe('Second')
    })

    it('should set isThinking to false on end event', async () => {
      const stream = useStream()

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'reasoning', reasoningContent: 'Hmm...' },
        { type: 'end', fullContent: '' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.isThinking.value).toBe(false)
    })
  })

  describe('streamFromSSE', () => {
    let originalEventSource: typeof globalThis.EventSource
    let mockES: ReturnType<typeof createMockEventSourceClass>

    beforeEach(() => {
      originalEventSource = globalThis.EventSource
      mockES = createMockEventSourceClass()
      globalThis.EventSource = mockES.MockEventSource as unknown as typeof EventSource
    })

    afterEach(() => {
      globalThis.EventSource = originalEventSource
    })

    it('should do nothing when enabled is false', () => {
      const onChunk = vi.fn()
      const stream = useStream({ enabled: false, onChunk })

      stream.streamFromSSE('http://example.com/stream')

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('')
      expect(onChunk).not.toHaveBeenCalled()
      expect(mockES.instances.length).toBe(0)
    })

    it('should set isStreaming to true and reset state', () => {
      const stream = useStream()

      stream.streamedContent.value = 'old content'
      stream.isThinking.value = true

      stream.streamFromSSE('http://example.com/stream')

      // State should be reset at start, isStreaming set to true
      expect(stream.isStreaming.value).toBe(true)
      expect(stream.streamedContent.value).toBe('')
      expect(stream.streamedThinkingContent.value).toBe('')
      expect(stream.isThinking.value).toBe(false)
    })

    it('should create StreamClient and connect', () => {
      const stream = useStream()

      stream.streamFromSSE('http://example.com/stream')

      expect(mockES.instances.length).toBe(1)
      expect(mockES.instances[0].url).toBe('http://example.com/stream')
    })

    it('should process SSE messages and accumulate content', () => {
      const onChunk = vi.fn()
      const onComplete = vi.fn()
      const stream = useStream({ onChunk, onComplete })

      stream.streamFromSSE('http://example.com/stream')

      const es = mockES.instances[0]
      es.simulateOpen()

      // Send start event
      es.simulateMessage({ type: 'start', messageId: 'msg_1' })
      expect(stream.streamedContent.value).toBe('')

      // Send token event
      es.simulateMessage({ type: 'token', content: 'Hello' })
      expect(stream.streamedContent.value).toBe('Hello')
      expect(onChunk).toHaveBeenCalledWith('Hello')

      // Send another token
      es.simulateMessage({ type: 'token', content: ' world' })
      expect(stream.streamedContent.value).toBe('Hello world')

      // Send end event
      es.simulateMessage({ type: 'end', fullContent: 'Hello world' })
      expect(stream.isStreaming.value).toBe(false)
      expect(onComplete).toHaveBeenCalledWith('Hello world')
    })

    it('should handle reasoning events from SSE', () => {
      const stream = useStream()

      stream.streamFromSSE('http://example.com/stream')

      const es = mockES.instances[0]
      es.simulateOpen()
      es.simulateMessage({ type: 'start', messageId: 'msg_1' })
      es.simulateMessage({ type: 'reasoning', reasoningContent: 'Thinking...' })
      expect(stream.isThinking.value).toBe(true)
      expect(stream.streamedThinkingContent.value).toBe('Thinking...')

      es.simulateMessage({ type: 'token', content: 'Answer' })
      expect(stream.isThinking.value).toBe(false)
    })

    it('should handle SSE connection errors', () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      stream.streamFromSSE('http://example.com/stream')

      const es = mockES.instances[0]
      es.simulateError()

      // StreamClient disconnects on error, calls onError callback
      expect(onError).toHaveBeenCalled()
      expect(stream.isStreaming.value).toBe(false)
      expect(stream.isThinking.value).toBe(false)
    })

    it('should set isThinking to false on SSE error during thinking', () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      stream.streamFromSSE('http://example.com/stream')

      const es = mockES.instances[0]
      es.simulateOpen()
      es.simulateMessage({ type: 'start', messageId: 'msg_1' })
      es.simulateMessage({ type: 'reasoning', reasoningContent: 'Hmm' })
      expect(stream.isThinking.value).toBe(true)

      es.simulateError()

      expect(stream.isThinking.value).toBe(false)
      expect(stream.isStreaming.value).toBe(false)
    })
  })

  describe('streamFromFetch', () => {
    it('should do nothing when enabled is false', async () => {
      const onChunk = vi.fn()
      const stream = useStream({ enabled: false, onChunk })

      await stream.streamFromFetch('http://example.com/stream')

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('')
      expect(onChunk).not.toHaveBeenCalled()
    })

    it('should set isStreaming to true and reset state at start', async () => {
      // Mock global fetch to return a readable stream that never resolves
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: () => new Promise(() => {}), // never resolves
          }),
        },
      })
      vi.stubGlobal('fetch', mockFetch)

      const stream = useStream()

      stream.streamedContent.value = 'old'
      stream.isThinking.value = true

      // Don't await - the stream is pending
      stream.streamFromFetch('http://example.com/api')

      // State should be reset at start, isStreaming set to true
      expect(stream.isStreaming.value).toBe(true)
      expect(stream.streamedContent.value).toBe('')
      expect(stream.streamedThinkingContent.value).toBe('')
      expect(stream.isThinking.value).toBe(false)

      vi.unstubAllGlobals()
    })

    it('should call onChunk for each chunk from fetch stream', async () => {
      const onChunk = vi.fn()
      const onComplete = vi.fn()
      const stream = useStream({ onChunk, onComplete })

      // Create a mock ReadableStream
      const encoder = new TextEncoder()
      let readCount = 0
      const chunks = [encoder.encode('Hello'), encoder.encode(' world')]

      // Use a promise to track when reading is complete
      let resolveReadDone: () => void
      const readDone = new Promise<void>(resolve => { resolveReadDone = resolve })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (readCount < chunks.length) {
                return { done: false, value: chunks[readCount++] }
              }
              resolveReadDone()
              return { done: true, value: undefined }
            },
          }),
        },
      })
      vi.stubGlobal('fetch', mockFetch)

      // streamFromFetch resolves immediately but the read loop is async
      await stream.streamFromFetch('http://example.com/api')

      // Wait for the read loop to complete
      await readDone
      // Give a microtask tick for callbacks to settle
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(onChunk).toHaveBeenCalledWith('Hello')
      expect(onChunk).toHaveBeenCalledWith(' world')
      expect(stream.streamedContent.value).toBe('Hello world')
      expect(onComplete).toHaveBeenCalledWith('Hello world')
      expect(stream.isStreaming.value).toBe(false)

      vi.unstubAllGlobals()
    })

    it('should handle fetch error', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.stubGlobal('fetch', mockFetch)

      await stream.streamFromFetch('http://example.com/api')

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toBe('Network error')
      expect(stream.isStreaming.value).toBe(false)
      expect(stream.isThinking.value).toBe(false)

      vi.unstubAllGlobals()
    })

    it('should handle HTTP error status', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
      vi.stubGlobal('fetch', mockFetch)

      await stream.streamFromFetch('http://example.com/api')

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toContain('500')
      expect(stream.isStreaming.value).toBe(false)

      vi.unstubAllGlobals()
    })

    it('should handle null response body', async () => {
      const onError = vi.fn()
      const stream = useStream({ onError })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      })
      vi.stubGlobal('fetch', mockFetch)

      await stream.streamFromFetch('http://example.com/api')

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toContain('not readable')
      expect(stream.isStreaming.value).toBe(false)

      vi.unstubAllGlobals()
    })

    it('should pass fetchOptions to fetch call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined }),
          }),
        },
      })
      vi.stubGlobal('fetch', mockFetch)

      const stream = useStream()
      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
      }

      await stream.streamFromFetch('http://example.com/api', options)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'test' }),
          signal: expect.any(AbortSignal),
        })
      )

      vi.unstubAllGlobals()
    })
  })

  describe('cancel', () => {
    it('should set isStreaming to false', () => {
      const stream = useStream()

      // Simulate streaming state
      stream.isStreaming.value = true
      stream.cancel()

      expect(stream.isStreaming.value).toBe(false)
    })

    it('should not affect other state', () => {
      const stream = useStream()

      stream.isStreaming.value = true
      stream.streamedContent.value = 'partial content'
      stream.streamedThinkingContent.value = 'thinking'
      stream.isThinking.value = true

      stream.cancel()

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('partial content')
      expect(stream.streamedThinkingContent.value).toBe('thinking')
      // cancel only sets isStreaming, not isThinking
    })
  })

  describe('reset', () => {
    it('should reset all state to defaults', () => {
      const stream = useStream()

      // Set all state to non-default values
      stream.isStreaming.value = true
      stream.streamedContent.value = 'some content'
      stream.streamedThinkingContent.value = 'thinking'
      stream.isThinking.value = true

      stream.reset()

      expect(stream.isStreaming.value).toBe(false)
      expect(stream.streamedContent.value).toBe('')
      expect(stream.streamedThinkingContent.value).toBe('')
      expect(stream.isThinking.value).toBe(false)
    })

    it('should reset accumulator content', async () => {
      const onComplete = vi.fn()
      const stream = useStream({ onComplete })

      // Stream some content to populate accumulator
      const gen = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'Accumulated' },
        { type: 'end', fullContent: 'Accumulated' },
      ])
      await stream.streamFromGenerator(gen)

      expect(onComplete).toHaveBeenCalledWith('Accumulated')

      // Reset and stream again - accumulator should be clean
      stream.reset()

      const onComplete2 = vi.fn()
      const stream2 = useStream({ onComplete: onComplete2 })
      const gen2 = createGenerator([
        { type: 'start', messageId: 'msg_2' },
        { type: 'token', content: 'New' },
        { type: 'end', fullContent: 'New' },
      ])
      await stream2.streamFromGenerator(gen2)

      expect(onComplete2).toHaveBeenCalledWith('New')
    })
  })

  describe('start event handling', () => {
    it('should reset content and thinking state on start event', async () => {
      const stream = useStream()

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token', content: 'Hello' },
        { type: 'end', fullContent: 'Hello' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.streamedContent.value).toBe('Hello')
    })

    it('should clear streamedContent and streamedThinkingContent on start', async () => {
      const stream = useStream()

      const statesDuringStreaming: { content: string; thinking: string }[] = []

      async function* trackedGenerator(): AsyncGenerator<StreamEvent, void, unknown> {
        yield { type: 'start', messageId: 'msg_1' }
        statesDuringStreaming.push({
          content: stream.streamedContent.value,
          thinking: stream.streamedThinkingContent.value,
        })
        yield { type: 'token', content: 'data' }
        yield { type: 'end', fullContent: 'data' }
      }

      await stream.streamFromGenerator(trackedGenerator())

      // After start, both should be empty
      expect(statesDuringStreaming[0]).toEqual({ content: '', thinking: '' })
    })
  })

  describe('token event without content', () => {
    it('should not call onChunk for token event with no content', async () => {
      const onChunk = vi.fn()
      const stream = useStream({ onChunk })

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'token' }, // no content field
        { type: 'end', fullContent: '' },
      ])

      await stream.streamFromGenerator(generator)

      expect(onChunk).not.toHaveBeenCalled()
    })
  })

  describe('reasoning event without reasoningContent', () => {
    it('should not accumulate empty reasoning content', async () => {
      const stream = useStream()

      const generator = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'reasoning' }, // no reasoningContent field
        { type: 'token', content: 'Answer' },
        { type: 'end', fullContent: 'Answer' },
      ])

      await stream.streamFromGenerator(generator)

      expect(stream.streamedThinkingContent.value).toBe('')
    })
  })

  describe('multiple streamFromGenerator calls', () => {
    it('should properly reset between calls', async () => {
      const stream = useStream()

      // First stream with reasoning
      const gen1 = createGenerator([
        { type: 'start', messageId: 'msg_1' },
        { type: 'reasoning', reasoningContent: 'Thinking 1' },
        { type: 'token', content: 'Answer 1' },
        { type: 'end', fullContent: 'Answer 1' },
      ])
      await stream.streamFromGenerator(gen1)

      expect(stream.streamedContent.value).toBe('Answer 1')
      expect(stream.streamedThinkingContent.value).toBe('Thinking 1')

      // Second stream should reset state at beginning
      const gen2 = createGenerator([
        { type: 'start', messageId: 'msg_2' },
        { type: 'token', content: 'Answer 2' },
        { type: 'end', fullContent: 'Answer 2' },
      ])
      await stream.streamFromGenerator(gen2)

      expect(stream.streamedContent.value).toBe('Answer 2')
      expect(stream.streamedThinkingContent.value).toBe('')
    })
  })
})

describe('useMockStream', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default state', () => {
    const mock = useMockStream()

    expect(mock.isStreaming.value).toBe(false)
    expect(mock.streamedContent.value).toBe('')
    expect(typeof mock.streamMock).toBe('function')
  })

  it('should stream mock text character by character', async () => {
    const mock = useMockStream()

    const promise = mock.streamMock('Hi', 10)

    // Advance timers to allow all characters to be processed
    await vi.advanceTimersByTimeAsync(50)

    await promise

    expect(mock.streamedContent.value).toBe('Hi')
    expect(mock.isStreaming.value).toBe(false)
  })

  it('should use default charDelay of 50ms', async () => {
    const mock = useMockStream()

    const promise = mock.streamMock('AB')

    // At 50ms per char, need >100ms for 2 chars
    await vi.advanceTimersByTimeAsync(150)

    await promise

    expect(mock.streamedContent.value).toBe('AB')
  })

  it('should stream an empty string', async () => {
    const mock = useMockStream()

    await mock.streamMock('', 10)

    expect(mock.streamedContent.value).toBe('')
    expect(mock.isStreaming.value).toBe(false)
  })

  it('should stream longer text with custom delay', async () => {
    const mock = useMockStream()

    const promise = mock.streamMock('Hello', 5)

    await vi.advanceTimersByTimeAsync(50)

    await promise

    expect(mock.streamedContent.value).toBe('Hello')
  })

  it('should set isStreaming during streaming and clear after', async () => {
    const mock = useMockStream()

    const promise = mock.streamMock('Test', 10)

    // Should be streaming now
    expect(mock.isStreaming.value).toBe(true)

    await vi.advanceTimersByTimeAsync(100)

    await promise

    expect(mock.isStreaming.value).toBe(false)
  })
})

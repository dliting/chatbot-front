/**
 * Unit tests for useStream composable
 */
import { describe, it, expect, vi } from 'vitest'
import { useStream, useMockStream } from '@/composables/useStream'
import { createMockStream } from '@/utils/stream'

describe('composables/useStream', () => {
  describe('useStream', () => {
    it('should track streaming state', async () => {
      const { isStreaming, streamedContent } = useStream({
        enabled: true,
      })

      expect(isStreaming.value).toBe(false)
      expect(streamedContent.value).toBe('')
    })

    it('should accumulate streamed content', async () => {
      let accumulatedContent = ''
      const { isStreaming, streamedContent, streamFromGenerator } = useStream({
        enabled: true,
        onChunk: (content) => {
          accumulatedContent += content
        },
      })

      const mockGenerator = createMockStream('Hello World', 10)

      const streamPromise = streamFromGenerator(mockGenerator)
      expect(isStreaming.value).toBe(true)

      await streamPromise

      expect(isStreaming.value).toBe(false)
      expect(streamedContent.value).toBe('Hello World')
    })

    it('should call onComplete callback', async () => {
      const onComplete = vi.fn()
      const { streamFromGenerator } = useStream({
        enabled: true,
        onComplete,
      })

      const mockGenerator = createMockStream('Test', 0)
      await streamFromGenerator(mockGenerator)

      expect(onComplete).toHaveBeenCalledWith('Test')
    })

    it('should call onError callback on error', async () => {
      const onError = vi.fn()

      async function* errorGenerator() {
        yield { type: 'start' }
        yield { type: 'error', error: 'Stream failed' }
      }

      const { streamFromGenerator } = useStream({
        enabled: true,
        onError,
      })

      await streamFromGenerator(errorGenerator())

      expect(onError).toHaveBeenCalled()
    })

    it('should not stream when disabled', async () => {
      const onChunk = vi.fn()
      const { streamFromGenerator } = useStream({
        enabled: false,
        onChunk,
      })

      const mockGenerator = createMockStream('Test', 0)
      await streamFromGenerator(mockGenerator)

      expect(onChunk).not.toHaveBeenCalled()
    })

    it('should cancel stream', () => {
      const { isStreaming, cancel } = useStream()

      // Start a mock streaming operation
      isStreaming.value = true
      cancel()

      expect(isStreaming.value).toBe(false)
    })

    it('should reset state', () => {
      const { isStreaming, streamedContent, reset } = useStream()

      isStreaming.value = true
      streamedContent.value = 'Some content'

      reset()

      expect(isStreaming.value).toBe(false)
      expect(streamedContent.value).toBe('')
    })
  })

  describe('useMockStream', () => {
    it('should stream mock content', async () => {
      const { isStreaming, streamedContent, streamMock } = useMockStream()

      const streamPromise = streamMock('Test message', 10)

      expect(isStreaming.value).toBe(true)

      await streamPromise

      expect(isStreaming.value).toBe(false)
      expect(streamedContent.value).toBe('Test message')
    })

    it('should use default delay when not specified', async () => {
      const { streamMock } = useMockStream()

      const start = Date.now()
      await streamMock('Hi', 50)
      const duration = Date.now() - start

      // Should take approximately length * delay
      expect(duration).toBeGreaterThanOrEqual(100) // 2 chars * 50ms
    })
  })
})

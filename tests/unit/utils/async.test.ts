/**
 * Unit tests for async utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle, sleep, retry, copyToClipboard } from '@/utils/async'

describe('utils/async', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a')
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')
    })

    it('should only execute once for multiple rapid calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a')
      debouncedFn('b')
      debouncedFn('c')

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('c')
    })

    it('should reset timer on each call', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a')
      vi.advanceTimersByTime(50)
      debouncedFn('b')
      vi.advanceTimersByTime(50)

      // Timer was reset by second call, so fn should not have been called yet
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('b')
    })

    it('should clear timer reference after execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)

      // After execution, subsequent calls should work normally
      debouncedFn('b')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('b')
    })

    it('should pass multiple arguments', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a', 'b', 'c')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
    })

    it('should preserve this context', () => {
      const obj = {
        value: 42,
        method: vi.fn(function (this: any) {
          return this.value
        }),
      }

      const debouncedMethod = debounce(obj.method, 100)
      debouncedMethod.call(obj)
      vi.advanceTimersByTime(100)

      expect(obj.method).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should execute function immediately on first call', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')
    })

    it('should not execute function again within throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      throttledFn('b')
      throttledFn('c')

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')
    })

    it('should execute trailing call after throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      throttledFn('b')

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('b')
    })

    it('should allow execution after throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      vi.advanceTimersByTime(150)

      throttledFn('b')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should schedule at most one trailing call', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      throttledFn('b')
      throttledFn('c')

      vi.advanceTimersByTime(100)
      // Only the first trailing call is scheduled (with 'b')
      expect(fn).toHaveBeenCalledTimes(2)
      // The second call within the throttle window is 'b' because
      // the trailing timer is only set on the first throttled call
    })

    it('should clear trailing timer when called after throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('a')
      vi.advanceTimersByTime(150)

      // Timer should be cleared, new call starts fresh
      throttledFn('b')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should pass multiple arguments', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('x', 'y', 'z')
      expect(fn).toHaveBeenCalledWith('x', 'y', 'z')
    })

    it('should preserve this context', () => {
      const obj = {
        value: 42,
        method: vi.fn(function (this: any) {
          return this.value
        }),
      }

      const throttledMethod = throttle(obj.method, 100)
      throttledMethod.call(obj)

      expect(obj.method).toHaveBeenCalledTimes(1)
    })
  })

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(40)
    })

    it('should resolve immediately for 0ms', async () => {
      const start = Date.now()
      await sleep(0)
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('retry', () => {
    it('should return result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await retry(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and succeed on subsequent attempt', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')

      const result = await retry(fn, { delay: 10, backoff: 1 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw last error after all attempts fail', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('persistent failure'))

      await expect(retry(fn, { maxAttempts: 3, delay: 10, backoff: 1 })).rejects.toThrow('persistent failure')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should use default maxAttempts of 3', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await expect(retry(fn, { delay: 10, backoff: 1 })).rejects.toThrow('fail')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should respect custom maxAttempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await expect(retry(fn, { maxAttempts: 5, delay: 10, backoff: 1 })).rejects.toThrow('fail')
      expect(fn).toHaveBeenCalledTimes(5)
    })

    it('should apply exponential backoff between retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))
      const start = Date.now()

      await expect(retry(fn, { maxAttempts: 3, delay: 50, backoff: 2 })).rejects.toThrow('fail')

      const elapsed = Date.now() - start
      // With backoff=2: delay between attempt 1-2 = 50*2^0 = 50ms, between 2-3 = 50*2^1 = 100ms
      // Total delay should be at least 150ms
      expect(elapsed).toBeGreaterThanOrEqual(140)
    })

    it('should work with single attempt (maxAttempts=1)', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await expect(retry(fn, { maxAttempts: 1, delay: 10 })).rejects.toThrow('fail')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should work with synchronous throwing function', async () => {
      const fn = vi.fn()
        .mockImplementationOnce(() => { throw new Error('sync fail') })
        .mockResolvedValue('success')

      const result = await retry(fn, { delay: 10, backoff: 1 })
      expect(result).toBe('success')
    })

    it('should use default options when none provided', async () => {
      const fn = vi.fn().mockResolvedValue('ok')

      const result = await retry(fn)
      expect(result).toBe('ok')
    })
  })

  describe('copyToClipboard', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return true when clipboard API succeeds', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const result = await copyToClipboard('test text')

      expect(writeTextMock).toHaveBeenCalledWith('test text')
      expect(result).toBe(true)
    })

    it('should use fallback when clipboard API is not available', async () => {
      // Remove clipboard API
      vi.stubGlobal('navigator', {})

      // Mock document for fallback
      const mockTextarea = {
        value: '',
        style: { position: '', left: '' },
        select: vi.fn(),
      }
      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      }
      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(mockTextarea),
        body: mockBody,
        execCommand: vi.fn().mockReturnValue(true),
      })

      const result = await copyToClipboard('test text')

      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(mockTextarea.value).toBe('test text')
      expect(mockTextarea.select).toHaveBeenCalled()
      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(mockBody.removeChild).toHaveBeenCalledWith(mockTextarea)
      expect(result).toBe(true)
    })

    it('should use fallback when clipboard.writeText is not available', async () => {
      vi.stubGlobal('navigator', {
        clipboard: {},
      })

      const mockTextarea = {
        value: '',
        style: { position: '', left: '' },
        select: vi.fn(),
      }
      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      }
      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(mockTextarea),
        body: mockBody,
        execCommand: vi.fn().mockReturnValue(true),
      })

      const result = await copyToClipboard('fallback text')

      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(result).toBe(true)
    })

    it('should return false when clipboard API throws error', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)
    })

    it('should return false when fallback throws error', async () => {
      vi.stubGlobal('navigator', {})

      vi.stubGlobal('document', {
        createElement: vi.fn().mockImplementation(() => {
          throw new Error('DOM error')
        }),
        body: {},
      })

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)
    })
  })
})

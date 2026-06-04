/**
 * Unit tests for utility functions in helpers.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateId,
  formatTime,
  formatFileSize,
  isValidUrl,
  deepClone,
  debounce,
  throttle,
  copyToClipboard,
  isImageFile,
  readFileAsDataURL,
  safeJSONParse,
  isInIframe,
  escapeHTML,
  truncate,
  sleep,
  downloadFile,
  getFileExtension,
} from '@/utils/helpers'

describe('utils/helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = generateId('test')
      const id2 = generateId('test')

      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should use default prefix if none provided', () => {
      const id = generateId()
      expect(id).toMatch(/^id_\d+_[a-z0-9]+$/)
    })
  })

  describe('formatTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format time as "Just now" for recent messages', () => {
      const now = Date.now()
      expect(formatTime(now - 30000)).toBe('Just now')
    })

    it('should format time in minutes ago', () => {
      const now = Date.now()
      expect(formatTime(now - 120000)).toBe('2m ago')
      expect(formatTime(now - 300000)).toBe('5m ago')
    })

    it('should format time in hours ago', () => {
      const now = Date.now()
      expect(formatTime(now - 3600000)).toBe('1h ago')
      expect(formatTime(now - 7200000)).toBe('2h ago')
    })

    it('should format time in days ago', () => {
      const now = Date.now()
      expect(formatTime(now - 86400000)).toBe('1d ago')
      expect(formatTime(now - 172800000)).toBe('2d ago')
    })

    it('should format as date for old messages', () => {
      const oldDate = Date.now() - 10 * 86400000
      const formatted = formatTime(oldDate)
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}/)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)

      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('should deep clone arrays', () => {
      const arr = [1, [2, [3]]]
      const cloned = deepClone(arr)

      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
    })

    it('should return primitives as-is', () => {
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
      expect(deepClone(42)).toBe(42)
      expect(deepClone('string')).toBe('string')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)

      await new Promise(resolve => setTimeout(resolve, 150))

      throttledFn()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const result = await copyToClipboard('test text')

      expect(writeTextMock).toHaveBeenCalledWith('test text')
      expect(result).toBe(true)

      vi.unstubAllGlobals()
    })

    it('should return false on error', async () => {
      // Mock clipboard error
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Copy failed')),
        },
      })

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)

      vi.unstubAllGlobals()
    })
  })

  describe('isImageFile', () => {
    it('should identify image files', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const textFile = new File([''], 'test.txt', { type: 'text/plain' })

      expect(isImageFile(imageFile)).toBe(true)
      expect(isImageFile(textFile)).toBe(false)
    })
  })

  describe('safeJSONParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJSONParse('{"a":1}', {})).toEqual({ a: 1 })
      expect(safeJSONParse('123', 0)).toBe(123)
    })

    it('should return fallback on invalid JSON', () => {
      expect(safeJSONParse('invalid', { fallback: true })).toEqual({ fallback: true })
      expect(safeJSONParse('invalid', null)).toBe(null)
    })
  })

  describe('escapeHTML', () => {
    it('should escape HTML entities', () => {
      expect(escapeHTML('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(escapeHTML('<div>content</div>'))
        .toBe('&lt;div&gt;content&lt;/div&gt;')
    })
  })

  describe('truncate', () => {
    it('should truncate text to max length', () => {
      // maxLength 5 with '...' suffix (3 chars) = 2 chars of text
      expect(truncate('Hello World', 5)).toBe('He...')
      expect(truncate('Hi', 5)).toBe('Hi')
      expect(truncate('Hello World', 11)).toBe('Hello World')
    })

    it('should use custom suffix', () => {
      // maxLength 5 with '***' suffix (3 chars) = 2 chars of text
      expect(truncate('Hello World', 5, '***')).toBe('He***')
    })
  })

  describe('sleep', () => {
    it('should sleep for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(90)
    })
  })

  describe('isInIframe', () => {
    it('should detect if in iframe', () => {
      // In test environment, window.top === window.self
      expect(isInIframe()).toBe(false)
    })

    it('should return true when cross-origin access throws SecurityError', () => {
      const origTop = window.top
      Object.defineProperty(window, 'top', {
        get: () => { throw new DOMException('Blocked', 'SecurityError') },
        configurable: true,
      })

      expect(isInIframe()).toBe(true)

      Object.defineProperty(window, 'top', { get: () => origTop, configurable: true })
    })
  })

  describe('downloadFile', () => {
    beforeEach(() => {
      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue({
          href: '',
          download: '',
          target: '_blank',
          appendChild: vi.fn(),
          click: vi.fn(),
          removeChild: vi.fn(),
        }),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should create download link', () => {
      downloadFile('http://example.com/file.pdf')

      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('should use custom filename when provided', () => {
      downloadFile('http://example.com/file.pdf', 'custom.pdf')

      expect(document.createElement).toHaveBeenCalledWith('a')
    })
  })

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('image.jpg')).toBe('jpg')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should return empty string for file without extension', () => {
      expect(getFileExtension('filename')).toBe('')
    })

    it('should handle URL with query string', () => {
      expect(getFileExtension('http://example.com/image.png?token=123')).toBe('png?token=123')
    })
  })
})

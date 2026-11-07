/**
 * Unit tests for file validation utilities
 */
import { describe, it, expect } from 'vitest'
import { validateFileSize, validateFiles, getMediaType, FILE_SIZE_LIMITS } from '@/utils/fileValidation'

describe('fileValidation', () => {
  describe('validateFileSize', () => {
    it('should accept image under 10MB', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
      const result = validateFileSize(file, 'image')
      expect(result.valid).toBe(true)
    })

    it('should reject image over 10MB', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
      const result = validateFileSize(file, 'image')
      expect(result.valid).toBe(false)
      expect(result.maxSize).toBe('10MB')
    })

    it('should accept video under 100MB', () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 })
      const result = validateFileSize(file, 'video')
      expect(result.valid).toBe(true)
    })

    it('should reject video over 100MB', () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      Object.defineProperty(file, 'size', { value: 101 * 1024 * 1024 })
      const result = validateFileSize(file, 'video')
      expect(result.valid).toBe(false)
      expect(result.maxSize).toBe('100MB')
    })

    it('should accept audio under 20MB', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })
      const result = validateFileSize(file, 'audio')
      expect(result.valid).toBe(true)
    })

    it('should reject audio over 20MB', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
      Object.defineProperty(file, 'size', { value: 21 * 1024 * 1024 })
      const result = validateFileSize(file, 'audio')
      expect(result.valid).toBe(false)
      expect(result.maxSize).toBe('20MB')
    })

    it('should accept file at exact limit', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })
      const result = validateFileSize(file, 'image')
      expect(result.valid).toBe(true)
    })
  })

  describe('getMediaType', () => {
    it('should detect image type', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(getMediaType(file)).toBe('image')
    })

    it('should detect video type', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' })
      expect(getMediaType(file)).toBe('video')
    })

    it('should detect audio type', () => {
      const file = new File([''], 'test.mp3', { type: 'audio/mpeg' })
      expect(getMediaType(file)).toBe('audio')
    })

    it('should default to image for unknown types', () => {
      const file = new File([''], 'test.bin', { type: 'application/octet-stream' })
      expect(getMediaType(file)).toBe('image')
    })
  })

  describe('FILE_SIZE_LIMITS', () => {
    it('should have correct limits', () => {
      expect(FILE_SIZE_LIMITS.image).toBe(10 * 1024 * 1024)
      expect(FILE_SIZE_LIMITS.video).toBe(100 * 1024 * 1024)
      expect(FILE_SIZE_LIMITS.audio).toBe(20 * 1024 * 1024)
    })
  })
})

describe('validateFiles', () => {
  const mk = (name: string, size: number, type: string): File =>
    ({ name, size, type } as unknown as File)

  it('accepts files within default limits', () => {
    const { accepted, rejected } = validateFiles([mk('a.png', 1024, 'image/png')])
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })

  it('rejects oversize files with reason size when custom maxImageSize set', () => {
    const file = mk('big.png', 20 * 1024 * 1024, 'image/png')
    const { accepted, rejected } = validateFiles([file], { maxImageSize: 1024 })
    expect(accepted).toHaveLength(0)
    expect(rejected).toEqual([{ file, reason: 'size' }])
  })

  it('applies default per-type limits when no override given', () => {
    const { rejected } = validateFiles([mk('big.png', 11 * 1024 * 1024, 'image/png')])
    expect(rejected[0]?.reason).toBe('size')
  })

  it('rejects disallowed types with reason type', () => {
    const file = mk('x.gif', 10, 'image/gif')
    const { accepted, rejected } = validateFiles([file], { allowedImageTypes: ['image/png'] })
    expect(accepted).toHaveLength(0)
    expect(rejected).toEqual([{ file, reason: 'type' }])
  })

  it('rejects files beyond maxCount with reason count, keeping first N', () => {
    const files = [mk('a.png', 1, 'image/png'), mk('b.png', 1, 'image/png'), mk('c.png', 1, 'image/png')]
    const { accepted, rejected } = validateFiles(files, { maxCount: 2 })
    expect(accepted).toEqual([files[0], files[1]])
    expect(rejected).toEqual([{ file: files[2], reason: 'count' }])
  })

  it('keeps accepted order matching input order', () => {
    const files = [mk('b.png', 1, 'image/png'), mk('a.png', 1, 'image/png')]
    const { accepted } = validateFiles(files)
    expect(accepted.map((f) => f.name)).toEqual(['b.png', 'a.png'])
  })
})

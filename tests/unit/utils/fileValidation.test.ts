/**
 * Unit tests for file validation utilities
 */
import { describe, it, expect } from 'vitest'
import { validateFileSize, formatFileSize, getMediaType, FILE_SIZE_LIMITS } from '@/utils/fileValidation'

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

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(2048)).toBe('2.0 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
    })

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B')
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

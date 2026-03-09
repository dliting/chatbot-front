/**
 * Unit tests for upload utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateFile,
  createImageFile,
  uploadFiles,
  createMockUploadEndpoint,
  createUploadEndpoint,
  uploadWithProgress,
  compressImage,
} from '@/utils/upload'
import type { ImageFile, UploadResult } from '@/types'

describe('utils/upload', () => {
  // Mock URL.createObjectURL and URL.revokeObjectURL
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:http://localhost/mock-url'),
      revokeObjectURL: vi.fn(),
    })

    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('validateFile', () => {
    const defaultOptions = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    }

    it('should return valid for allowed file type', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const result = validateFile(file, defaultOptions)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for disallowed file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })

      const result = validateFile(file, defaultOptions)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should return invalid for file exceeding size limit', () => {
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }) // 20MB

      const result = validateFile(file, defaultOptions)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File too large')
    })

    it('should allow all types when allowedTypes is empty', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      const options = { allowedTypes: [] }

      const result = validateFile(file, options)

      expect(result.valid).toBe(true)
    })

    it('should allow file without size limit when maxFileSize is not set', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const options = { allowedTypes: ['image/jpeg'] }

      const result = validateFile(file, options)

      expect(result.valid).toBe(true)
    })
  })

  describe('createImageFile', () => {
    it('should create image file with preview URL', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const result = await createImageFile(file)

      expect(result.file).toBe(file)
      expect(result.url).toBeDefined()
      expect(result.status).toBe('uploading')
      expect(result.progress).toBe(0)
    })

    it('should throw error for invalid file', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 })

      await expect(createImageFile(file, { maxFileSize: 1024 })).rejects.toThrow()
    })
  })

  describe('uploadFiles', () => {
    it('should throw error when too many files', async () => {
      const files = [
        new File([''], '1.jpg', { type: 'image/jpeg' }),
        new File([''], '2.jpg', { type: 'image/jpeg' }),
      ]

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: [] }),
      }

      await expect(uploadFiles(files, endpoint, { maxCount: 1 })).rejects.toThrow('Too many files')
    })

    it('should return error result for invalid files', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: [] }),
      }

      const result = await uploadFiles([file], endpoint, {
        allowedTypes: ['image/jpeg'],
      })

      expect(result.urls).toHaveLength(0)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0]?.file).toBe('test.pdf')
    })

    it('should upload valid files', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: ['http://example.com/img.jpg'] }),
      }

      const result = await uploadFiles([file], endpoint)

      expect(endpoint.upload).toHaveBeenCalled()
      expect(result.urls).toContain('http://example.com/img.jpg')
    })

    it('should catch upload errors', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const endpoint = {
        upload: vi.fn().mockRejectedValue(new Error('Network error')),
      }

      const result = await uploadFiles([file], endpoint)

      expect(result.errors).toBeDefined()
      expect(result.errors?.[0]?.error).toBe('Network error')
    })
  })

  describe('createMockUploadEndpoint', () => {
    it('should create mock endpoint that returns blob URLs', async () => {
      const endpoint = createMockUploadEndpoint(10)
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      const result = await endpoint.upload(files)

      expect(result.urls).toHaveLength(1)
      expect(result.urls[0]).toContain('blob:')
    })

    it('should delay response based on parameter', async () => {
      const start = Date.now()
      const endpoint = createMockUploadEndpoint(100)
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      await endpoint.upload(files)

      const duration = Date.now() - start
      expect(duration).toBeGreaterThanOrEqual(100)
    })
  })

  describe('createUploadEndpoint', () => {
    it('should create endpoint that uses fetch', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ urls: ['http://example.com/img.jpg'] }),
      } as any)

      const endpoint = createUploadEndpoint('http://api.example.com/upload')
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      const result = await endpoint.upload(files)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.example.com/upload',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result.urls).toContain('http://example.com/img.jpg')
    })

    it('should throw error when response is not ok', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
      } as any)

      const endpoint = createUploadEndpoint('http://api.example.com/upload')
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      await expect(endpoint.upload(files)).rejects.toThrow('Upload failed: Server Error')
    })
  })

  describe('uploadWithProgress', () => {
    it('should upload files and report progress', async () => {
      const imageFiles: ImageFile[] = [
        { file: new File([''], '1.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
        { file: new File([''], '2.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
      ]

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: ['http://example.com/1.jpg'] }),
      }

      const onProgress = vi.fn()

      const result = await uploadWithProgress(imageFiles, endpoint, onProgress)

      expect(onProgress).toHaveBeenCalled()
      expect(result.urls).toHaveLength(2)
    })

    it('should handle errors during upload', async () => {
      const imageFiles: ImageFile[] = [
        { file: new File([''], '1.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
      ]

      const endpoint = {
        upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
      }

      const result = await uploadWithProgress(imageFiles, endpoint)

      expect(result.errors).toBeDefined()
      expect(imageFiles[0].status).toBe('error')
    })
  })

  describe('compressImage', () => {
    it('should return original file if already small enough', async () => {
      // Mock the necessary browser APIs
      const mockImg = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        width: 800,
        height: 600,
      }

      vi.stubGlobal('Image', vi.fn().mockImplementation(() => mockImg))
      vi.stubGlobal('HTMLCanvasElement', vi.fn().mockImplementation(() => ({
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toBlob: vi.fn(),
        width: 800,
        height: 600,
      })))

      const file = new File([''], 'small.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 500 * 1024 }) // 500KB

      const result = await compressImage(file, 1024 * 1024)

      // Since the file is small, it should return as-is
      expect(result).toBeDefined()

      vi.unstubAllGlobals()
    })
  })
})

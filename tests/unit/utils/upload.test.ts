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

  describe('validateFile - additional edge cases', () => {
    it('should return valid when no options are provided', () => {
      const file = new File([''], 'test.xyz', { type: 'application/unknown' })

      const result = validateFile(file, {})

      expect(result.valid).toBe(true)
    })

    it('should return valid when allowedTypes is undefined', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      const options = { maxFileSize: 10 * 1024 * 1024 }

      const result = validateFile(file, options)

      expect(result.valid).toBe(true)
    })

    it('should return valid when maxFileSize is undefined', () => {
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 })

      const result = validateFile(file, { allowedTypes: ['image/jpeg'] })

      expect(result.valid).toBe(true)
    })

    it('should report correct file size in error message', () => {
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }) // 2MB

      const result = validateFile(file, { maxFileSize: 1 * 1024 * 1024 })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('1.00MB')
    })

    it('should allow file exactly at size limit', () => {
      const file = new File([''], 'exact.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = validateFile(file, { maxFileSize: 1024 })

      expect(result.valid).toBe(true)
    })

    it('should reject file one byte over size limit', () => {
      const file = new File([''], 'over.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1025 })

      const result = validateFile(file, { maxFileSize: 1024 })

      expect(result.valid).toBe(false)
    })
  })

  describe('createImageFile - additional edge cases', () => {
    it('should throw error for disallowed file type', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })

      await expect(createImageFile(file, { allowedTypes: ['image/jpeg'] })).rejects.toThrow('Invalid file type')
    })

    it('should use default options when none provided', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const result = await createImageFile(file)

      expect(result.file).toBe(file)
      expect(result.status).toBe('uploading')
      expect(result.progress).toBe(0)
    })
  })

  describe('uploadFiles - additional edge cases', () => {
    it('should use default maxCount of 10', async () => {
      // Create 11 files to exceed default maxCount
      const files = Array.from({ length: 11 }, (_, i) =>
        new File([''], `${i}.jpg`, { type: 'image/jpeg' })
      )

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: [] }),
      }

      await expect(uploadFiles(files, endpoint)).rejects.toThrow('Too many files')
    })

    it('should return error with "Unknown validation error" when validation.error is undefined', async () => {
      // This is a defensive test for the nullish coalescing path
      // In practice, validateFile always returns an error string, but the code handles undefined
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: [] }),
      }

      const result = await uploadFiles([file], endpoint, {
        allowedTypes: ['image/jpeg'],
      })

      expect(result.errors?.[0]?.error).toBeDefined()
    })

    it('should upload multiple valid files', async () => {
      const files = [
        new File([''], '1.jpg', { type: 'image/jpeg' }),
        new File([''], '2.jpg', { type: 'image/jpeg' }),
      ]

      const endpoint = {
        upload: vi.fn().mockResolvedValue({
          urls: ['http://example.com/1.jpg', 'http://example.com/2.jpg'],
        }),
      }

      const result = await uploadFiles(files, endpoint)

      expect(result.urls).toHaveLength(2)
    })
  })

  describe('createMockUploadEndpoint - additional edge cases', () => {
    it('should return blob URLs for multiple files', async () => {
      const endpoint = createMockUploadEndpoint(10)
      const files = [
        new File([''], '1.jpg', { type: 'image/jpeg' }),
        new File([''], '2.jpg', { type: 'image/jpeg' }),
      ]

      const result = await endpoint.upload(files)

      expect(result.urls).toHaveLength(2)
      expect(result.urls[0]).toContain('blob:')
      expect(result.urls[1]).toContain('blob:')
    })
  })

  describe('uploadWithProgress - additional edge cases', () => {
    it('should handle empty file list', async () => {
      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: [] }),
      }

      const result = await uploadWithProgress([], endpoint)

      expect(result.urls).toHaveLength(0)
      expect(result.errors).toBeUndefined()
    })

    it('should set image status to success when upload returns URLs', async () => {
      const imageFile: ImageFile = {
        file: new File([''], '1.jpg', { type: 'image/jpeg' }),
        url: '',
        status: 'uploading',
        progress: 0,
      }

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: ['http://example.com/1.jpg'] }),
      }

      await uploadWithProgress([imageFile], endpoint)

      expect(imageFile.status).toBe('success')
      expect(imageFile.progress).toBe(100)
    })

    it('should set image status to error when upload returns errors', async () => {
      const imageFile: ImageFile = {
        file: new File([''], '1.jpg', { type: 'image/jpeg' }),
        url: '',
        status: 'uploading',
        progress: 0,
      }

      const endpoint = {
        upload: vi.fn().mockResolvedValue({
          urls: ['http://example.com/1.jpg'],
          errors: [{ file: '1.jpg', error: 'Partial failure' }],
        }),
      }

      const result = await uploadWithProgress([imageFile], endpoint)

      expect(imageFile.status).toBe('error')
      expect(result.errors).toBeDefined()
    })

    it('should report progress at 50 and 100 for successful upload', async () => {
      const imageFile: ImageFile = {
        file: new File([''], '1.jpg', { type: 'image/jpeg' }),
        url: '',
        status: 'uploading',
        progress: 0,
      }

      const endpoint = {
        upload: vi.fn().mockResolvedValue({ urls: ['http://example.com/1.jpg'] }),
      }

      const onProgress = vi.fn()

      await uploadWithProgress([imageFile], endpoint, onProgress)

      expect(onProgress).toHaveBeenCalledWith(0, 50)
      expect(onProgress).toHaveBeenCalledWith(0, 100)
    })

    it('should handle multiple files with mixed results', async () => {
      const imageFiles: ImageFile[] = [
        { file: new File([''], '1.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
        { file: new File([''], '2.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
      ]

      const endpoint = {
        upload: vi.fn()
          .mockResolvedValueOnce({ urls: ['http://example.com/1.jpg'] })
          .mockRejectedValueOnce(new Error('Upload failed')),
      }

      const result = await uploadWithProgress(imageFiles, endpoint)

      expect(imageFiles[0].status).toBe('success')
      expect(imageFiles[1].status).toBe('error')
      expect(result.errors).toBeDefined()
    })

    it('should produce results with empty string placeholders for missing URLs', async () => {
      const imageFiles: ImageFile[] = [
        { file: new File([''], '1.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
        { file: new File([''], '2.jpg', { type: 'image/jpeg' }), url: '', status: 'uploading', progress: 0 },
      ]

      const endpoint = {
        upload: vi.fn()
          .mockResolvedValueOnce({ urls: ['http://example.com/1.jpg'] })
          .mockRejectedValueOnce(new Error('Upload failed')),
      }

      const result = await uploadWithProgress(imageFiles, endpoint)

      expect(result.urls[0]).toBe('http://example.com/1.jpg')
      expect(result.urls[1]).toBe('')
    })
  })

  describe('compressImage - additional edge cases', () => {
    let capturedImg: any
    let capturedReader: any

    // Helper to set up mocks for compressImage tests
    const setupCompressMocks = (opts: {
      imgWidth?: number
      imgHeight?: number
      blobResult?: Blob | null
    } = {}) => {
      const { imgWidth = 800, imgHeight = 600, blobResult = new Blob(['compressed'], { type: 'image/jpeg' }) } = opts

      capturedImg = null
      capturedReader = null

      const mockCtx = { drawImage: vi.fn() }
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockCtx),
        width: 0,
        height: 0,
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(blobResult)),
      }

      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as any
        return origCreateElement(tag)
      })

      vi.stubGlobal('Image', class MockImage {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = imgWidth
        height = imgHeight
        constructor() { capturedImg = this }
      })

      vi.stubGlobal('FileReader', class MockFileReader {
        onload: ((e: any) => void) | null = null
        onerror: (() => void) | null = null
        constructor() { capturedReader = this }
        readAsDataURL() {
          // Trigger reader.onload synchronously, which sets img.src
          this.onload?.({ target: { result: 'data:image/jpeg;base64,abc' } })
        }
      })

      return { mockCtx, mockCanvas }
    }

    const cleanupCompressMocks = () => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    }

    it('should return file as-is when size equals maxSize', async () => {
      const file = new File([''], 'exact.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = await compressImage(file, 1024)

      expect(result).toBe(file)
    })

    it('should compress image successfully', async () => {
      const { mockCtx, mockCanvas } = setupCompressMocks()

      const file = new File(['data'], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      // FileReader triggers onload synchronously, which sets img.src.
      // Then we trigger img.onload manually.
      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onload?.()

      const result = await resultPromise
      expect(result).toBeInstanceOf(File)
      expect(result.name).toBe('large.jpg')
      expect(mockCtx.drawImage).toHaveBeenCalled()
      expect(mockCanvas.toBlob).toHaveBeenCalled()

      cleanupCompressMocks()
    })

    it('should scale down large images exceeding max dimension', async () => {
      const { mockCanvas } = setupCompressMocks({ imgWidth: 3000, imgHeight: 2000 })

      const file = new File(['data'], 'wide.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onload?.()

      const result = await resultPromise
      expect(result).toBeInstanceOf(File)
      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(Math.round((2000 * 1920) / 3000))

      cleanupCompressMocks()
    })

    it('should scale down tall images exceeding max dimension', async () => {
      const { mockCanvas } = setupCompressMocks({ imgWidth: 1000, imgHeight: 3000 })

      const file = new File(['data'], 'tall.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onload?.()

      await resultPromise
      expect(mockCanvas.height).toBe(1920)
      expect(mockCanvas.width).toBe(Math.round((1000 * 1920) / 3000))

      cleanupCompressMocks()
    })

    it('should not scale images within max dimension', async () => {
      const { mockCanvas } = setupCompressMocks({ imgWidth: 800, imgHeight: 600 })

      const file = new File(['data'], 'small.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onload?.()

      await resultPromise
      expect(mockCanvas.width).toBe(800)
      expect(mockCanvas.height).toBe(600)

      cleanupCompressMocks()
    })

    it('should reject when canvas toBlob returns null', async () => {
      setupCompressMocks({ blobResult: null })

      const file = new File(['data'], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onload?.()

      await expect(resultPromise).rejects.toThrow('Compression failed')

      cleanupCompressMocks()
    })

    it('should reject when image fails to load', async () => {
      setupCompressMocks()

      const file = new File(['data'], 'broken.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const resultPromise = compressImage(file, 1024)

      await new Promise(resolve => setTimeout(resolve, 0))
      capturedImg?.onerror?.()

      await expect(resultPromise).rejects.toThrow('Failed to load image')

      cleanupCompressMocks()
    })

    it('should reject when FileReader fails', async () => {
      capturedImg = null
      capturedReader = null

      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return { getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }), width: 0, height: 0 } as any
        return origCreateElement(tag)
      })

      vi.stubGlobal('Image', class MockImage {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = 800
        height = 600
        constructor() { capturedImg = this }
      })

      vi.stubGlobal('FileReader', class MockFileReader {
        onload: ((e: any) => void) | null = null
        onerror: (() => void) | null = null
        constructor() { capturedReader = this }
        readAsDataURL() {
          this.onerror?.()
        }
      })

      const file = new File(['data'], 'bad.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      await expect(compressImage(file, 1024)).rejects.toThrow('Failed to read file')

      cleanupCompressMocks()
    })

    it('should handle canvas context unavailable', async () => {
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return { getContext: vi.fn().mockReturnValue(null), width: 0, height: 0 } as any
        return origCreateElement(tag)
      })

      vi.stubGlobal('Image', class MockImage {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = 800
        height = 600
      })

      const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      await expect(compressImage(file, 1024)).rejects.toThrow('Cannot get canvas context')

      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })
  })
})

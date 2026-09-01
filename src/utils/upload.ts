/**
 * Upload utilities for image handling
 */
import type { ImageFile, UploadResult } from '@/types'
import { readFileAsDataURL } from './helpers'

export interface UploadOptions {
  maxFileSize?: number
  maxCount?: number
  allowedTypes?: string[]
  onProgress?: (file: File, progress: number) => void
}

export interface UploadEndpoint {
  upload: (files: File[]) => Promise<UploadResult>
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: UploadOptions
): { valid: boolean; error?: string } {
  const { maxFileSize, allowedTypes } = options

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }
  }

  // Check file size
  if (maxFileSize && file.size > maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`,
    }
  }

  return { valid: true }
}

/**
 * Create image file object with preview
 */
export async function createImageFile(file: File, options: UploadOptions = {}): Promise<ImageFile> {
  const validation = validateFile(file, options)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const url = await readFileAsDataURL(file)

  return {
    file,
    url,
    status: 'uploading',
    progress: 0,
  }
}

/**
 * Upload files to endpoint
 */
export async function uploadFiles(
  files: File[],
  endpoint: UploadEndpoint,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { maxCount = 10 } = options

  // Validate count
  if (files.length > maxCount) {
    throw new Error(`Too many files. Maximum: ${maxCount}`)
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file, options)
    if (!validation.valid) {
      const errorMessage = validation.error ?? 'Unknown validation error'
      return {
        urls: [],
        errors: [{ file: file.name, error: errorMessage }],
      }
    }
  }

  try {
    const result = await endpoint.upload(files)
    return result
  } catch (error) {
    return {
      urls: [],
      errors: files.map((f) => ({
        file: f.name,
        error: (error as Error).message,
      })),
    }
  }
}

/**
 * Mock upload endpoint for development
 */
export function createMockUploadEndpoint(delay = 1000): UploadEndpoint {
  return {
    upload: async (files: File[]) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Simulate success (convert to blob URLs)
      const urls = files.map((file) => URL.createObjectURL(file))

      return { urls }
    },
  }
}

/**
 * Real upload endpoint using fetch
 */
export function createUploadEndpoint(apiUrl: string): UploadEndpoint {
  return {
    upload: async (files: File[]) => {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = (await response.json()) as UploadResult
      return result
    },
  }
}

/**
 * Batch upload with progress tracking
 */
export async function uploadWithProgress(
  imageFiles: ImageFile[],
  endpoint: UploadEndpoint,
  onProgress?: (index: number, progress: number) => void
): Promise<UploadResult> {
  const results: UploadResult = { urls: new Array(imageFiles.length).fill('') }
  const errors: UploadResult['errors'] = []

  // Upload files one by one
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i]

    try {
      // Update progress
      imageFile.progress = 50
      onProgress?.(i, 50)

      // Upload single file
      const result = await endpoint.upload([imageFile.file])

      if (result.urls.length > 0) {
        results.urls[i] = result.urls[0]
        imageFile.status = 'success'
        imageFile.progress = 100
        onProgress?.(i, 100)
      }

      if (result.errors) {
        errors.push(...result.errors)
        imageFile.status = 'error'
      }
    } catch (error) {
      errors.push({
        file: imageFile.file.name,
        error: (error as Error).message,
      })
      imageFile.status = 'error'
    }
  }

  if (errors.length > 0) {
    results.errors = errors
  }

  return results
}

/**
 * Compress image before upload (basic implementation)
 * For production, consider using a proper image compression library
 */
export async function compressImage(
  file: File,
  maxSize = 1024 * 1024 // 1MB
): Promise<File> {
  // If file is already small enough, return as is
  if (file.size <= maxSize) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Cannot get canvas context'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      const maxDimension = 1920

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else {
          width = (width * maxDimension) / height
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }))
          } else {
            reject(new Error('Compression failed'))
          }
        },
        file.type,
        0.85
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))

    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

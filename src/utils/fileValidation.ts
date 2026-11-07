/**
 * File validation utilities for upload size limits
 */

/**
 * File size limits for different media types
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024, // 20MB
} as const

export type MediaType = 'image' | 'video' | 'audio'

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  maxSize: string
}

/**
 * Validate file size against limits
 */
export function validateFileSize(file: File, mediaType: MediaType): ValidationResult {
  const limit = FILE_SIZE_LIMITS[mediaType]
  const maxSizeMB = (limit / (1024 * 1024)).toFixed(0)

  return {
    valid: file.size <= limit,
    maxSize: `${maxSizeMB}MB`,
  }
}

/**
 * Format file size for display
 * Re-exported from helpers for backward compatibility
 */
export { formatFileSize } from './helpers'

/**
 * Get media type from File object
 */
export function getMediaType(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image' // default fallback
}

/**
 * Config-driven batch validation options
 */
export interface FileValidationOptions {
  /** Max size in bytes; omit to use per-type FILE_SIZE_LIMITS defaults */
  maxImageSize?: number
  /** Allowed MIME types; omit to allow anything the file input accepts */
  allowedImageTypes?: string[]
  /** Max number of files accepted per message */
  maxCount?: number
}

export type FileRejectReason = 'size' | 'type' | 'count'

export interface FileValidationOutcome {
  accepted: File[]
  rejected: { file: File; reason: FileRejectReason }[]
}

/**
 * Batch-validate files against size/type/count constraints.
 * Order of `accepted` matches input order; the first `maxCount` files win.
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): FileValidationOutcome {
  const accepted: File[] = []
  const rejected: { file: File; reason: FileRejectReason }[] = []

  for (const file of files) {
    if (options.maxCount !== undefined && accepted.length >= options.maxCount) {
      rejected.push({ file, reason: 'count' })
      continue
    }

    if (options.allowedImageTypes && !options.allowedImageTypes.includes(file.type)) {
      rejected.push({ file, reason: 'type' })
      continue
    }

    const limit =
      options.maxImageSize ?? FILE_SIZE_LIMITS[getMediaType(file)]
    if (file.size > limit) {
      rejected.push({ file, reason: 'size' })
      continue
    }

    accepted.push(file)
  }

  return { accepted, rejected }
}

/**
 * File validation utilities for upload size limits
 */

/**
 * File size limits for different media types
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,   // 10MB
  video: 100 * 1024 * 1024,  // 100MB
  audio: 20 * 1024 * 1024    // 20MB
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
    maxSize: `${maxSizeMB}MB`
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Get media type from File object
 */
export function getMediaType(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image' // default fallback
}

/**
 * Validation utility functions
 */

/**
 * Check if value is a valid URL
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch (e) {
    // Invalid URL format - return false is the expected behavior
    return false
  }
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T
  } catch (e) {
    // Invalid JSON - return fallback is the expected behavior
    return fallback
  }
}

/**
 * Check if code is running in iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch (e) {
    // SecurityError (cross-origin access) - assume we're in iframe
    return true
  }
}

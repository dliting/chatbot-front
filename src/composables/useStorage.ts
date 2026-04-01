/**
 * Composable for localStorage persistence
 * Follows Single Responsibility Principle - only handles storage operations
 */
import type { Topic } from '@/types'
import { TOPIC_DEFAULTS } from '@/constants'

/**
 * Load topics from localStorage
 */
export function loadTopicsFromStorage(): Topic[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(TOPIC_DEFAULTS.STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // localStorage disabled, quota exceeded, or corrupted data - silently fail
  }

  return []
}

/**
 * Save topics to localStorage
 */
export function saveTopicsToStorage(topics: Topic[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(TOPIC_DEFAULTS.STORAGE_KEY, JSON.stringify(topics))
  } catch (e) {
    // localStorage disabled or quota exceeded - silently fail
  }
}

/**
 * Clear topics from localStorage
 */
export function clearTopicsFromStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(TOPIC_DEFAULTS.STORAGE_KEY)
  } catch (e) {
    // Silently fail
  }
}

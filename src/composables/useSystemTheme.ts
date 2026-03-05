/**
 * Composable for detecting and managing system theme
 */
import { ref } from 'vue'
import type { Theme } from '@/types'

export function useSystemTheme() {
  const systemTheme = ref<Theme>('light')

  /**
   * Get current system theme
   */
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  /**
   * Initialize system theme detection
   */
  const initSystemTheme = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    systemTheme.value = getSystemTheme()
  }

  return {
    systemTheme,
    getSystemTheme,
    initSystemTheme,
  }
}

/**
 * Unit tests for useSystemTheme composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSystemTheme } from '@/composables/useSystemTheme'

// Mock matchMedia
const mockMatchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

describe('useSystemTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', mockMatchMedia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getSystemTheme', () => {
    it('should return light theme when system is light', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { getSystemTheme } = useSystemTheme()
      expect(getSystemTheme()).toBe('light')
    })

    it('should return dark theme when system is dark', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { getSystemTheme } = useSystemTheme()
      expect(getSystemTheme()).toBe('dark')
    })

    it('should return light theme when window is undefined', () => {
      const originalWindow = globalThis.window
      // @ts-ignore
      delete globalThis.window

      const { getSystemTheme } = useSystemTheme()
      expect(getSystemTheme()).toBe('light')

      globalThis.window = originalWindow
    })
  })

  describe('initSystemTheme', () => {
    it('should initialize systemTheme ref', () => {
      const { systemTheme, initSystemTheme } = useSystemTheme()

      initSystemTheme()

      // After initialization, systemTheme should be set based on matchMedia
      expect(['light', 'dark']).toContain(systemTheme.value)
    })

    it('should set dark theme when system is dark', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { systemTheme, initSystemTheme } = useSystemTheme()

      initSystemTheme()

      expect(systemTheme.value).toBe('dark')
    })

    it('should set light theme when system is light', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { systemTheme, initSystemTheme } = useSystemTheme()

      initSystemTheme()

      expect(systemTheme.value).toBe('light')
    })
  })
})

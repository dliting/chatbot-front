/**
 * Unit tests for useUIState composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUIState } from '@/composables/useUIState'

describe('useUIState', () => {
  const defaultOptions = {
    defaultExpanded: true,
    panelMode: 'dialog' as const,
    initialTheme: 'light' as const,
    locale: 'en' as const,
  }

  beforeEach(() => {
    document.documentElement.setAttribute = vi.fn()
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with provided options', () => {
      const { ui } = useUIState(defaultOptions)

      expect(ui.isPanelOpen).toBe(true)
      expect(ui.panelMode).toBe('dialog')
      expect(ui.theme).toBe('light')
      expect(ui.locale).toBe('en')
      expect(ui.currentView).toBe('chat')
    })

    it('should initialize with panel closed when defaultExpanded is false', () => {
      const { ui } = useUIState({ ...defaultOptions, defaultExpanded: false })

      expect(ui.isPanelOpen).toBe(false)
    })

    it('should resolve auto panelMode to dialog when screen width is tablet-sized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true, configurable: true })

      const { ui } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      expect(ui.panelMode).toBe('dialog')
    })

    it('should set panelMode to dialog when auto on initialization', () => {
      // When panelMode is 'auto', the initial value is 'dialog' until updateScreenSize is called
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true })

      const { ui } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      expect(ui.panelMode).toBe('dialog') // auto resolves to dialog initially
    })

    it('should set panelMode to dialog when auto on initialization regardless of screen size', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true })

      const { ui } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      expect(ui.panelMode).toBe('dialog') // auto resolves to dialog initially
    })

    it('should resolve empty/falsy panelMode to dialog', () => {
      const { ui } = useUIState({ ...defaultOptions, panelMode: '' as any })

      expect(ui.panelMode).toBe('dialog')
    })

    it('should detect screen size on init', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true })

      const { ui } = useUIState(defaultOptions)

      expect(ui.screenWidth).toBe(800)
      expect(ui.isMobile).toBe(false) // 800 >= 768, so not mobile
    })

    it('should set isMobile to true when width < 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true })

      const { ui } = useUIState(defaultOptions)

      expect(ui.isMobile).toBe(true)
    })

    it('should set isMobile to false when width >= 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })

      const { ui } = useUIState(defaultOptions)

      expect(ui.isMobile).toBe(false)
    })
  })

  describe('System Theme Detection', () => {
    it('should resolve system theme to dark when matchMedia returns dark', () => {
      const mockAddEventListener = vi.fn()
      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
      })))

      const { ui, cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      expect(ui.theme).toBe('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')

      cleanupThemeListener()
      vi.unstubAllGlobals()
    })

    it('should resolve system theme to light when matchMedia returns light', () => {
      const mockAddEventListener = vi.fn()
      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
      })))

      const { ui, cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      expect(ui.theme).toBe('light')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')

      cleanupThemeListener()
      vi.unstubAllGlobals()
    })

    it('should default to light theme when window.matchMedia is not available', () => {
      const originalMatchMedia = window.matchMedia
      // @ts-expect-error - intentionally deleting for test
      delete window.matchMedia

      const { ui, cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      expect(ui.theme).toBe('light')

      window.matchMedia = originalMatchMedia
      cleanupThemeListener()
    })

    it('should not add theme change listener when initialTheme is not system', () => {
      const mockAddEventListener = vi.fn()
      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
      })))

      const { cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'light' })

      expect(mockAddEventListener).not.toHaveBeenCalled()

      cleanupThemeListener()
      vi.unstubAllGlobals()
    })

    it('should not add theme change listener when matchMedia is unavailable', () => {
      const originalMatchMedia = window.matchMedia
      // @ts-expect-error - intentionally deleting for test
      delete window.matchMedia

      const { cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      // Should not throw, and no listener should be registered
      cleanupThemeListener()

      window.matchMedia = originalMatchMedia
    })

    it('should update theme when system theme changes via listener', () => {
      let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null
      const mockAddEventListener = vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        capturedHandler = handler
      })
      const mockRemoveEventListener = vi.fn()

      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: false, // starts as light
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })))

      const { ui, cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      expect(ui.theme).toBe('light')

      // Simulate system theme change to dark
      if (capturedHandler) {
        capturedHandler({ matches: true } as MediaQueryListEvent)
      }

      expect(ui.theme).toBe('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')

      cleanupThemeListener()
      vi.unstubAllGlobals()
    })

    it('should update theme to light when system theme changes from dark to light', () => {
      let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null
      const mockAddEventListener = vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        capturedHandler = handler
      })
      const mockRemoveEventListener = vi.fn()

      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: true, // starts as dark
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })))

      const { ui, cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      expect(ui.theme).toBe('dark')

      // Simulate system theme change to light
      if (capturedHandler) {
        capturedHandler({ matches: false } as MediaQueryListEvent)
      }

      expect(ui.theme).toBe('light')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')

      cleanupThemeListener()
      vi.unstubAllGlobals()
    })
  })

  describe('cleanupThemeListener', () => {
    it('should remove event listener and clear references on cleanup', () => {
      const mockRemoveEventListener = vi.fn()
      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: mockRemoveEventListener,
      })))

      const { cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'system' })

      cleanupThemeListener()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))

      vi.unstubAllGlobals()
    })

    it('should not throw when cleanupThemeListener is called without listener being active', () => {
      // When initialTheme is not 'system', no listener is registered
      const { cleanupThemeListener } = useUIState({ ...defaultOptions, initialTheme: 'light' })

      expect(() => cleanupThemeListener()).not.toThrow()
    })
  })

  describe('togglePanel', () => {
    it('should toggle panel open state', () => {
      const { ui, togglePanel } = useUIState(defaultOptions)

      expect(ui.isPanelOpen).toBe(true)

      togglePanel()
      expect(ui.isPanelOpen).toBe(false)

      togglePanel()
      expect(ui.isPanelOpen).toBe(true)
    })

    it('should set panel to specific state', () => {
      const { ui, togglePanel } = useUIState(defaultOptions)

      togglePanel(false)
      expect(ui.isPanelOpen).toBe(false)

      togglePanel(true)
      expect(ui.isPanelOpen).toBe(true)
    })
  })

  describe('setTheme', () => {
    it('should set a specific theme and update document attribute', () => {
      const { ui, setTheme } = useUIState(defaultOptions)

      setTheme('dark')
      expect(ui.theme).toBe('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')

      setTheme('light')
      expect(ui.theme).toBe('light')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('should resolve system theme when setTheme is called with system', () => {
      vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })))

      const { ui, setTheme } = useUIState(defaultOptions)

      setTheme('system')
      expect(ui.theme).toBe('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')

      vi.unstubAllGlobals()
    })
  })

  describe('setCurrentView', () => {
    it('should set current view to topics', () => {
      const { ui, setCurrentView } = useUIState(defaultOptions)

      expect(ui.currentView).toBe('chat')

      setCurrentView('topics')
      expect(ui.currentView).toBe('topics')
    })

    it('should set current view to chat', () => {
      const { ui, setCurrentView } = useUIState(defaultOptions)

      setCurrentView('topics')
      expect(ui.currentView).toBe('topics')

      setCurrentView('chat')
      expect(ui.currentView).toBe('chat')
    })
  })

  describe('toggleView', () => {
    it('should toggle from chat to topics', () => {
      const { ui, toggleView } = useUIState(defaultOptions)

      expect(ui.currentView).toBe('chat')

      toggleView()
      expect(ui.currentView).toBe('topics')
    })

    it('should toggle from topics to chat', () => {
      const { ui, toggleView, setCurrentView } = useUIState(defaultOptions)

      setCurrentView('topics')
      toggleView()
      expect(ui.currentView).toBe('chat')
    })
  })

  describe('updateScreenSize', () => {
    it('should update screenWidth and isMobile', () => {
      const { ui, updateScreenSize } = useUIState(defaultOptions)

      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true })
      updateScreenSize()

      expect(ui.screenWidth).toBe(500)
      expect(ui.isMobile).toBe(true)
    })

    it('should auto-switch panelMode to fullscreen when mobile-sized with auto panelMode', () => {
      const { ui, updateScreenSize } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
      updateScreenSize()

      expect(ui.panelMode).toBe('fullscreen')
    })

    it('should auto-switch panelMode to dialog when tablet-sized with auto panelMode', () => {
      const { ui, updateScreenSize } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true, configurable: true })
      updateScreenSize()

      expect(ui.panelMode).toBe('dialog')
    })

    it('should auto-switch panelMode to sidebar when desktop-sized with auto panelMode', () => {
      const { ui, updateScreenSize } = useUIState({ ...defaultOptions, panelMode: 'auto' })

      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true })
      updateScreenSize()

      expect(ui.panelMode).toBe('sidebar')
    })

    it('should not change panelMode on resize when panelMode is explicitly set', () => {
      const { ui, updateScreenSize } = useUIState({ ...defaultOptions, panelMode: 'dialog' })

      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
      updateScreenSize()

      // panelMode should stay as dialog since it's not auto
      expect(ui.panelMode).toBe('dialog')
    })

    it('should auto-switch panelMode with empty/falsy panelMode', () => {
      const { ui, updateScreenSize } = useUIState({ ...defaultOptions, panelMode: '' as any })

      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
      updateScreenSize()

      expect(ui.panelMode).toBe('fullscreen')
    })
  })
})

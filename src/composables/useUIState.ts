/**
 * Composable for UI state management
 */
import { reactive } from 'vue'
import type { Theme, PanelMode, Locale } from '@/types'

/** Stored theme is always resolved ('system' is resolved on write via setTheme) */
export type ResolvedTheme = Exclude<Theme, 'system'>

export interface UIState {
  isPanelOpen: boolean
  panelMode: PanelMode
  theme: ResolvedTheme
  locale: Locale
  screenWidth: number
  isMobile: boolean
  currentView: 'topics' | 'chat'
}

interface UseUIStateOptions {
  defaultExpanded: boolean
  panelMode: PanelMode | 'auto'
  initialTheme: Theme
  locale: Locale
}

export function useUIState(options: Required<UseUIStateOptions>) {
  let initialized = false
  let mediaQueryList: MediaQueryList | null = null
  let handleThemeChange: ((e: MediaQueryListEvent) => void) | null = null

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const getInitialTheme = (): ResolvedTheme => {
    if (options.initialTheme === 'system') {
      return getSystemTheme()
    }
    return options.initialTheme
  }

  // UI State (safe defaults for SSR, updated on init())
  const ui = reactive<UIState>({
    isPanelOpen: options.defaultExpanded,
    panelMode: options.panelMode === 'auto' || !options.panelMode ? 'dialog' : options.panelMode,
    theme: getInitialTheme(),
    locale: options.locale,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    currentView: 'chat',
  })

  // Actions
  const togglePanel = (isOpen?: boolean) => {
    ui.isPanelOpen = isOpen ?? !ui.isPanelOpen
  }

  const setTheme = (theme: Theme) => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
    ui.theme = resolvedTheme
    if (initialized) {
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }
  }

  const setCurrentView = (view: 'topics' | 'chat') => {
    ui.currentView = view
  }

  const toggleView = () => {
    ui.currentView = ui.currentView === 'topics' ? 'chat' : 'topics'
  }

  const updateScreenSize = () => {
    ui.screenWidth = window.innerWidth
    ui.isMobile = ui.screenWidth < 768

    if (options.panelMode === 'auto' || !options.panelMode) {
      if (ui.isMobile) {
        ui.panelMode = 'fullscreen'
      } else if (ui.screenWidth < 1024) {
        ui.panelMode = 'dialog'
      } else {
        ui.panelMode = 'sidebar'
      }
    }
  }

  const initThemeListener = () => {
    if (options.initialTheme !== 'system') return
    if (typeof window === 'undefined' || !window.matchMedia) return

    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      ui.theme = newTheme
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    mediaQueryList.addEventListener('change', handleThemeChange)
  }

  const cleanupThemeListener = () => {
    if (mediaQueryList && handleThemeChange) {
      mediaQueryList.removeEventListener('change', handleThemeChange)
      mediaQueryList = null
      handleThemeChange = null
    }
  }

  /** Initialize side effects (call from onMounted) */
  const init = () => {
    initialized = true
    setTheme(ui.theme)
    initThemeListener()
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
  }

  /** Clean up all listeners (call from onUnmounted) */
  const cleanup = () => {
    cleanupThemeListener()
    if (initialized) {
      window.removeEventListener('resize', updateScreenSize)
      initialized = false
    }
  }

  return {
    ui,
    togglePanel,
    setTheme,
    setCurrentView,
    toggleView,
    updateScreenSize,
    init,
    cleanup,
  }
}

export type UseUIStateReturn = ReturnType<typeof useUIState>

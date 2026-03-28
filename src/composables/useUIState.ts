/**
 * Composable for UI state management
 */
import { reactive } from 'vue'
import type { Theme, PanelMode, Locale } from '@/types'

export interface UIState {
  isPanelOpen: boolean
  panelMode: PanelMode
  theme: Theme
  locale: Locale
  screenWidth: number
  isMobile: boolean
  currentView: 'sessions' | 'chat'
}

interface UseUIStateOptions {
  defaultExpanded: boolean
  panelMode: PanelMode | 'auto'
  initialTheme: Theme
  locale: Locale
}

export function useUIState(options: Required<UseUIStateOptions>) {
  // System theme detection
  let mediaQueryList: MediaQueryList | null = null
  let handleThemeChange: ((e: MediaQueryListEvent) => void) | null = null

  // Get system theme
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Determine initial theme based on config
  const getInitialTheme = (): Theme => {
    if (options.initialTheme === 'system') {
      return getSystemTheme()
    }
    return options.initialTheme
  }

  // Initialize theme change listener
  const initThemeListener = () => {
    if (options.initialTheme !== 'system') {
      return
    }

    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      ui.theme = newTheme
      document.documentElement.setAttribute('data-theme', newTheme)
    }

    mediaQueryList.addEventListener('change', handleThemeChange)
  }

  // Clean up theme listener
  const cleanupThemeListener = () => {
    if (mediaQueryList && handleThemeChange) {
      mediaQueryList.removeEventListener('change', handleThemeChange)
      mediaQueryList = null
      handleThemeChange = null
    }
  }

  // UI State
  const ui = reactive<UIState>({
    isPanelOpen: options.defaultExpanded,
    panelMode: options.panelMode === 'auto' || !options.panelMode ? 'dialog' : options.panelMode,
    theme: getInitialTheme(),
    locale: options.locale,
    screenWidth: window.innerWidth,
    isMobile: window.innerWidth < 768,
    currentView: 'chat',
  })

  // Actions
  const togglePanel = (isOpen?: boolean) => {
    ui.isPanelOpen = isOpen ?? !ui.isPanelOpen
  }

  const setTheme = (theme: Theme) => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
    ui.theme = resolvedTheme
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }

  const setCurrentView = (view: 'sessions' | 'chat') => {
    ui.currentView = view
  }

  const toggleView = () => {
    ui.currentView = ui.currentView === 'sessions' ? 'chat' : 'sessions'
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

  // Initialize theme
  setTheme(ui.theme)
  initThemeListener()

  return {
    ui,
    togglePanel,
    setTheme,
    setCurrentView,
    toggleView,
    updateScreenSize,
    cleanupThemeListener,
  }
}

export type UseUIStateReturn = ReturnType<typeof useUIState>

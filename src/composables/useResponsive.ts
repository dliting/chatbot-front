/**
 * Composable for responsive behavior
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface ResponsiveOptions {
  mobile?: number
  tablet?: number
  desktop?: number
}

const defaultBreakpoints: ResponsiveOptions = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
}

export function useResponsive(options: ResponsiveOptions = {}) {
  const breakpoints = { ...defaultBreakpoints, ...options }

  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)

  // Computed breakpoint
  const breakpoint = computed<Breakpoint>(() => {
    if (screenWidth.value < breakpoints.mobile!) return 'mobile'
    if (screenWidth.value < breakpoints.tablet!) return 'tablet'
    return 'desktop'
  })

  // Computed booleans
  const isMobile = computed(() => breakpoint.value === 'mobile')
  const isTablet = computed(() => breakpoint.value === 'tablet')
  const isDesktop = computed(() => breakpoint.value === 'desktop')

  const isMobileOrTablet = computed(() => isMobile.value || isTablet.value)

  // Computed panel mode
  const panelMode = computed(() => {
    if (isMobile.value) return 'fullscreen' as const
    if (isTablet.value) return 'dialog' as const
    return 'sidebar' as const
  })

  // Recommended panel width
  const recommendedPanelWidth = computed(() => {
    if (isMobile.value) return screenWidth.value
    if (isTablet.value) return Math.min(500, screenWidth.value - 40)
    return 400
  })

  // Update screen size
  const updateScreenSize = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
  }

  // Lifecycle hooks
  onMounted(() => {
    window.addEventListener('resize', updateScreenSize)
    updateScreenSize()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize)
  })

  return {
    // State
    screenWidth,
    screenHeight,

    // Computed
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    panelMode,
    recommendedPanelWidth,

    // Methods
    updateScreenSize,
  }
}

/**
 * Composable for element visibility based on breakpoint
 */
export function useVisibleAt(breakpoint: Breakpoint) {
  const { breakpoint: currentBreakpoint } = useResponsive()

  const isVisible = computed(() => {
    const order = ['mobile', 'tablet', 'desktop']
    const currentIndex = order.indexOf(currentBreakpoint.value)
    const targetIndex = order.indexOf(breakpoint)

    return currentIndex <= targetIndex
  })

  return { isVisible }
}

/**
 * Composable for media query
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)

  const updateMatches = () => {
    matches.value = window.matchMedia(query).matches
  }

  onMounted(() => {
    updateMatches()
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', updateMatches)

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', updateMatches)
    })
  })

  return { matches }
}

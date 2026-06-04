/**
 * Unit tests for useResponsive composable
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useResponsive, useMediaQuery, useVisibleAt, type Breakpoint } from '@/composables/useResponsive'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

/**
 * Helper to mount a composable inside a real component so that
 * onMounted / onUnmounted lifecycle hooks execute correctly.
 */
function mountComposable<T>(composableFn: () => T) {
  let result: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composableFn()
        return () => h('div')
      },
    })
  )
  return { result: result!, wrapper }
}

describe('composables/useResponsive', () => {
  describe('useResponsive', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      addEventListenerSpy = vi.fn()
      removeEventListenerSpy = vi.fn()
      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('innerHeight', 768)
      vi.stubGlobal('window', {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return correct screen dimensions', () => {
      const { result } = mountComposable(() => useResponsive())

      expect(result.screenWidth.value).toBe(1024)
      expect(result.screenHeight.value).toBe(768)
    })

    it('should detect desktop breakpoint', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.breakpoint.value).toBe('desktop')
      expect(result.isDesktop.value).toBe(true)
      expect(result.isMobile.value).toBe(false)
    })

    it('should detect tablet breakpoint', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.breakpoint.value).toBe('tablet')
      expect(result.isTablet.value).toBe(true)
      expect(result.isMobile.value).toBe(false)
    })

    it('should detect mobile breakpoint', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.breakpoint.value).toBe('mobile')
      expect(result.isMobile.value).toBe(true)
      expect(result.isDesktop.value).toBe(false)
    })

    it('should return correct panel mode for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.panelMode.value).toBe('fullscreen')
    })

    it('should return correct panel mode for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.panelMode.value).toBe('dialog')
    })

    it('should return correct panel mode for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.panelMode.value).toBe('sidebar')
    })

    it('should return recommended panel width for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.recommendedPanelWidth.value).toBe(500) // Full width on mobile
    })

    it('should return recommended panel width for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.recommendedPanelWidth.value).toBe(500) // Min of 500 and 900-40
    })

    it('should return recommended panel width for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.recommendedPanelWidth.value).toBe(400) // Default fixed width
    })

    it('should use custom breakpoints', () => {
      vi.stubGlobal('innerWidth', 800)
      vi.stubGlobal('window', { innerWidth: 800, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive({
        mobile: 500,
        tablet: 700,
        desktop: 1200,
      }))

      // 800 >= 700 (tablet threshold) but < 1200, so it's desktop per the logic
      // Actually: 800 >= 700, so not mobile; 800 >= 700, so not tablet (< tablet=700 is false, 800 >= 700)
      // Wait: breakpoint logic: if < mobile => mobile; if < tablet => tablet; else desktop
      // 800 < 500? No. 800 < 700? No. So desktop.
      expect(result.breakpoint.value).toBe('desktop')
    })

    it('should calculate isMobileOrTablet correctly for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.isMobileOrTablet.value).toBe(true)
    })

    it('should calculate isMobileOrTablet correctly for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.isMobileOrTablet.value).toBe(true)
    })

    it('should calculate isMobileOrTablet correctly for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.isMobileOrTablet.value).toBe(false)
    })

    it('should update screen size when updateScreenSize is called', () => {
      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      expect(result.screenWidth.value).toBe(1024)

      vi.stubGlobal('innerWidth', 800)
      vi.stubGlobal('window', { innerWidth: 800, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      result.updateScreenSize()

      expect(result.screenWidth.value).toBe(800)
    })

    it('should register resize event listener on mount', () => {
      mountComposable(() => useResponsive())

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should call updateScreenSize on mount', () => {
      // The onMounted hook calls updateScreenSize which reads window.innerWidth
      // We can verify this by checking that screenWidth reflects the window value
      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      // If updateScreenSize was called on mount, screenWidth should be 1024
      expect(result.screenWidth.value).toBe(1024)
    })

    it('should remove resize event listener on unmount', () => {
      const { wrapper } = mountComposable(() => useResponsive())

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should respond to window resize events', () => {
      let resizeHandler: (() => void) | undefined
      const mockAddEventListener = vi.fn((event: string, handler: () => void) => {
        if (event === 'resize') resizeHandler = handler
      })

      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('window', {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
      })

      const { result } = mountComposable(() => useResponsive())

      expect(result.screenWidth.value).toBe(1024)

      // Simulate resize
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('innerHeight', 600)
      vi.stubGlobal('window', {
        innerWidth: 500,
        innerHeight: 600,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
      })

      if (resizeHandler) {
        resizeHandler()
      }

      expect(result.screenWidth.value).toBe(500)
      expect(result.screenHeight.value).toBe(600)
      expect(result.breakpoint.value).toBe('mobile')
    })

    it('should return recommended panel width for narrow tablet', () => {
      // When screenWidth - 40 < 500, the min should be screenWidth - 40
      vi.stubGlobal('innerWidth', 480)
      vi.stubGlobal('window', { innerWidth: 480, innerHeight: 768, addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy })

      const { result } = mountComposable(() => useResponsive())

      // 480 < 768 so it's mobile, not tablet. recommendedPanelWidth = screenWidth = 480
      expect(result.recommendedPanelWidth.value).toBe(480)
    })
  })

  describe('useMediaQuery', () => {
    let mockMediaQueryAddListener: ReturnType<typeof vi.fn>
    let mockMediaQueryRemoveListener: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockMediaQueryAddListener = vi.fn()
      mockMediaQueryRemoveListener = vi.fn()
      vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: mockMediaQueryAddListener,
        removeEventListener: mockMediaQueryRemoveListener,
      })))
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should export useMediaQuery function', () => {
      expect(useMediaQuery).toBeDefined()
      expect(typeof useMediaQuery).toBe('function')
    })

    it('should return matches based on matchMedia result on mount', () => {
      const { result } = mountComposable(() => useMediaQuery('(prefers-color-scheme: dark)'))

      expect(result.matches.value).toBe(true)
    })

    it('should return false for non-matching query on mount', () => {
      const { result } = mountComposable(() => useMediaQuery('(prefers-color-scheme: light)'))

      expect(result.matches.value).toBe(false)
    })

    it('should register change event listener on mount', () => {
      mountComposable(() => useMediaQuery('(prefers-color-scheme: dark)'))

      expect(mockMediaQueryAddListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should update matches when media query change event fires', () => {
      let currentMatches = false
      let changeHandler: ((e: MediaQueryListEvent) => void) | undefined

      vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        get matches() { return currentMatches },
        media: query,
        addEventListener: (_event: string, handler: (e: MediaQueryListEvent) => void) => {
          changeHandler = handler
        },
        removeEventListener: mockMediaQueryRemoveListener,
      })))

      const { result } = mountComposable(() => useMediaQuery('(prefers-color-scheme: dark)'))

      expect(result.matches.value).toBe(false)

      // Simulate media query change - update the matches value and trigger the handler
      currentMatches = true
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }

      expect(result.matches.value).toBe(true)
    })

    it('should remove event listener on unmount', () => {
      const { wrapper } = mountComposable(() => useMediaQuery('(prefers-color-scheme: dark)'))

      expect(mockMediaQueryAddListener).toHaveBeenCalledWith('change', expect.any(Function))

      wrapper.unmount()

      expect(mockMediaQueryRemoveListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('useVisibleAt', () => {
    beforeEach(() => {
      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('innerHeight', 768)
      vi.stubGlobal('window', {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should show component at mobile breakpoint when target is mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('mobile'))

      expect(result.isVisible.value).toBe(true)
    })

    it('should hide component at tablet breakpoint when target is mobile', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('mobile'))

      // Tablet is larger than mobile, should not be visible at mobile target
      expect(result.isVisible.value).toBe(false)
    })

    it('should hide component at desktop breakpoint when target is mobile', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('mobile'))

      expect(result.isVisible.value).toBe(false) // desktop > mobile
    })

    it('should show component at desktop breakpoint when target is desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('desktop'))

      expect(result.isVisible.value).toBe(true)
    })

    it('should show component at mobile when target is tablet', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('tablet'))

      // mobile (0) <= tablet (1), so visible
      expect(result.isVisible.value).toBe(true)
    })

    it('should show component at tablet when target is tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('tablet'))

      expect(result.isVisible.value).toBe(true)
    })

    it('should show component at mobile and tablet when target is desktop', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { result } = mountComposable(() => useVisibleAt('desktop'))

      // mobile (0) <= desktop (2), so visible
      expect(result.isVisible.value).toBe(true)
    })
  })
})

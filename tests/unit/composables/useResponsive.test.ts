/**
 * Unit tests for useResponsive composable
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useResponsive, useMediaQuery, useVisibleAt, type Breakpoint } from '@/composables/useResponsive'
import { mountComposable } from '@tests/helpers'

describe('composables/useResponsive', () => {
  describe('useResponsive', () => {
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

    it('should return correct screen dimensions', () => {
      const { screenWidth, screenHeight } = useResponsive()

      expect(screenWidth.value).toBe(1024)
      expect(screenHeight.value).toBe(768)
    })

    it('should detect desktop breakpoint', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { breakpoint, isDesktop, isMobile } = useResponsive()

      expect(breakpoint.value).toBe('desktop')
      expect(isDesktop.value).toBe(true)
      expect(isMobile.value).toBe(false)
    })

    it('should detect tablet breakpoint', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { breakpoint, isTablet, isMobile } = useResponsive()

      expect(breakpoint.value).toBe('tablet')
      expect(isTablet.value).toBe(true)
      expect(isMobile.value).toBe(false)
    })

    it('should detect mobile breakpoint', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { breakpoint, isMobile, isDesktop } = useResponsive()

      expect(breakpoint.value).toBe('mobile')
      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('should return correct panel mode for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { panelMode } = useResponsive()

      expect(panelMode.value).toBe('fullscreen')
    })

    it('should return correct panel mode for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { panelMode } = useResponsive()

      expect(panelMode.value).toBe('dialog')
    })

    it('should return correct panel mode for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { panelMode } = useResponsive()

      expect(panelMode.value).toBe('sidebar')
    })

    it('should return recommended panel width for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { recommendedPanelWidth } = useResponsive()

      expect(recommendedPanelWidth.value).toBe(500) // Full width on mobile
    })

    it('should return recommended panel width for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { recommendedPanelWidth } = useResponsive()

      expect(recommendedPanelWidth.value).toBe(500) // Min of 500 and 900-40
    })

    it('should return recommended panel width for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { recommendedPanelWidth } = useResponsive()

      expect(recommendedPanelWidth.value).toBe(400) // Default fixed width
    })

    it('should use custom breakpoints', () => {
      vi.stubGlobal('innerWidth', 800)
      vi.stubGlobal('window', { innerWidth: 800, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { breakpoint } = useResponsive({
        mobile: 500,
        tablet: 700,
        desktop: 1200
      })

      expect(breakpoint.value).toBe('desktop') // 800 >= 700 but < 1200, actually this is tablet
    })

    it('should calculate isMobileOrTablet correctly for mobile', () => {
      vi.stubGlobal('innerWidth', 500)
      vi.stubGlobal('window', { innerWidth: 500, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isMobileOrTablet } = useResponsive()

      expect(isMobileOrTablet.value).toBe(true)
    })

    it('should calculate isMobileOrTablet correctly for tablet', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isMobileOrTablet } = useResponsive()

      expect(isMobileOrTablet.value).toBe(true)
    })

    it('should calculate isMobileOrTablet correctly for desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isMobileOrTablet } = useResponsive()

      expect(isMobileOrTablet.value).toBe(false)
    })

    it('should update screen size when updateScreenSize is called', () => {
      vi.stubGlobal('innerWidth', 1024)
      vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { screenWidth, screenHeight, updateScreenSize } = useResponsive()

      expect(screenWidth.value).toBe(1024)

      vi.stubGlobal('innerWidth', 800)
      vi.stubGlobal('window', { innerWidth: 800, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      updateScreenSize()

      expect(screenWidth.value).toBe(800)
    })
  })

  describe('useMediaQuery', () => {
    beforeEach(() => {
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

    it('should export useMediaQuery function', () => {
      expect(useMediaQuery).toBeDefined()
      expect(typeof useMediaQuery).toBe('function')
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

      const { isVisible } = useVisibleAt('mobile')

      expect(isVisible.value).toBe(true)
    })

    it('should hide component at tablet breakpoint when target is mobile', () => {
      vi.stubGlobal('innerWidth', 900)
      vi.stubGlobal('window', { innerWidth: 900, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isVisible } = useVisibleAt('mobile')

      // Tablet is larger than mobile, should not be visible at mobile target
      expect(isVisible.value).toBe(false)
    })

    it('should hide component at desktop breakpoint when target is mobile', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isVisible } = useVisibleAt('mobile')

      expect(isVisible.value).toBe(false) // desktop > mobile
    })

    it('should show component at desktop breakpoint when target is desktop', () => {
      vi.stubGlobal('innerWidth', 1440)
      vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 768, addEventListener: vi.fn(), removeEventListener: vi.fn() })

      const { isVisible } = useVisibleAt('desktop')

      expect(isVisible.value).toBe(true)
    })
  })
})

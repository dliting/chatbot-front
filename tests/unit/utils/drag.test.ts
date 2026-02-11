/**
 * Unit tests for drag utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getInitialPosition, snapToEdge } from '@/utils/drag'

describe('utils/drag', () => {
  describe('getInitialPosition', () => {
    const mockElementSize = { width: 56, height: 56 }
    const mockViewportSize = { width: 1920, height: 1080 }
    const margin = 16

    beforeEach(() => {
      // Mock window dimensions
      vi.stubGlobal('innerWidth', mockViewportSize.width)
      vi.stubGlobal('innerHeight', mockViewportSize.height)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return bottom-right position by default', () => {
      const pos = getInitialPosition('bottom-right', mockElementSize, margin)

      expect(pos.x).toBe(mockViewportSize.width - mockElementSize.width - margin)
      expect(pos.y).toBe(mockViewportSize.height - mockElementSize.height - margin)
    })

    it('should return top-left position', () => {
      const pos = getInitialPosition('top-left', mockElementSize, margin)

      expect(pos.x).toBe(margin)
      expect(pos.y).toBe(margin)
    })

    it('should return top-right position', () => {
      const pos = getInitialPosition('top-right', mockElementSize, margin)

      expect(pos.x).toBe(mockViewportSize.width - mockElementSize.width - margin)
      expect(pos.y).toBe(margin)
    })

    it('should return bottom-left position', () => {
      const pos = getInitialPosition('bottom-left', mockElementSize, margin)

      expect(pos.x).toBe(margin)
      expect(pos.y).toBe(mockViewportSize.height - mockElementSize.height - margin)
    })
  })

  describe('snapToEdge', () => {
    const mockElementSize = { width: 56, height: 56 }
    const mockViewportSize = { width: 1920, height: 1080 }
    const threshold = 50

    beforeEach(() => {
      vi.stubGlobal('innerWidth', mockViewportSize.width)
      vi.stubGlobal('innerHeight', mockViewportSize.height)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should snap to left edge when close', () => {
      // Position 40 is within threshold (50) of left edge (0 + margin = 16)
      const pos = { x: 40, y: 500 }
      const snapped = snapToEdge(pos, mockElementSize, mockViewportSize, threshold)

      expect(snapped.x).toBe(16) // margin
    })

    it('should snap to right edge when close', () => {
      const pos = { x: mockViewportSize.width - 60, y: 500 }
      const snapped = snapToEdge(pos, mockElementSize, mockViewportSize, threshold)

      expect(snapped.x).toBe(mockViewportSize.width - mockElementSize.width - 16)
    })

    it('should snap to top edge when close', () => {
      const pos = { x: 500, y: 40 }
      const snapped = snapToEdge(pos, mockElementSize, mockViewportSize, threshold)

      expect(snapped.y).toBe(16) // margin
    })

    it('should snap to bottom edge when close', () => {
      const pos = { x: 500, y: mockViewportSize.height - 40 }
      const snapped = snapToEdge(pos, mockElementSize, mockViewportSize, threshold)

      expect(snapped.y).toBe(mockViewportSize.height - mockElementSize.height - 16)
    })

    it('should not snap when not close to edge', () => {
      const pos = { x: 500, y: 500 }
      const snapped = snapToEdge(pos, mockElementSize, mockViewportSize, threshold)

      expect(snapped.x).toBe(500)
      expect(snapped.y).toBe(500)
    })
  })
})

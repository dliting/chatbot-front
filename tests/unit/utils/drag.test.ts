/**
 * Unit tests for drag utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getInitialPosition, snapToEdge, makeDraggable } from '@/utils/drag'

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

  describe('makeDraggable', () => {
    it('should add mousedown listener to element', () => {
      const el = document.createElement('div')
      const addSpy = vi.spyOn(el, 'addEventListener')

      makeDraggable(el)

      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should set element cursor to grab', () => {
      const el = document.createElement('div')

      makeDraggable(el)

      expect(el.style.cursor).toBe('grab')
    })

    it('should set element position to fixed', () => {
      const el = document.createElement('div')

      makeDraggable(el)

      expect(el.style.position).toBe('fixed')
    })

    it('should call onDragStart on mousedown', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragStart = vi.fn()

      makeDraggable(el, { onDragStart })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))

      expect(onDragStart).toHaveBeenCalled()
      document.body.removeChild(el)
    })

    it('should not call onDragStart for non-left button', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragStart = vi.fn()

      makeDraggable(el, { onDragStart })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 2 }))

      expect(onDragStart).not.toHaveBeenCalled()
      document.body.removeChild(el)
    })

    it('should call onDragMove during drag', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragMove = vi.fn()

      makeDraggable(el, { onDragMove, throttleMs: 0 })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }))

      expect(onDragMove).toHaveBeenCalled()
      document.dispatchEvent(new MouseEvent('mouseup'))
      document.body.removeChild(el)
    })

    it('should call onDragEnd on mouseup', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragEnd = vi.fn()

      makeDraggable(el, { onDragEnd, throttleMs: 0 })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }))
      document.dispatchEvent(new MouseEvent('mouseup'))

      expect(onDragEnd).toHaveBeenCalled()
      document.body.removeChild(el)
    })

    it('should not call onDragMove when not dragging', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragMove = vi.fn()

      makeDraggable(el, { onDragMove, throttleMs: 0 })

      // Mouse move without mousedown should not trigger drag
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }))

      expect(onDragMove).not.toHaveBeenCalled()
      document.body.removeChild(el)
    })

    it('should set cursor to grabbing during drag', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      makeDraggable(el, { throttleMs: 0 })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))

      expect(el.style.cursor).toBe('grabbing')

      document.dispatchEvent(new MouseEvent('mouseup'))

      expect(el.style.cursor).toBe('grab')
      document.body.removeChild(el)
    })

    it('should clean up event listeners via returned function', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const onDragMove = vi.fn()

      const cleanup = makeDraggable(el, { onDragMove, throttleMs: 0 })

      // Start drag
      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }))
      expect(onDragMove).toHaveBeenCalledTimes(1)

      // Cleanup
      cleanup()

      // Drag events after cleanup should not fire
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      expect(onDragMove).toHaveBeenCalledTimes(1)

      document.body.removeChild(el)
    })

    it('should constrain position when boundary is provided', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const boundary = document.createElement('div')
      boundary.style.width = '500px'
      boundary.style.height = '500px'
      document.body.appendChild(boundary)

      const onDragMove = vi.fn()
      makeDraggable(el, { onDragMove, boundary, throttleMs: 0 })

      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 600 }))

      // Position should be constrained within boundary
      expect(onDragMove).toHaveBeenCalled()

      document.dispatchEvent(new MouseEvent('mouseup'))
      document.body.removeChild(el)
      document.body.removeChild(boundary)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResizeHandle } from '@/composables/useResizeHandle'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Helper to simulate mouse drag
function simulateDrag(startX: number, endX: number) {
  const mouseDown = new MouseEvent('mousedown', { clientX: startX })
  const mouseMove = new MouseEvent('mousemove', { clientX: endX })
  const mouseUp = new MouseEvent('mouseup', { clientX: endX })

  document.dispatchEvent(mouseDown)
  document.dispatchEvent(mouseMove)
  document.dispatchEvent(mouseUp)
}

describe('useResizeHandle', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  it('should initialize width to initialWidth', () => {
    const { width } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
    })
    expect(width.value).toBe(280)
  })

  it('should restore width from localStorage', () => {
    localStorageMock.setItem('test-key', '350')
    const { width } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      storageKey: 'test-key',
    })
    expect(width.value).toBe(350)
  })

  it('should fall back to initialWidth if stored value is out of range', () => {
    localStorageMock.setItem('test-key', '100')
    const { width } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      storageKey: 'test-key',
    })
    expect(width.value).toBe(280)
  })

  it('should update width on mouse drag (direction=right)', () => {
    const { width, startResize, isResizing } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      direction: 'right',
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    expect(isResizing.value).toBe(true)

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 170 }))
    expect(width.value).toBe(350) // 280 + (170 - 100) = 350

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 170 }))
    expect(isResizing.value).toBe(false)
  })

  it('should update width on mouse drag (direction=left)', () => {
    const { width, startResize } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      direction: 'left',
    })

    startResize(new MouseEvent('mousedown', { clientX: 170 }))
    // direction=left: delta = startX - clientX = 170 - 130 = 40
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 130 }))
    expect(width.value).toBe(320) // 280 + 40 = 320

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 130 }))
  })

  it('should clamp width to minWidth on drag', () => {
    const { width, startResize } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      direction: 'right',
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    // Dragging far left: 280 + (50 - 100) = 230, but let's go further
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: -200 }))
    expect(width.value).toBe(200) // clamped to minWidth

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: -200 }))
  })

  it('should clamp width to maxWidth on drag', () => {
    const { width, startResize } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      direction: 'right',
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 1000 }))
    expect(width.value).toBe(500) // clamped to maxWidth

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 1000 }))
  })

  it('should persist width to localStorage on mouseup', () => {
    const { width, startResize } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      storageKey: 'sidebar-width',
      direction: 'right',
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 170 }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 170 }))

    expect(localStorageMock.getItem('sidebar-width')).toBe('350')
  })

  it('should reset width on resetWidth()', () => {
    const { width, startResize, resetWidth } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
      storageKey: 'sidebar-width',
      direction: 'right',
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 170 }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 170 }))
    expect(width.value).toBe(350)

    resetWidth()
    expect(width.value).toBe(280)
    expect(localStorageMock.getItem('sidebar-width')).toBe('280')
  })

  it('should set cursor to col-resize during drag and restore on mouseup', () => {
    const { startResize, isResizing } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
    })

    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    expect(isResizing.value).toBe(true)
    expect(document.body.style.cursor).toBe('col-resize')

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100 }))
    expect(isResizing.value).toBe(false)
    expect(document.body.style.cursor).toBe('')
  })

  it('should clean up document listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { startResize } = useResizeHandle({
      initialWidth: 280,
      minWidth: 200,
      maxWidth: 500,
    })

    // Start and finish a drag
    startResize(new MouseEvent('mousedown', { clientX: 100 }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100 }))

    // The mouseup handler removes the listeners — check that removeEventListener was called
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  })
})
import { ref, onUnmounted } from 'vue'

interface UseResizeHandleOptions {
  initialWidth: number
  minWidth: number
  maxWidth: number
  storageKey?: string
  direction?: 'left' | 'right'
}

export function useResizeHandle(options: UseResizeHandleOptions) {
  const { initialWidth, minWidth, maxWidth, storageKey, direction = 'right' } = options

  // Restore from localStorage if available
  const savedWidth = storageKey
    ? (() => {
        try {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsed = Number(stored)
            if (parsed >= minWidth && parsed <= maxWidth) return parsed
          }
        } catch { /* ignore */ }
        return null
      })()
    : null

  const width = ref(savedWidth ?? initialWidth)
  const isResizing = ref(false)

  let startX = 0
  let startWidth = 0

  const onMouseMove = (e: MouseEvent) => {
    const delta = direction === 'right'
      ? e.clientX - startX
      : startX - e.clientX

    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
    width.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    if (storageKey) {
      try { localStorage.setItem(storageKey, String(width.value)) } catch { /* ignore */ }
    }
  }

  const startResize = (e: MouseEvent) => {
    e.preventDefault()
    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    startX = e.clientX
    startWidth = width.value
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const resetWidth = () => {
    width.value = initialWidth
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(initialWidth)) } catch { /* ignore */ }
    }
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  })

  return { width, isResizing, startResize, resetWidth }
}
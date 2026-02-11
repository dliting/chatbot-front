/**
 * Drag utilities for draggable components
 */
import type { Point } from '@/types'
import { throttle } from './helpers'

export interface DragOptions {
  onDragStart?: (position: Point) => void
  onDragMove?: (position: Point) => void
  onDragEnd?: (position: Point) => void
  throttleMs?: number
  boundary?: HTMLElement | null
}

export interface DragState {
  isDragging: boolean
  startPos: Point
  currentPos: Point
  offset: Point
}

/**
 * Create a draggable element
 */
export function makeDraggable(
  element: HTMLElement,
  options: DragOptions = {}
): () => void {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    throttleMs = 16, // ~60fps
    boundary = null,
  } = options

  let state: DragState = {
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  }

  // Get element's current position
  const getPosition = (): Point => {
    const rect = element.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }

  // Constrain position within boundary
  const constrainPosition = (pos: Point, elemSize: { width: number; height: number }): Point => {
    if (!boundary) {
      return pos
    }

    const boundaryRect = boundary.getBoundingClientRect()
    const maxX = boundaryRect.width - elemSize.width
    const maxY = boundaryRect.height - elemSize.height

    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY)),
    }
  }

  // Handle mouse down
  const handleMouseDown = (event: MouseEvent) => {
    // Only left mouse button
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const pos = getPosition()
    const rect = element.getBoundingClientRect()

    state = {
      isDragging: true,
      startPos: { x: event.clientX, y: event.clientY },
      currentPos: pos,
      offset: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    }

    element.style.cursor = 'grabbing'
    element.style.transition = 'none'
    element.style.willChange = 'transform'

    onDragStart?.(pos)

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle mouse move (throttled)
  const handleMouseMove = throttle((event: MouseEvent) => {
    if (!state.isDragging) return

    event.preventDefault()

    const rect = element.getBoundingClientRect()
    let newPos: Point = {
      x: event.clientX - state.offset.x,
      y: event.clientY - state.offset.y,
    }

    // Constrain within boundary if provided
    newPos = constrainPosition(newPos, { width: rect.width, height: rect.height })

    state.currentPos = newPos

    // Use transform for better performance
    element.style.transform = `translate(${newPos.x}px, ${newPos.y}px)`

    onDragMove?.(newPos)
  }, throttleMs)

  // Handle mouse up
  const handleMouseUp = () => {
    if (!state.isDragging) return

    state.isDragging = false

    element.style.cursor = 'grab'
    element.style.transition = ''
    element.style.willChange = ''

    // Apply final position as left/top for persistence
    element.style.left = `${state.currentPos.x}px`
    element.style.top = `${state.currentPos.y}px`
    element.style.transform = ''

    onDragEnd?.(state.currentPos)

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Setup element
  element.style.cursor = 'grab'
  element.style.position = 'fixed'
  element.style.userSelect = 'none'

  element.addEventListener('mousedown', handleMouseDown)

  // Return cleanup function
  return () => {
    element.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

/**
 * Snap position to nearest edge
 */
export function snapToEdge(
  position: Point,
  elementSize: { width: number; height: number },
  viewportSize: { width: number; height: number },
  threshold = 50
): Point {
  const margin = 16
  const { x, y } = position
  const { width: elemWidth, height: elemHeight } = elementSize
  const { width: viewportWidth, height: viewportHeight } = viewportSize

  // Determine closest edge
  const distanceToLeft = x
  const distanceToRight = viewportWidth - elemWidth - x
  const distanceToTop = y
  const distanceToBottom = viewportHeight - elemHeight - y

  let newX = x
  let newY = y

  // Snap horizontally
  if (distanceToLeft < threshold) {
    newX = margin
  } else if (distanceToRight < threshold) {
    newX = viewportWidth - elemWidth - margin
  }

  // Snap vertically
  if (distanceToTop < threshold) {
    newY = margin
  } else if (distanceToBottom < threshold) {
    newY = viewportHeight - elemHeight - margin
  }

  return { x: newX, y: newY }
}

/**
 * Get initial position based on config
 */
export function getInitialPosition(
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  elementSize: { width: number; height: number },
  margin = 16
): Point {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  switch (position) {
    case 'top-left':
      return { x: margin, y: margin }
    case 'top-right':
      return { x: viewportWidth - elementSize.width - margin, y: margin }
    case 'bottom-left':
      return { x: margin, y: viewportHeight - elementSize.height - margin }
    case 'bottom-right':
    default:
      return {
        x: viewportWidth - elementSize.width - margin,
        y: viewportHeight - elementSize.height - margin,
      }
  }
}

<template>
  <Transition :name="transitionName">
    <div
      v-if="isOpen"
      :class="classes"
      :style="panelStyle"
      ref="panelRef"
    >
      <!-- Resize handles (only for floating mode - all 8 directions) -->
      <template v-if="isFloating && isResizable">
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--n" @mousedown="startResize($event, 'n')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--s" @mousedown="startResize($event, 's')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--e" @mousedown="startResize($event, 'e')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--w" @mousedown="startResize($event, 'w')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--ne" @mousedown="startResize($event, 'ne')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--nw" @mousedown="startResize($event, 'nw')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--se" @mousedown="startResize($event, 'se')"></div>
        <div class="chatbot-panel__resize-handle chatbot-panel__resize-handle--sw" @mousedown="startResize($event, 'sw')"></div>
      </template>

      <!-- Header (Draggable) -->
      <div
        class="chatbot-panel__header"
        :class="{ 'chatbot-panel__header--draggable': isDraggable && isFloating }"
        @mousedown="startDrag"
      >
        <div class="chatbot-panel__title">
          <slot name="title">{{ title }}</slot>
        </div>

        <div class="chatbot-panel__actions">
          <!-- Theme toggle slot -->
          <slot name="theme-toggle">
            <button
              v-if="showThemeToggle"
              class="chatbot-panel__action-btn"
              @click="$emit('toggle-theme')"
              :title="theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
            >
              <svg v-if="theme === 'light'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z"/>
              </svg>
            </button>
          </slot>

          <!-- Close button -->
          <button
            class="chatbot-panel__action-btn chatbot-panel__close-btn"
            @click="handleClose"
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="chatbot-panel__body">
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { PanelMode, Position, Theme } from '@/types'

interface Props {
  isOpen: boolean
  mode: PanelMode
  position?: Position
  theme?: Theme
  title?: string
  width?: number
  height?: number
  showThemeToggle?: boolean
  draggable?: boolean
  resizable?: boolean
  minWidth?: number
  minHeight?: number
  rememberPosition?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  theme: 'light',
  title: 'AI Assistant',
  width: 400,
  height: 600,
  showThemeToggle: true,
  draggable: true,
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  rememberPosition: true,
})

interface Emits {
  (e: 'close'): void
  (e: 'toggle-theme'): void
}

const emit = defineEmits<Emits>()

// Refs
const panelRef = ref<HTMLElement>()

// State for floating panel
const STORAGE_KEY = 'chatbot-floating-position'
const isFloating = computed(() => props.mode === 'floating')

// Position and size state
const panelState = ref({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height,
})

const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const resizeDirection = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, panelX: 0, panelY: 0 })

// Computed
const isDraggable = computed(() => props.draggable && isFloating.value)
const isResizable = computed(() => props.resizable && isFloating.value)

const classes = computed(() => [
  'chatbot-panel',
  `chatbot-panel--${props.mode}`,
  `chatbot-panel--${props.position}`,
  `chatbot-panel--${props.theme}`,
  isDragging.value && 'chatbot-panel--dragging',
  isResizing.value && 'chatbot-panel--resizing',
])

const panelStyle = computed(() => {
  const baseStyle: Record<string, string> = {
    overflow: 'visible', // Allow resize handles to be visible
  }

  if (props.mode === 'sidebar') {
    baseStyle.width = `${props.width}px`
  } else if (props.mode === 'fullscreen') {
    baseStyle.width = '100%'
    baseStyle.height = '100%'
  } else if (isFloating.value) {
    // Use stored position for floating mode
    baseStyle.width = `${panelState.value.width}px`
    baseStyle.height = `${panelState.value.height}px`
    baseStyle.left = `${panelState.value.x}px`
    baseStyle.top = `${panelState.value.y}px`
    baseStyle.right = 'auto'
    baseStyle.bottom = 'auto'
  } else {
    baseStyle.width = `${props.width}px`
  }

  return baseStyle
})

// Transition name
const transitionName = computed(() => {
  if (isFloating.value) {
    return 'chatbot-panel-float'
  }
  switch (props.mode) {
    case 'fullscreen':
      return 'chatbot-panel-fullscreen'
    case 'sidebar':
      return props.position?.includes('left')
        ? 'chatbot-panel-sidebar-left'
        : 'chatbot-panel-sidebar-right'
    default:
      return props.position?.includes('bottom')
        ? 'chatbot-panel-dialog-bottom'
        : 'chatbot-panel-dialog-top'
  }
})

// Methods
const getDefaultPosition = () => {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const panelWidth = props.width
  const panelHeight = props.height

  // Default to right side of the screen, vertically centered
  return {
    x: windowWidth - panelWidth - 20,
    y: Math.max(20, (windowHeight - panelHeight) / 2),
  }
}

const loadPosition = () => {
  if (!props.rememberPosition || !isFloating.value) return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate and clamp position to viewport
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      panelState.value = {
        width: Math.max(props.minWidth, Math.min(parsed.width || props.width, windowWidth - 40)),
        height: Math.max(props.minHeight, Math.min(parsed.height || props.height, windowHeight - 40)),
        x: Math.max(0, Math.min(parsed.x || 0, windowWidth - (parsed.width || props.width))),
        y: Math.max(0, Math.min(parsed.y || 0, windowHeight - (parsed.height || props.height))),
      }
      return
    }
  } catch (e) {
    console.warn('Failed to load panel position:', e)
  }

  // Use default position
  const defaultPos = getDefaultPosition()
  panelState.value = {
    x: defaultPos.x,
    y: defaultPos.y,
    width: props.width,
    height: props.height,
  }
}

const savePosition = () => {
  if (!props.rememberPosition || !isFloating.value) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: panelState.value.x,
      y: panelState.value.y,
      width: panelState.value.width,
      height: panelState.value.height,
    }))
  } catch (e) {
    console.warn('Failed to save panel position:', e)
  }
}

const startDrag = (e: MouseEvent) => {
  if (!isDraggable.value) return
  // Don't drag if clicking on action buttons
  if ((e.target as HTMLElement).closest('.chatbot-panel__actions')) return
  if (!(e.target as HTMLElement).closest('.chatbot-panel__header')) return

  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - panelState.value.x,
    y: e.clientY - panelState.value.y,
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y

  // Constrain to viewport
  const maxX = window.innerWidth - panelRef.value!.offsetWidth
  const maxY = window.innerHeight - panelRef.value!.offsetHeight

  panelState.value.x = Math.max(0, Math.min(newX, maxX))
  panelState.value.y = Math.max(0, Math.min(newY, maxY))
}

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false
    savePosition()
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const startResize = (e: MouseEvent, direction: string) => {
  if (!isResizable.value) return

  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: panelState.value.width,
    height: panelState.value.height,
    panelX: panelState.value.x,
    panelY: panelState.value.y,
  }

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
  e.stopPropagation()
}

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y

  let newWidth = resizeStart.value.width
  let newHeight = resizeStart.value.height
  let newX = resizeStart.value.panelX
  let newY = resizeStart.value.panelY

  // Handle horizontal resize (e, w directions)
  if (resizeDirection.value.includes('e')) {
    newWidth = Math.max(props.minWidth, resizeStart.value.width + deltaX)
  }
  if (resizeDirection.value.includes('w')) {
    const maxDelta = resizeStart.value.width - props.minWidth
    const actualDelta = Math.min(deltaX, maxDelta)
    newWidth = resizeStart.value.width - actualDelta
    newX = resizeStart.value.panelX + actualDelta
  }

  // Handle vertical resize (s, n directions)
  if (resizeDirection.value.includes('s')) {
    newHeight = Math.max(props.minHeight, resizeStart.value.height + deltaY)
  }
  if (resizeDirection.value.includes('n')) {
    const maxDelta = resizeStart.value.height - props.minHeight
    const actualDelta = Math.min(deltaY, maxDelta)
    newHeight = resizeStart.value.height - actualDelta
    newY = resizeStart.value.panelY + actualDelta
  }

  // Constrain to viewport
  const maxWidth = window.innerWidth - newX
  const maxHeight = window.innerHeight - newY

  panelState.value.width = Math.min(newWidth, maxWidth)
  panelState.value.height = Math.min(newHeight, maxHeight)
  panelState.value.x = Math.max(0, newX)
  panelState.value.y = Math.max(0, newY)
}

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false
    savePosition()
  }
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const handleClose = () => {
  savePosition()
  emit('close')
}

// Lifecycle
onMounted(() => {
  if (isFloating.value) {
    loadPosition()
  }
})

// Watch for panel open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && isFloating.value) {
    loadPosition()
  }
})

// Handle window resize
const handleWindowResize = () => {
  if (isFloating.value) {
    // Ensure panel stays within viewport
    const maxX = window.innerWidth - panelState.value.width
    const maxY = window.innerHeight - panelState.value.height
    panelState.value.x = Math.min(panelState.value.x, Math.max(0, maxX))
    panelState.value.y = Math.min(panelState.value.y, Math.max(0, maxY))
    savePosition()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped lang="scss">
.chatbot-panel {
  position: fixed;
  background-color: var(--chatbot-bg-color, #ffffff);
  border-radius: var(--chatbot-border-radius, 12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  overflow: hidden;

  // Dragging state
  &--dragging,
  &--resizing {
    user-select: none;
    transition: none !important;
  }

  // Fullscreen mode
  &--fullscreen {
    inset: 0;
    width: 100% !important;
    height: 100%;
    border-radius: 0;
  }

  // Sidebar mode
  &--sidebar {
    top: 0;
    bottom: 0;
    height: 100vh;

    &.chatbot-panel--top-left,
    &.chatbot-panel--bottom-left {
      left: 0;
      border-radius: 0 var(--chatbot-border-radius, 12px) var(--chatbot-border-radius, 12px) 0;
    }

    &.chatbot-panel--top-right,
    &.chatbot-panel--bottom-right {
      right: 0;
      border-radius: var(--chatbot-border-radius, 12px) 0 0 var(--chatbot-border-radius, 12px);
    }
  }

  // Dialog mode (non-floating, legacy)
  &--dialog {
    max-height: 80vh;

    &.chatbot-panel--top-left {
      top: 16px;
      left: 16px;
    }

    &.chatbot-panel--top-right {
      top: 16px;
      right: 16px;
    }

    &.chatbot-panel--bottom-left {
      bottom: 16px;
      left: 16px;
    }

    &.chatbot-panel--bottom-right {
      bottom: 80px;
      right: 16px;
    }
  }

  // Floating mode (draggable & resizable) - ROUNDED CORNERS
  &--floating {
    max-height: none;
    resize: none; // We use custom resize handles
    border-radius: var(--chatbot-border-radius, 12px) !important;
  }

  // Theme
  &--light {
    --chatbot-panel-bg: #ffffff;
    --chatbot-panel-border: #e4e7ed;
    --chatbot-panel-text: #303133;
    --chatbot-panel-subtext: #909399;
  }

  &--dark {
    --chatbot-panel-bg: #1a1a1a;
    --chatbot-panel-border: #4c4d4f;
    --chatbot-panel-text: #e5e5e5;
    --chatbot-panel-subtext: #a3a3a3;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--chatbot-panel-border);
    background-color: var(--chatbot-panel-bg);
    flex-shrink: 0;
    border-radius: var(--chatbot-border-radius, 12px) var(--chatbot-border-radius, 12px) 0 0;

    &--draggable {
      cursor: move;
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--chatbot-panel-text);
    pointer-events: none; // Prevent text selection during drag
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--chatbot-panel-subtext);
    transition: background-color 0.2s, color 0.2s;
    flex-shrink: 0;

    &:hover {
      background-color: var(--chatbot-panel-border);
      color: var(--chatbot-panel-text);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__close-btn {
    &:hover {
      background-color: var(--chatbot-danger-color, #f56c6c);
      color: #fff;
    }
  }

  // Resize handles - all 8 directions
  &__resize-handle {
    position: absolute;
    z-index: 10;
    background: transparent;

    // Edges
    &--n {
      top: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: ns-resize;
    }

    &--s {
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: ns-resize;
    }

    &--e {
      top: 8px;
      right: 0;
      bottom: 8px;
      width: 8px;
      cursor: ew-resize;
    }

    &--w {
      top: 8px;
      left: 0;
      bottom: 8px;
      width: 8px;
      cursor: ew-resize;
    }

    // Corners
    &--ne {
      top: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nesw-resize;
    }

    &--nw {
      top: 0;
      left: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
    }

    &--se {
      right: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;

      // Visual indicator for corner resize
      &::after {
        content: '';
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 0 12px 12px;
        border-color: transparent transparent var(--chatbot-panel-border) transparent;
        opacity: 0.5;
      }
    }

    &--sw {
      left: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: nesw-resize;
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-radius: 0 0 var(--chatbot-border-radius, 12px) var(--chatbot-border-radius, 12px);
  }
}

// Transitions
.chatbot-panel-float-enter-active,
.chatbot-panel-float-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chatbot-panel-float-enter-from,
.chatbot-panel-float-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.chatbot-panel-dialog-bottom-enter-active,
.chatbot-panel-dialog-bottom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-panel-dialog-bottom-enter-from,
.chatbot-panel-dialog-bottom-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.chatbot-panel-sidebar-right-enter-active,
.chatbot-panel-sidebar-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-panel-sidebar-right-enter-from,
.chatbot-panel-sidebar-right-leave-to {
  transform: translateX(100%);
}

.chatbot-panel-sidebar-left-enter-active,
.chatbot-panel-sidebar-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-panel-sidebar-left-enter-from,
.chatbot-panel-sidebar-left-leave-to {
  transform: translateX(-100%);
}

.chatbot-panel-fullscreen-enter-active,
.chatbot-panel-fullscreen-leave-active {
  transition: opacity 0.3s ease;
}

.chatbot-panel-fullscreen-enter-from,
.chatbot-panel-fullscreen-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="draggable-window-wrapper">
    <div
      ref="windowRef"
      :class="classes"
      :style="windowStyle"
    >
      <!-- Header (Draggable area) -->
      <div
        v-if="$slots.header"
        class="draggable-window__header"
        :class="{ 'draggable-window__header--draggable': draggable }"
        @mousedown="startDrag"
      >
        <slot name="header"/>
      </div>

      <!-- Body content -->
      <div class="draggable-window__body">
        <slot/>
      </div>
    </div>

    <!-- Resize handles - Teleported to body for independent stacking context -->
    <Teleport v-if="resizable && modelValue" to="body">
      <div
        class="draggable-window__resize-overlay"
        :style="overlayStyle"
      >
        <div class="draggable-window__resize-handle draggable-window__resize-handle--n" @mousedown="startResize($event, 'n')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--s" @mousedown="startResize($event, 's')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--e" @mousedown="startResize($event, 'e')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--w" @mousedown="startResize($event, 'w')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--ne" @mousedown="startResize($event, 'ne')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--nw" @mousedown="startResize($event, 'nw')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--se" @mousedown="startResize($event, 'se')"/>
        <div class="draggable-window__resize-handle draggable-window__resize-handle--sw" @mousedown="startResize($event, 'sw')"/>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: boolean // v-model for visibility
  x?: number
  y?: number
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  draggable?: boolean
  resizable?: boolean
  rounded?: boolean
  theme?: 'light' | 'dark'
  rememberPosition?: boolean
  storageKey?: string
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true,
  x: 0,
  y: 0,
  width: 400,
  height: 500,
  minWidth: 200,
  minHeight: 150,
  maxWidth: undefined,
  maxHeight: undefined,
  draggable: true,
  resizable: true,
  rounded: true,
  theme: 'light',
  rememberPosition: true,
  storageKey: 'draggable-window-position',
  zIndex: 9998,
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:x', value: number): void
  (e: 'update:y', value: number): void
  (e: 'update:width', value: number): void
  (e: 'update:height', value: number): void
}

const emit = defineEmits<Emits>()

// Refs
const windowRef = ref<HTMLElement>()

// State
const windowState = ref({
  x: props.x,
  y: props.y,
  width: props.width,
  height: props.height,
})

const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const resizeDirection = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, panelX: 0, panelY: 0 })

// Computed
const classes = computed(() => [
  'draggable-window',
  `draggable-window--${props.theme}`,
  props.rounded && 'draggable-window--rounded',
  isDragging.value && 'draggable-window--dragging',
  isResizing.value && 'draggable-window--resizing',
])

const windowStyle = computed(() => ({
  left: `${windowState.value.x}px`,
  top: `${windowState.value.y}px`,
  width: `${windowState.value.width}px`,
  height: `${windowState.value.height}px`,
  zIndex: props.zIndex,
}))

// Overlay style for resize handles (teleported to body)
const overlayStyle = computed(() => ({
  position: 'fixed',
  left: `${windowState.value.x}px`,
  top: `${windowState.value.y}px`,
  width: `${windowState.value.width}px`,
  height: `${windowState.value.height}px`,
  zIndex: (parseInt(String(props.zIndex)) + 1).toString(),
  pointerEvents: 'none',
}))

// Methods
const loadPosition = () => {
  if (!props.rememberPosition) return

  try {
    const stored = localStorage.getItem(props.storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      windowState.value = {
        width: Math.max(props.minWidth, Math.min(parsed.width || props.width, props.maxWidth || windowWidth - 40)),
        height: Math.max(props.minHeight, Math.min(parsed.height || props.height, props.maxHeight || windowHeight - 40)),
        x: Math.max(0, Math.min(parsed.x || 0, windowWidth - (parsed.width || props.width))),
        y: Math.max(0, Math.min(parsed.y || 0, windowHeight - (parsed.height || props.height))),
      }
      emitChanges()
      return
    }
  } catch (e) {
    console.warn('Failed to load window position:', e)
  }
}

const savePosition = () => {
  if (!props.rememberPosition) return

  try {
    localStorage.setItem(props.storageKey, JSON.stringify({
      x: windowState.value.x,
      y: windowState.value.y,
      width: windowState.value.width,
      height: windowState.value.height,
    }))
  } catch (e) {
    console.warn('Failed to save window position:', e)
  }
}

const emitChanges = () => {
  emit('update:x', windowState.value.x)
  emit('update:y', windowState.value.y)
  emit('update:width', windowState.value.width)
  emit('update:height', windowState.value.height)
}

const startDrag = (e: MouseEvent) => {
  if (!props.draggable) return
  // Don't drag if clicking on buttons or interactive elements
  if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return

  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - windowState.value.x,
    y: e.clientY - windowState.value.y,
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const el = windowRef.value
  if (!el) return

  const newX = e.clientX - dragOffset.value.x
  const newY = e.clientY - dragOffset.value.y

  // Constrain to viewport
  const maxX = window.innerWidth - el.offsetWidth
  const maxY = window.innerHeight - el.offsetHeight

  windowState.value.x = Math.max(0, Math.min(newX, maxX))
  windowState.value.y = Math.max(0, Math.min(newY, maxY))
  emitChanges()
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
  if (!props.resizable) return

  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: windowState.value.width,
    height: windowState.value.height,
    panelX: windowState.value.x,
    panelY: windowState.value.y,
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

  // Handle horizontal resize
  if (resizeDirection.value.includes('e')) {
    newWidth = Math.max(props.minWidth, resizeStart.value.width + deltaX)
  }
  if (resizeDirection.value.includes('w')) {
    const maxDelta = resizeStart.value.width - props.minWidth
    const actualDelta = Math.min(deltaX, maxDelta)
    newWidth = resizeStart.value.width - actualDelta
    newX = resizeStart.value.panelX + actualDelta
  }

  // Handle vertical resize
  if (resizeDirection.value.includes('s')) {
    newHeight = Math.max(props.minHeight, resizeStart.value.height + deltaY)
  }
  if (resizeDirection.value.includes('n')) {
    const maxDelta = resizeStart.value.height - props.minHeight
    const actualDelta = Math.min(deltaY, maxDelta)
    newHeight = resizeStart.value.height - actualDelta
    newY = resizeStart.value.panelY + actualDelta
  }

  // Apply constraints
  windowState.value.width = Math.min(newWidth, props.maxWidth || Infinity)
  windowState.value.height = Math.min(newHeight, props.maxHeight || Infinity)
  windowState.value.x = Math.max(0, newX)
  windowState.value.y = Math.max(0, newY)
  emitChanges()
}

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false
    savePosition()
  }
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

// Lifecycle
onMounted(() => {
  loadPosition()
})

// Watch for prop changes
watch(() => props.x, (val) => { if (!isDragging.value && !isResizing.value) windowState.value.x = val })
watch(() => props.y, (val) => { if (!isDragging.value && !isResizing.value) windowState.value.y = val })
watch(() => props.width, (val) => { if (!isDragging.value && !isResizing.value) windowState.value.width = val })
watch(() => props.height, (val) => { if (!isDragging.value && !isResizing.value) windowState.value.height = val })

// Handle window resize
const handleWindowResize = () => {
  const maxX = window.innerWidth - windowState.value.width
  const maxY = window.innerHeight - windowState.value.height
  windowState.value.x = Math.min(windowState.value.x, Math.max(0, maxX))
  windowState.value.y = Math.min(windowState.value.y, Math.max(0, maxY))
  emitChanges()
  savePosition()
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

// Expose methods
defineExpose({
  savePosition,
  loadPosition,
})
</script>

<style scoped lang="scss">
// Wrapper to ensure single root element for Transition compatibility
.draggable-window-wrapper {
  display: contents;
}

.draggable-window {
  position: fixed;
  background-color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  overflow: visible;

  &--rounded {
    border-radius: 20px;
  }

  &--light {
    --dw-bg: #ffffff;
    --dw-border: #e4e7ed;
    --dw-text: #303133;
  }

  &--dark {
    --dw-bg: #1a1a1a;
    --dw-border: #4c4d4f;
    --dw-text: #e5e5e5;
  }

  &--dragging,
  &--resizing {
    user-select: none;
  }

  &__header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--dw-border);
    background-color: var(--dw-bg);
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    .draggable-window--rounded & {
      border-radius: 20px 20px 0 0;
    }

    &--draggable {
      cursor: move;
    }

    // Reset child header styles when used as slot content
    :deep(.chat-header) {
      padding: 16px;
      border-bottom: none;
      background: transparent;
      border-radius: 20px 20px 0 0;
    }
  }

  &__body {
    flex: 1;
    overflow: auto;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    .draggable-window--rounded & {
      border-radius: 0 0 20px 20px;
    }
  }

  // Resize overlay (teleported to body for independent stacking context)
  &__resize-overlay {
    position: fixed;
    pointer-events: none;
  }

  // Resize handles
  &__resize-handle {
    position: absolute;
    z-index: 1;
    background: transparent;
    pointer-events: auto;

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
    }

    &--sw {
      left: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: nesw-resize;
    }
  }
}
</style>

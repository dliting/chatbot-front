<template>
  <Transition :name="transitionName">
    <!-- Floating mode: use DraggableWindow component -->
    <DraggableWindow
      v-if="isOpen && isFloating"
      v-model="isOpen"
      v-model:x="panelState.x"
      v-model:y="panelState.y"
      v-model:width="panelState.width"
      v-model:height="panelState.height"
      :min-width="minWidth"
      :min-height="minHeight"
      :max-width="maxWidth"
      :max-height="maxHeight"
      :draggable="isDraggable"
      :resizable="isResizable"
      :theme="theme"
      :remember-position="rememberPosition"
      :storage-key="STORAGE_KEY"
      :rounded="true"
    >
      <template #header>
        <div v-if="showHeader" class="chatbot-panel__header">
          <div class="chatbot-panel__title">
            <slot name="title">{{ title }}</slot>
          </div>

          <div class="chatbot-panel__actions">
            <!-- Theme toggle slot -->
            <slot name="theme-toggle">
              <button
                v-if="showThemeToggle"
                class="chatbot-panel__action-btn"
                :title="theme === 'light' ? (labels?.switchToDarkMode || 'Switch to dark mode') : (labels?.switchToLightMode || 'Switch to light mode')"
                @click="$emit('toggle-theme')"
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
              :title="labels?.close || 'Close'"
              @click="handleClose"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
      <div class="chatbot-panel__body">
        <slot/>
      </div>
    </DraggableWindow>

    <!-- Non-floating modes: use original implementation -->
    <div
      v-else-if="isOpen"
      ref="panelRef"
      :class="[classes, { 'chatbot-panel--resizing': isSidebarMode && sidebarResize.isResizing.value }]"
      :style="panelStyle"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <!-- Header -->
      <div v-if="showHeader" class="chatbot-panel__header">
        <div class="chatbot-panel__title">
          <slot name="title">{{ title }}</slot>
        </div>

        <div class="chatbot-panel__actions">
          <!-- Theme toggle slot -->
          <slot name="theme-toggle">
            <button
              v-if="showThemeToggle"
              class="chatbot-panel__action-btn"
              :title="theme === 'light' ? (labels?.switchToDarkMode || 'Switch to dark mode') : (labels?.switchToLightMode || 'Switch to light mode')"
              @click="$emit('toggle-theme')"
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
            :title="labels?.close || 'Close'"
            @click="handleClose"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Sidebar resize handle -->
      <div
        v-if="isSidebarMode"
        class="chatbot-panel__resize-handle"
        role="separator"
        tabindex="0"
        aria-label="Resize panel"
        :class="[
          `chatbot-panel__resize-handle--${sidebarDirection.value}`,
          { 'chatbot-panel__resize-handle--active': sidebarResize.isResizing.value }
        ]"
        @mousedown="sidebarResize.startResize"
        @dblclick="sidebarResize.resetWidth"
      />

      <!-- Body -->
      <div class="chatbot-panel__body">
        <slot/>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import DraggableWindow from './DraggableWindow.vue'
import type { PanelMode, Position, Theme } from '@/types'
import type { ChatbotLabels } from '@/types/config'
import { useResizeHandle } from '@/composables/useResizeHandle'

// Swipe gesture configuration
const SWIPE_THRESHOLD = 100 // pixels
const VERTICAL_THRESHOLD = 50 // max vertical movement to be considered horizontal swipe

interface Props {
  isOpen: boolean
  mode: PanelMode
  position?: Position
  theme?: Theme
  title?: string
  width?: number
  height?: number
  showThemeToggle?: boolean
  showHeader?: boolean
  draggable?: boolean
  resizable?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  rememberPosition?: boolean
  labels?: ChatbotLabels
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  theme: 'light',
  title: 'AI Assistant',
  width: 400,
  height: 600,
  showThemeToggle: false,
  showHeader: true,
  draggable: true,
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  maxWidth: undefined,
  maxHeight: undefined,
  rememberPosition: true,
})

interface Emits {
  (e: 'close'): void
  (e: 'toggle-theme'): void
}

const emit = defineEmits<Emits>()

// Refs
const panelRef = ref<HTMLElement>()

// Sidebar mode resize handle
const isSidebarMode = computed(() => props.mode === 'sidebar')
const sidebarDirection = computed(() => props.position?.includes('left') ? 'right' : 'left')
const sidebarResize = useResizeHandle({
  initialWidth: props.width,
  minWidth: props.minWidth,
  maxWidth: props.maxWidth || 600,
  storageKey: 'chatbot-sidebar-panel-width',
  direction: sidebarDirection.value,
})

// Touch gesture state
const touchStartX = ref(0)
const touchStartY = ref(0)

// Storage key for floating panel position
const STORAGE_KEY = 'chatbot-floating-position'
const isFloating = computed(() => props.mode === 'floating')

// Position and size state (used for non-floating modes and initial values for floating)
const panelState = ref({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height,
})

// v-model for DraggableWindow
const isOpen = computed({
  get: () => props.isOpen,
  set: (val) => { if (!val) emit('close') }
})

// Computed
const isDraggable = computed(() => props.draggable && isFloating.value)
const isResizable = computed(() => props.resizable && isFloating.value)

const classes = computed(() => [
  'chatbot-panel',
  `chatbot-panel--${props.mode}`,
  `chatbot-panel--${props.position}`,
  `chatbot-panel--${props.theme}`,
])

const panelStyle = computed(() => {
  const baseStyle: Record<string, string> = {}

  if (props.mode === 'sidebar') {
    baseStyle.width = `${sidebarResize.width.value}px`
  } else if (props.mode === 'fullscreen') {
    baseStyle.width = '100%'
    baseStyle.height = '100%'
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

const handleClose = () => {
  emit('close')
}

// Touch gesture handlers for swipe to close
const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  if (touch) {
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Check if horizontal swipe distance exceeds threshold
  // and vertical movement is within tolerance (to distinguish from scroll)
  if (deltaX > SWIPE_THRESHOLD && deltaY < VERTICAL_THRESHOLD) {
    emit('close')
  }
}

// Initialize default position for floating mode on mount
onMounted(() => {
  if (isFloating.value) {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    panelState.value = {
      x: windowWidth - props.width - 20,
      y: Math.max(20, (windowHeight - props.height) / 2),
      width: props.width,
      height: props.height,
    }
  }
})
</script>

<style scoped lang="scss">
.chatbot-panel {
  position: fixed;
  background-color: var(--bg-base, #ffffff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  overflow: hidden;

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
      border-radius: 0 var(--radius-lg, 12px) var(--radius-lg, 12px) 0;
    }

    &.chatbot-panel--top-right,
    &.chatbot-panel--bottom-right {
      right: 0;
      border-radius: var(--radius-lg, 12px) 0 0 var(--radius-lg, 12px);
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
    border-radius: var(--radius-lg, 12px) !important;
  }

  // Theme
  &--light {
    --bg-base: #ffffff;
    --topic-border: #e4e7ed;
    --text-primary: #303133;
    --text-tertiary: #909399;
  }

  &--dark {
    --bg-base: #1a1a1a;
    --topic-border: #4c4d4f;
    --text-primary: #e5e5e5;
    --text-tertiary: #a3a3a3;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--topic-border);
    background-color: var(--bg-base);
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;

    &--draggable {
      cursor: move;
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
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
    color: var(--text-tertiary);
    transition: background-color 0.2s, color 0.2s;
    flex-shrink: 0;

    &:hover {
      background-color: var(--topic-border);
      color: var(--text-primary);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__close-btn {
    &:hover {
      background-color: var(--color-danger, #f56c6c);
      color: #fff;
    }
  }

  &__resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background: transparent;
    z-index: 1;
    transition: background 0.2s;

    &:hover {
      background: var(--theme-primary, #409eff);
    }

    &--active {
      background: var(--theme-primary, #409eff);
    }

    // Right-positioned sidebar: handle on left edge
    &--left {
      left: 0;
    }

    // Left-positioned sidebar: handle on right edge
    &--right {
      right: 0;
    }
  }

  &--resizing {
    user-select: none;
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    border-radius: 0 0 var(--radius-lg, 12px) var(--radius-lg, 12px);
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

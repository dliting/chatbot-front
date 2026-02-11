<template>
  <Transition :name="transitionName">
    <div
      v-if="isOpen"
      :class="classes"
      :style="panelStyle"
    >
      <!-- Header -->
      <div class="chatbot-panel__header">
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
            @click="$emit('close')"
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
import { computed } from 'vue'
import type { PanelMode, Position, Theme } from '@/types'

interface Props {
  isOpen: boolean
  mode: PanelMode
  position?: Position
  theme?: Theme
  title?: string
  width?: number
  showThemeToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  theme: 'light',
  title: 'AI Assistant',
  width: 400,
  showThemeToggle: true,
})

interface Emits {
  (e: 'close'): void
  (e: 'toggle-theme'): void
}

defineEmits<Emits>()

// Classes
const classes = computed(() => [
  'chatbot-panel',
  `chatbot-panel--${props.mode}`,
  `chatbot-panel--${props.position}`,
  `chatbot-panel--${props.theme}`,
])

// Panel style
const panelStyle = computed(() => {
  const baseStyle: Record<string, string> = {}

  if (props.mode === 'sidebar') {
    baseStyle.width = `${props.width}px`
  } else if (props.mode === 'dialog') {
    baseStyle.width = `${props.width}px`
  }

  return baseStyle
})

// Transition name
const transitionName = computed(() => {
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

  // Dialog mode
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
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--chatbot-panel-text);
  }

  &__actions {
    display: flex;
    gap: 8px;
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

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

// Transitions
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

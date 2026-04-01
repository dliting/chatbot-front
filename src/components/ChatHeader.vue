<template>
  <header class="chat-header" :class="`chat-header--${theme}`">
    <!-- Back button (in sessions view) -->
    <button
      v-if="showBackButton"
      class="chat-header__back"
      @click="$emit('back')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Title -->
    <h1 class="chat-header__title">{{ title }}</h1>

    <!-- Right actions -->
    <div class="chat-header__actions">
      <!-- Topics button -->
      <button
        v-if="showTopicsButton"
        class="chat-header__btn"
        title="历史话题"
        @click="$emit('topics')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Theme toggle -->
      <button
        v-if="showThemeToggle"
        class="chat-header__btn"
        :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
        @click="$emit('toggle-theme')"
      >
        <svg v-if="theme === 'light'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z"/>
        </svg>
      </button>

      <!-- Close button -->
      <button
        v-if="showCloseButton"
        class="chat-header__btn chat-header__close"
        title="关闭"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Theme } from '@/types'

interface Props {
  title?: string
  theme?: Theme
  showBackButton?: boolean
  showTopicsButton?: boolean
  showThemeToggle?: boolean
  showCloseButton?: boolean
  unreadCount?: number
}

withDefaults(defineProps<Props>(), {
  title: 'AI Assistant',
  theme: 'light',
  showBackButton: false,
  showTopicsButton: false,
  showThemeToggle: false,
  showCloseButton: false,
  unreadCount: 0,
})

interface Emits {
  (e: 'back'): void
  (e: 'topics'): void
  (e: 'toggle-theme'): void
  (e: 'close'): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
.chat-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
  background: var(--chatbot-bg-color, #ffffff);
  flex-shrink: 0;
  gap: 8px;

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--chatbot-text-color, #303133);
    transition: background 0.2s;

    &:hover {
      background: var(--chatbot-border-color, #e4e7ed);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: var(--chatbot-text-color, #303133);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--chatbot-subtext-color, #909399);
    transition: all 0.2s;

    &:hover {
      background: var(--chatbot-border-color, #e4e7ed);
      color: var(--chatbot-text-color, #303133);
    }

    svg {
      width: 20px;
      height: 20px;
    }

    &.chat-header__close:hover {
      background: var(--chatbot-danger-color, #f56c6c);
      color: white;
    }
  }
}
</style>

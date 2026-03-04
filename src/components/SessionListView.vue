<template>
  <div class="session-list-view" :class="{ 'session-list-view--embedded': isEmbedded }">
    <!-- Header (only shown when not embedded) -->
    <header v-if="!isEmbedded" class="session-list-view__header">
      <h1 class="session-list-view__title">{{ config.labels?.history || '历史对话' }}</h1>
      <button class="session-list-view__close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <!-- New Session Button -->
    <div class="session-list-view__new-section">
      <button class="session-list-view__new-btn" @click="$emit('create-session')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ config.labels?.newChat || '新建对话' }}</span>
      </button>
    </div>

    <!-- Session List -->
    <div class="session-list-view__list">
      <div
        v-for="session in sortedSessions"
        :key="session.id"
        class="session-list-view__item"
        :class="{ 'session-list-view__item--active': session.id === currentSessionId }"
        @click="$emit('select-session', session.id)"
      >
        <div class="session-list-view__item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="session-list-view__item-content">
          <div class="session-list-view__item-title">{{ session.title || '未命名对话' }}</div>
          <div class="session-list-view__item-time">{{ formatTime(session.updatedAt) }}</div>
        </div>
        <button
          v-if="session.id === currentSessionId || sessions.length > 1"
          class="session-list-view__item-delete"
          @click.stop="$emit('delete-session', session.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="sessions.length === 0" class="session-list-view__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>暂无历史对话</p>
        <p>点击上方按钮开始新对话</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Session } from '@/types'

interface Props {
  sessions: Session[]
  currentSessionId: string
  config?: ChatbotConfig
  isEmbedded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  isEmbedded: false,
})

interface Emits {
  (e: 'close'): void
  (e: 'create-session'): void
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
}

defineEmits<Emits>()

// Sort sessions by updated time (newest first)
const sortedSessions = computed(() => {
  return [...props.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
})

// Format timestamp to readable string
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}
</script>

<style scoped lang="scss">
.session-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chatbot-bg-color, #ffffff);
  color: var(--chatbot-text-color, #303133);

  &--embedded {
    height: auto;
    border-right: 1px solid var(--chatbot-border-color, #e4e7ed);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
    flex-shrink: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
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
  }

  &__new-section {
    padding: 16px;
    flex-shrink: 0;
  }

  &__new-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active {
      transform: scale(0.98);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--chatbot-border-color, #e4e7ed);
      border-radius: 2px;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;

    &:hover {
      background: var(--chatbot-primary-color-light, #ecf5ff);
    }

    &--active {
      background: var(--chatbot-primary-color-light, #ecf5ff);

      .session-list-view__item-title {
        color: var(--chatbot-primary-color, #409eff);
        font-weight: 500;
      }
    }
  }

  &__item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--chatbot-primary-color-light, #ecf5ff);
    color: var(--chatbot-primary-color, #409eff);
    flex-shrink: 0;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__item-content {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: 14px;
    color: var(--chatbot-text-color, #303133);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-time {
    font-size: 12px;
    color: var(--chatbot-subtext-color, #909399);
  }

  &__item-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--chatbot-subtext-color, #909399);
    opacity: 0;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: var(--chatbot-danger-color, #f56c6c);
      color: white;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__item:hover &__item-delete {
    opacity: 1;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    text-align: center;
    color: var(--chatbot-subtext-color, #909399);

    svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 4px 0;
      font-size: 14px;
    }
  }
}
</style>

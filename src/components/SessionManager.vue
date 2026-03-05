<template>
  <div class="chatbot-sessions">
    <!-- New session button -->
    <button class="chatbot-sessions__new-btn" @click="$emit('create-session')">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span>{{ newChatLabel }}</span>
    </button>

    <!-- Sessions list -->
    <div class="chatbot-sessions__list">
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="sessionClasses(session)"
        @click="$emit('switch-session', session.id)"
      >
        <div class="chatbot-sessions__item-content" @dblclick.stop="startEditTitle(session)">
          <!-- Editing mode -->
          <input
            v-if="editingSessionId === session.id"
            ref="editInputRef"
            v-model="editingTitle"
            class="chatbot-sessions__item-title-input"
            @blur="saveTitle(session.id)"
            @keyup.enter="saveTitle(session.id)"
            @keyup.escape="cancelEdit"
            @click.stop
          />
          <!-- Display mode -->
          <div v-else class="chatbot-sessions__item-title">
            {{ session.title }}
          </div>
          <div class="chatbot-sessions__item-meta">
            {{ formatSessionMeta(session) }}
          </div>
        </div>

        <!-- Unread badge -->
        <span
          v-if="session.unreadCount > 0"
          class="chatbot-sessions__item-badge"
        >
          {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
        </span>

        <!-- Delete button -->
        <button
          class="chatbot-sessions__item-delete"
          title="Delete session"
          @click.stop="$emit('delete-session', session.id)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="sessions.length === 0" class="chatbot-sessions__empty">
        No sessions yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Session } from '@/types'
import { formatTime } from '@/utils/helpers'

interface Props {
  sessions: Session[]
  currentSessionId: string
  newChatLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  newChatLabel: 'New Chat',
})

interface Emits {
  (e: 'create-session'): void
  (e: 'switch-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'update-session-title', sessionId: string, title: string): void
}

const emit = defineEmits<Emits>()

// Editing state
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// Start editing title
const startEditTitle = async (session: Session) => {
  editingSessionId.value = session.id
  editingTitle.value = session.title
  await nextTick()
  // Handle focus in both browser and test environments
  if (editInputRef.value) {
    if (typeof editInputRef.value.focus === 'function') {
      editInputRef.value.focus()
    }
    if (typeof editInputRef.value.select === 'function') {
      editInputRef.value.select()
    }
  }
}

// Save title
const saveTitle = (sessionId: string) => {
  const trimmedTitle = editingTitle.value.trim()
  const originalSession = props.sessions.find(s => s.id === sessionId)
  if (trimmedTitle && originalSession && trimmedTitle !== originalSession.title) {
    emit('update-session-title', sessionId, trimmedTitle)
  }
  cancelEdit()
}

// Cancel editing
const cancelEdit = () => {
  editingSessionId.value = null
  editingTitle.value = ''
}

// Session classes
const sessionClasses = (session: Session) => [
  'chatbot-sessions__item',
  {
    'chatbot-sessions__item--active': session.id === props.currentSessionId,
  },
]

// Format session metadata
const formatSessionMeta = (session: Session): string => {
  const timeStr = formatTime(session.updatedAt)
  const countStr = session.messageCount === 1 ? '1 message' : `${session.messageCount} messages`
  return `${timeStr} • ${countStr}`
}
</script>

<style scoped lang="scss">
.chatbot-sessions {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--chatbot-panel-bg, #ffffff);
  border-right: 1px solid var(--chatbot-panel-border, #e4e7ed);

  &__new-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--chatbot-panel-text, #303133);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--chatbot-panel-border, #e4e7ed);

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background-color: var(--chatbot-panel-border, #e4e7ed);
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;

    &:hover {
      background-color: var(--chatbot-panel-border, #e4e7ed);

      .chatbot-sessions__item-delete {
        opacity: 1;
      }
    }

    &--active {
      background-color: var(--chatbot-primary-color-light, #ecf5ff);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--chatbot-primary-color, #409eff);
      }
    }
  }

  &__item-content {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: 14px;
    color: var(--chatbot-panel-text, #303133);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;
  }

  &__item-title-input {
    width: 100%;
    padding: 2px 4px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid var(--chatbot-primary-color, #409eff);
    border-radius: 4px;
    background-color: var(--chatbot-panel-bg, #ffffff);
    color: var(--chatbot-panel-text, #303133);
    outline: none;

    &:focus {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }

  &__item-meta {
    font-size: 12px;
    color: var(--chatbot-panel-subtext, #909399);
    margin-top: 2px;
  }

  &__item-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--chatbot-panel-subtext, #909399);
    opacity: 0;
    transition: all 0.2s;
    flex-shrink: 0;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: var(--chatbot-danger-color, #f56c6c);
      color: #fff;
    }
  }

  &__item-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    background-color: var(--chatbot-danger-color, #f56c6c);
    border-radius: 9px;
    flex-shrink: 0;
  }

  &__empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--chatbot-panel-subtext, #909399);
    font-size: 14px;
  }
}
</style>

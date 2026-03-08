<template>
  <div :class="containerClasses">
    <!-- Header with close button -->
    <header v-if="showCloseButton" class="chatbot-sessions__header session-list-view__header">
      <h1 class="chatbot-sessions__header-title session-list-view__title">{{ config.labels?.history || '历史对话' }}</h1>
      <button class="chatbot-sessions__header-close session-list-view__close" :aria-label="cancelLabel" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <!-- Search bar -->
    <SessionSearch
      v-model="searchQuery"
      :placeholder="searchPlaceholder"
      class="chatbot-sessions__search"
    />

    <!-- Batch operation bar (shown when items are selected) -->
    <Transition name="batch-bar">
      <div v-if="selectedSessionIds.length > 0" class="chatbot-sessions__batch-bar">
        <span class="chatbot-sessions__batch-count">
          {{ selectedCountText }}
        </span>
        <div class="chatbot-sessions__batch-actions">
          <button
            class="chatbot-sessions__batch-btn chatbot-sessions__batch-btn--cancel"
            @click="clearSelection"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="chatbot-sessions__batch-btn chatbot-sessions__batch-btn--delete"
            @click="handleBatchDelete"
          >
            {{ deleteSelectedLabel }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- New session button -->
    <button
      v-if="!isBatchMode"
      class="chatbot-sessions__new-btn session-list-view__new-btn"
      @click="$emit('create-session')"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span>{{ newChatLabel }}</span>
    </button>

    <!-- Batch mode toggle -->
    <button
      v-else
      class="chatbot-sessions__batch-toggle"
      @click="toggleBatchMode"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ doneLabel }}</span>
    </button>

    <!-- Sessions list -->
    <div class="chatbot-sessions__list session-list-view__list">
      <SessionActionMenu
        v-for="session in filteredSessions"
        :key="session.sessionId"
        :edit-label="editLabel"
        :delete-label="deleteLabel"
        @edit="startEditTitle(session)"
        @delete="handleDelete(session.sessionId)"
      >
        <div
          :class="sessionClasses(session)"
          @click="handleSessionClick(session.sessionId)"
        >
          <!-- Checkbox for batch mode -->
          <div
            v-if="isBatchMode"
            class="chatbot-sessions__checkbox"
            @click.stop="toggleSelection(session.sessionId)"
          >
            <svg
              v-if="selectedSessionIds.includes(session.sessionId)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Session icon (shown when not in batch mode) -->
          <div v-else class="chatbot-sessions__item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="chatbot-sessions__item-content" @dblclick.stop="startEditTitle(session)">
            <!-- Editing mode -->
            <input
              v-if="editingSessionId === session.sessionId"
              ref="editInputRef"
              v-model="editingTitle"
              class="chatbot-sessions__item-title-input"
              @blur="saveTitle(session.sessionId)"
              @keyup.enter="saveTitle(session.sessionId)"
              @keyup.escape="cancelEdit"
              @click.stop
            />
            <!-- Display mode with highlight -->
            <div v-else class="chatbot-sessions__item-title">
              <!-- eslint-disable-next-line vue/no-v-html -- Sanitized input for text highlighting -->
              <span v-html="highlightText(session.title || '未命名对话', searchQuery)" />
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

          <!-- Delete button (only in non-batch mode) -->
          <button
            v-if="!isBatchMode"
            class="chatbot-sessions__item-delete session-list-view__item-delete"
            :title="deleteLabel"
            :aria-label="deleteLabel"
            @click.stop="handleDelete(session.sessionId)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </SessionActionMenu>

      <!-- Empty state -->
      <div v-if="filteredSessions.length === 0" class="chatbot-sessions__empty session-list-view__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>{{ searchQuery ? noResultsLabel : noSessionsLabel }}</p>
        <p v-if="!searchQuery">{{ noSessionsHint }}</p>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog
      v-model:show="showDeleteDialog"
      :title="deleteDialog.title"
      :message="deleteDialog.message"
      :confirm-text="deleteDialog.confirmText"
      :cancel-text="deleteDialog.cancelText"
      type="danger"
      @confirm="confirmDelete"
    />

    <!-- Batch mode button (shown when not in batch mode) -->
    <button
      v-if="!isBatchMode && sessions.length > 0"
      class="chatbot-sessions__batch-mode-btn"
      :title="batchModeLabel"
      :aria-label="batchModeLabel"
      @click="toggleBatchMode"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="14" y="3" width="7" height="7" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="14" y="14" width="7" height="7" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="3" y="14" width="7" height="7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Session } from '@/types'
import { formatTime, escapeHTML } from '@/utils/helpers'
import SessionSearch from './SessionSearch.vue'
import SessionActionMenu from './SessionActionMenu.vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  sessions: Session[]
  currentSessionId: string
  config?: ChatbotConfig
  isEmbedded?: boolean
  layout?: 'single' | 'dual'
  enableClose?: boolean
  newChatLabel?: string
  searchPlaceholder?: string
  editLabel?: string
  deleteLabel?: string
  cancelLabel?: string
  doneLabel?: string
  batchModeLabel?: string
  deleteSelectedLabel?: string
  noResultsLabel?: string
  noSessionsLabel?: string
  noSessionsHint?: string
  deleteConfirmTitle?: string
  deleteConfirmMessage?: string
  batchDeleteConfirmTitle?: string
  batchDeleteConfirmMessage?: string
  selectedCountFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  isEmbedded: false,
  layout: 'dual',
  enableClose: false,
  newChatLabel: '新建对话',
  searchPlaceholder: '搜索对话...',
  editLabel: '重命名',
  deleteLabel: '删除',
  cancelLabel: '取消',
  doneLabel: '完成',
  batchModeLabel: '批量选择',
  deleteSelectedLabel: '删除选中',
  noResultsLabel: '未找到匹配的对话',
  noSessionsLabel: '暂无历史对话',
  noSessionsHint: '点击上方按钮开始新对话',
  deleteConfirmTitle: '删除对话?',
  deleteConfirmMessage: '确定要删除此对话吗?',
  batchDeleteConfirmTitle: '删除对话?',
  batchDeleteConfirmMessage: '确定要删除选中的对话吗?',
  selectedCountFormat: '已选择 {count} 个',
})

interface Emits {
  (e: 'close'): void
  (e: 'create-session'): void
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'delete-sessions', sessionIds: string[]): void
  (e: 'update-session-title', sessionId: string, title: string): void
}

const emit = defineEmits<Emits>()

// Container classes for backward compatibility
const containerClasses = computed(() => [
  'session-list-view',
  'chatbot-sessions',
  {
    'session-list-view--embedded': props.isEmbedded,
    'chatbot-sessions--embedded': props.isEmbedded,
  },
])

// Show close button when layout is dual AND enableClose is true, OR when not embedded (for backward compatibility)
const showCloseButton = computed(() => !props.isEmbedded || (props.layout === 'dual' && props.enableClose))

// Search state
const searchQuery = ref('')

// Batch mode state
const isBatchMode = ref(false)
const selectedSessionIds = ref<string[]>([])

// Delete confirmation state
const showDeleteDialog = ref(false)
const pendingDeleteIds = ref<string[]>([])

const deleteDialog = computed(() => {
  const isBatch = pendingDeleteIds.value.length > 1
  return {
    title: isBatch ? props.batchDeleteConfirmTitle : props.deleteConfirmTitle,
    message: isBatch
      ? `${props.batchDeleteConfirmMessage} (${pendingDeleteIds.value.length})`
      : props.deleteConfirmMessage,
    confirmText: props.deleteLabel,
    cancelText: props.cancelLabel,
  }
})

// Editing state
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// Filter sessions by search query
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.sessions
  }
  const query = searchQuery.value.toLowerCase()
  return props.sessions.filter(session =>
    (session.title || '未命名对话').toLowerCase().includes(query)
  )
})

// Selected count text
const selectedCountText = computed(() => {
  const count = selectedSessionIds.value.length
  return props.selectedCountFormat.replace('{count}', String(count))
})

// Toggle batch mode
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    clearSelection()
  }
}

// Clear selection
const clearSelection = () => {
  selectedSessionIds.value = []
}

// Toggle selection
const toggleSelection = (sessionId: string) => {
  const index = selectedSessionIds.value.indexOf(sessionId)
  if (index > -1) {
    selectedSessionIds.value.splice(index, 1)
  } else {
    selectedSessionIds.value.push(sessionId)
  }
}

// Handle session click
const handleSessionClick = (sessionId: string) => {
  if (isBatchMode.value) {
    toggleSelection(sessionId)
  } else {
    emit('select-session', sessionId)
  }
}

// Handle single delete
const handleDelete = (sessionId: string) => {
  pendingDeleteIds.value = [sessionId]
  showDeleteDialog.value = true
}

// Handle batch delete
const handleBatchDelete = () => {
  if (selectedSessionIds.value.length > 0) {
    pendingDeleteIds.value = [...selectedSessionIds.value]
    showDeleteDialog.value = true
  }
}

// Confirm delete
const confirmDelete = () => {
  if (pendingDeleteIds.value.length === 1) {
    emit('delete-session', pendingDeleteIds.value[0])
  } else {
    emit('delete-sessions', pendingDeleteIds.value)
  }
  clearSelection()
  isBatchMode.value = false
}

// Highlight text (with XSS protection)
const highlightText = (text: string, query: string): string => {
  if (!query.trim()) {
    return escapeHTML(text)
  }
  // First escape HTML to prevent XSS
  const escapedText = escapeHTML(text)
  // Then escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

// Start editing title
const startEditTitle = async (session: Session) => {
  if (isBatchMode.value) return
  editingSessionId.value = session.sessionId
  editingTitle.value = session.title || ''
  await nextTick()
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
  const originalSession = props.sessions.find(s => s.sessionId === sessionId)
  if (trimmedTitle && originalSession && trimmedTitle !== (originalSession.title || '')) {
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
  'session-list-view__item',
  {
    'chatbot-sessions__item--active': session.sessionId === props.currentSessionId,
    'chatbot-sessions__item--selected': selectedSessionIds.value.includes(session.sessionId),
    'session-list-view__item--active': session.sessionId === props.currentSessionId,
  },
]

// Format session metadata
const formatSessionMeta = (session: Session): string => {
  const timeStr = formatTime(session.updatedAt)
  const countStr = session.messageCount === 1 ? '1 条消息' : `${session.messageCount} 条消息`
  return `${timeStr} • ${countStr}`
}
</script>

<style scoped lang="scss">
// Backward compatibility - merge both class styles
.session-list-view,
.chatbot-sessions {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--chatbot-panel-bg, #ffffff);
  color: var(--chatbot-text-color, #303133);

  &--embedded {
    height: auto;
    border-right: 1px solid var(--chatbot-panel-border, #e4e7ed);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
    flex-shrink: 0;
  }

  &__header-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--chatbot-text-color, #303133);
  }

  &__header-close {
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

  &__search {
    flex-shrink: 0;
    padding: 12px 16px;
  }

  &__batch-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--chatbot-primary-color-light, #ecf5ff);
    border-bottom: 1px solid var(--chatbot-primary-color, #409eff);
    flex-shrink: 0;
  }

  &__batch-count {
    font-size: 14px;
    font-weight: 500;
    color: var(--chatbot-primary-color, #409eff);
  }

  &__batch-actions {
    display: flex;
    gap: 8px;
  }

  &__batch-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &--cancel {
      background: var(--chatbot-bg-color, #ffffff);
      color: var(--chatbot-text-color, #303133);
      border: 1px solid var(--chatbot-border-color, #dcdfe6);

      &:hover {
        background: var(--chatbot-border-color, #e4e7ed);
      }
    }

    &--delete {
      background: var(--chatbot-danger-color, #f56c6c);
      color: white;

      &:hover {
        background: var(--chatbot-danger-color-dark, #f78989);
      }
    }
  }

  &__new-btn,
  &__batch-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    margin: 0 16px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &__batch-toggle {
    background: var(--chatbot-bg-color, #ffffff);
    color: var(--chatbot-text-color, #303133);
    border: 1px solid var(--chatbot-border-color, #dcdfe6);

    &:hover {
      background: var(--chatbot-border-color, #e4e7ed);
      transform: none;
      box-shadow: none;
    }
  }

  &__batch-mode-btn {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: var(--chatbot-primary-color, #409eff);
    color: white;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
    transition: all 0.2s;
    z-index: 10;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
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
    position: relative;

    &:hover {
      background: var(--chatbot-primary-color-light, #ecf5ff);

      .chatbot-sessions__item-delete,
      .session-list-view__item-delete {
        opacity: 1;
      }
    }

    &:focus {
      outline: none;
      background: var(--chatbot-primary-color-light, #ecf5ff);
    }

    &:focus-visible {
      outline: 2px solid var(--chatbot-primary-color, #409eff);
      outline-offset: 2px;
    }

    &--active {
      background: var(--chatbot-primary-color-light, #ecf5ff);

      .chatbot-sessions__item-title,
      .session-list-view__item-title {
        color: var(--chatbot-primary-color, #409eff);
        font-weight: 500;
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--chatbot-primary-color, #409eff);
        border-radius: 12px 0 0 12px;
      }
    }

    &--selected {
      background: var(--chatbot-primary-color-light, #ecf5ff);
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

  &__checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--chatbot-border-color, #dcdfe6);
    border-radius: 4px;
    flex-shrink: 0;
    transition: all 0.2s;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--chatbot-primary-color, #409eff);
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
    }

    &:focus-visible {
      outline: 2px solid var(--chatbot-primary-color, #409eff);
      outline-offset: 2px;
    }

    svg {
      width: 14px;
      height: 14px;
      color: var(--chatbot-primary-color, #409eff);
    }

    .chatbot-sessions__item--selected &,
    .session-list-view__item--selected & {
      border-color: var(--chatbot-primary-color, #409eff);
      background: var(--chatbot-primary-color, #409eff);
    }
  }

  &__item-content {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: 14px;
    color: var(--chatbot-text-color, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;

    :deep(mark) {
      background: var(--chatbot-warning-color-light, #fdf6ec);
      color: var(--chatbot-warning-color, #e6a23c);
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  &__item-title-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid var(--chatbot-primary-color, #409eff);
    border-radius: 4px;
    background-color: var(--chatbot-bg-color, #ffffff);
    color: var(--chatbot-text-color, #303133);
    outline: none;

    &:focus {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }

  &__item-meta {
    font-size: 12px;
    color: var(--chatbot-subtext-color, #909399);
    margin-top: 2px;
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

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: var(--chatbot-danger-color, #f56c6c);
      color: white;
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

// Batch bar transition
.batch-bar-enter-active,
.batch-bar-leave-active {
  transition: all 0.3s ease;
}

.batch-bar-enter-from,
.batch-bar-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.batch-bar-enter-to,
.batch-bar-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>

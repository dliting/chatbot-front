<template>
  <div :class="containerClasses">
    <!-- Header with close button -->
    <header v-if="showCloseButton" class="chatbot-topics__header topic-list-view__header">
      <h1 class="chatbot-topics__header-title topic-list-view__title">{{ config.labels?.topics || '话题列表' }}</h1>
      <button class="chatbot-topics__header-close topic-list-view__close" :aria-label="cancelLabel" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <!-- Search bar -->
    <TopicSearch
      v-model="searchQuery"
      :placeholder="searchPlaceholder"
      class="chatbot-topics__search"
    />

    <!-- Batch operation bar (shown when items are selected) -->
    <Transition name="batch-bar">
      <div v-if="selectedTopicIds.length > 0" class="chatbot-topics__batch-bar">
        <span class="chatbot-topics__batch-count">
          {{ selectedCountText }}
        </span>
        <div class="chatbot-topics__batch-actions">
          <button
            class="chatbot-topics__batch-btn chatbot-topics__batch-btn--cancel"
            @click="clearSelection"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="chatbot-topics__batch-btn chatbot-topics__batch-btn--delete"
            @click="handleBatchDelete"
          >
            {{ deleteSelectedLabel }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- New topic button -->
    <button
      v-if="!isBatchMode"
      class="chatbot-topics__new-btn topic-list-view__new-btn"
      @click="$emit('create-topic')"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span>{{ newTopicLabel }}</span>
    </button>

    <!-- Batch mode toggle -->
    <button
      v-else
      class="chatbot-topics__batch-toggle"
      @click="toggleBatchMode"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ doneLabel }}</span>
    </button>

    <!-- Topics list -->
    <div class="chatbot-topics__list topic-list-view__list">
      <TopicActionMenu
        v-for="topic in filteredTopics"
        :key="topic.topicId"
        :edit-label="editLabel"
        :delete-label="deleteLabel"
        @edit="startEditTitle(topic)"
        @delete="handleDelete(topic.topicId)"
      >
        <div
          :class="topicClasses(topic)"
          @click="handleTopicClick(topic.topicId)"
        >
          <!-- Checkbox for batch mode -->
          <div
            v-if="isBatchMode"
            class="chatbot-topics__checkbox"
            @click.stop="toggleSelection(topic.topicId)"
          >
            <svg
              v-if="selectedTopicIds.includes(topic.topicId)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Topic icon (shown when not in batch mode) -->
          <div v-else class="chatbot-topics__item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="chatbot-topics__item-content" @dblclick.stop="startEditTitle(topic)">
            <!-- Editing mode -->
            <input
              v-if="editingTopicId === topic.topicId"
              ref="editInputRef"
              v-model="editingTitle"
              class="chatbot-topics__item-title-input"
              @blur="saveTitle(topic.topicId)"
              @keyup.enter="saveTitle(topic.topicId)"
              @keyup.escape="cancelEdit"
              @click.stop
            />
            <!-- Display mode with highlight -->
            <div v-else class="chatbot-topics__item-title">
              <!-- eslint-disable-next-line vue/no-v-html -- Sanitized input for text highlighting -->
              <span v-html="highlightText(topic.title || '未命名话题', searchQuery)" />
            </div>
            <div class="chatbot-topics__item-meta">
              {{ formatTopicMeta(topic) }}
            </div>
          </div>

          <!-- Unread badge -->
          <span
            v-if="topic.unreadCount > 0"
            class="chatbot-topics__item-badge"
          >
            {{ topic.unreadCount > 99 ? '99+' : topic.unreadCount }}
          </span>

          <!-- Delete button (only in non-batch mode) -->
          <button
            v-if="!isBatchMode"
            class="chatbot-topics__item-delete topic-list-view__item-delete"
            :title="deleteLabel"
            :aria-label="deleteLabel"
            @click.stop="handleDelete(topic.topicId)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </TopicActionMenu>

      <!-- Empty state -->
      <div v-if="filteredTopics.length === 0" class="chatbot-topics__empty topic-list-view__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>{{ searchQuery ? noResultsLabel : noTopicsLabel }}</p>
        <p v-if="!searchQuery">{{ noTopicsHint }}</p>
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
      v-if="!isBatchMode && topics.length > 0"
      class="chatbot-topics__batch-mode-btn"
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
import type { Topic } from '@/types'
import { formatTime, escapeHTML } from '@/utils/helpers'
import TopicSearch from './TopicSearch.vue'
import TopicActionMenu from './TopicActionMenu.vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  topics: Topic[]
  currentTopicId: string
  config?: ChatbotConfig
  isEmbedded?: boolean
  layout?: 'single' | 'dual'
  enableClose?: boolean
  newTopicLabel?: string
  searchPlaceholder?: string
  editLabel?: string
  deleteLabel?: string
  cancelLabel?: string
  doneLabel?: string
  batchModeLabel?: string
  deleteSelectedLabel?: string
  noResultsLabel?: string
  noTopicsLabel?: string
  noTopicsHint?: string
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
  newTopicLabel: '新话题',
  searchPlaceholder: '搜索话题...',
  editLabel: '重命名',
  deleteLabel: '删除',
  cancelLabel: '取消',
  doneLabel: '完成',
  batchModeLabel: '批量选择',
  deleteSelectedLabel: '删除选中',
  noResultsLabel: '未找到匹配的话题',
  noTopicsLabel: '暂无历史话题',
  noTopicsHint: '点击上方按钮开始新话题',
  deleteConfirmTitle: '删除话题?',
  deleteConfirmMessage: '确定要删除此话题吗?',
  batchDeleteConfirmTitle: '删除话题?',
  batchDeleteConfirmMessage: '确定要删除选中的话题吗?',
  selectedCountFormat: '已选择 {count} 个',
})

interface Emits {
  (e: 'close'): void
  (e: 'create-topic'): void
  (e: 'select-topic', topicId: string): void
  (e: 'delete-topic', topicId: string): void
  (e: 'delete-topics', topicIds: string[]): void
  (e: 'update-topic-title', topicId: string, title: string): void
}

const emit = defineEmits<Emits>()

// Container classes for backward compatibility
const containerClasses = computed(() => [
  'topic-list-view',
  'chatbot-topics',
  {
    'topic-list-view--embedded': props.isEmbedded,
    'chatbot-topics--embedded': props.isEmbedded,
  },
])

// Show close button when layout is dual AND enableClose is true, OR when not embedded (for backward compatibility)
const showCloseButton = computed(() => !props.isEmbedded || (props.layout === 'dual' && props.enableClose))

// Search state - synced with v-model from TopicSearch
const searchQuery = ref('')

// Batch mode state
const isBatchMode = ref(false)
const selectedTopicIds = ref<string[]>([])

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
const editingTopicId = ref<string | null>(null)
const editingTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// Filter topics by search query
const filteredTopics = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.topics
  }
  const query = searchQuery.value.toLowerCase()
  return props.topics.filter(topic =>
    (topic.title || '未命名话题').toLowerCase().includes(query)
  )
})

// Selected count text
const selectedCountText = computed(() => {
  const count = selectedTopicIds.value.length
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
  selectedTopicIds.value = []
}

// Toggle selection
const toggleSelection = (topicId: string) => {
  const index = selectedTopicIds.value.indexOf(topicId)
  if (index > -1) {
    selectedTopicIds.value.splice(index, 1)
  } else {
    selectedTopicIds.value.push(topicId)
  }
}

// Handle topic click
const handleTopicClick = (topicId: string) => {
  if (isBatchMode.value) {
    toggleSelection(topicId)
  } else {
    emit('select-topic', topicId)
  }
}

// Handle single delete
const handleDelete = (topicId: string) => {
  pendingDeleteIds.value = [topicId]
  showDeleteDialog.value = true
}

// Handle batch delete
const handleBatchDelete = () => {
  if (selectedTopicIds.value.length > 0) {
    pendingDeleteIds.value = [...selectedTopicIds.value]
    showDeleteDialog.value = true
  }
}

// Confirm delete
const confirmDelete = () => {
  if (pendingDeleteIds.value.length === 1) {
    emit('delete-topic', pendingDeleteIds.value[0])
  } else {
    emit('delete-topics', pendingDeleteIds.value)
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
const startEditTitle = async (topic: Topic) => {
  if (isBatchMode.value) return
  editingTopicId.value = topic.topicId
  editingTitle.value = topic.title || ''
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
const saveTitle = (topicId: string) => {
  const trimmedTitle = editingTitle.value.trim()
  const originalTopic = props.topics.find(t => t.topicId === topicId)
  if (trimmedTitle && originalTopic && trimmedTitle !== (originalTopic.title || '')) {
    emit('update-topic-title', topicId, trimmedTitle)
  }
  cancelEdit()
}

// Cancel editing
const cancelEdit = () => {
  editingTopicId.value = null
  editingTitle.value = ''
}

// Topic classes
const topicClasses = (topic: Topic) => [
  'chatbot-topics__item',
  'topic-list-view__item',
  {
    'chatbot-topics__item--active': topic.topicId === props.currentTopicId,
    'chatbot-topics__item--selected': selectedTopicIds.value.includes(topic.topicId),
    'topic-list-view__item--active': topic.topicId === props.currentTopicId,
  },
]

// Format topic metadata
const formatTopicMeta = (topic: Topic): string => {
  const timeStr = formatTime(topic.updatedAt)
  const countStr = topic.messageCount === 1 ? '1 条消息' : `${topic.messageCount} 条消息`
  return `${timeStr} • ${countStr}`
}
</script>

<style scoped lang="scss">
// Backward compatibility - merge both class styles
.topic-list-view,
.chatbot-topics {
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
    background: var(--chatbot-primary-gradient);
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

      .chatbot-topics__item-delete,
      .topic-list-view__item-delete {
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

      .chatbot-topics__item-title,
      .topic-list-view__item-title {
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

    .chatbot-topics__item--selected &,
    .topic-list-view__item--selected & {
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

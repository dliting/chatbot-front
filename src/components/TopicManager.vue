<template>
  <div class="chatbot-topics">
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
      class="chatbot-topics__new-btn"
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
    <div class="chatbot-topics__list">
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
              <span v-html="highlightText(topic.title, searchQuery)" />
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
            class="chatbot-topics__item-delete"
            :title="deleteLabel"
            @click.stop="handleDelete(topic.topicId)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </TopicActionMenu>

      <!-- Empty state -->
      <div v-if="filteredTopics.length === 0" class="chatbot-topics__empty">
        {{ searchQuery ? noResultsLabel : noTopicsLabel }}
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
import type { Topic } from '@/types'
import { formatTime, escapeHTML } from '@/utils/helpers'
import { TOPIC_DEFAULTS } from '@/constants'
import TopicSearch from './TopicSearch.vue'
import TopicActionMenu from './TopicActionMenu.vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  topics: Topic[]
  currentTopicId: string
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
  deleteConfirmTitle?: string
  deleteConfirmMessage?: string
  batchDeleteConfirmTitle?: string
  batchDeleteConfirmMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  newTopicLabel: TOPIC_DEFAULTS.TITLE,
  searchPlaceholder: 'Search topics...',
  editLabel: 'Rename',
  deleteLabel: 'Delete',
  cancelLabel: 'Cancel',
  doneLabel: 'Done',
  batchModeLabel: 'Select multiple',
  deleteSelectedLabel: 'Delete selected',
  noResultsLabel: 'No results found',
  noTopicsLabel: 'No topics yet',
  deleteConfirmTitle: 'Delete topic?',
  deleteConfirmMessage: 'Are you sure you want to delete this topic?',
  batchDeleteConfirmTitle: 'Delete topics?',
  batchDeleteConfirmMessage: 'Are you sure you want to delete the selected topics?',
})

interface Emits {
  (e: 'create-topic'): void
  (e: 'switch-topic', topicId: string): void
  (e: 'delete-topic', topicId: string | string[]): void
  (e: 'delete-topics', topicIds: string[]): void
  (e: 'update-topic-title', topicId: string, title: string): void
}

const emit = defineEmits<Emits>()

// Search state
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
    topic.title.toLowerCase().includes(query)
  )
})

// Selected count text
const selectedCountText = computed(() => {
  const count = selectedTopicIds.value.length
  return count === 1 ? '1 selected' : `${count} selected`
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
    emit('switch-topic', topicId)
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
  const escapedText = escapeHTML(text)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

// Start editing title
const startEditTitle = async (topic: Topic) => {
  if (isBatchMode.value) return
  editingTopicId.value = topic.topicId
  editingTitle.value = topic.title
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
  if (trimmedTitle && originalTopic && trimmedTitle !== originalTopic.title) {
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
  {
    'chatbot-topics__item--active': topic.topicId === props.currentTopicId,
    'chatbot-topics__item--selected': selectedTopicIds.value.includes(topic.topicId),
  },
]

// Format topic metadata
const formatTopicMeta = (topic: Topic): string => {
  const timeStr = formatTime(topic.updatedAt)
  const countStr = topic.messageCount === 1 ? '1 message' : `${topic.messageCount} messages`
  return `${timeStr} • ${countStr}`
}
</script>

<style scoped lang="scss">
.chatbot-topics {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--chatbot-panel-bg, #ffffff);
  border-right: 1px solid var(--chatbot-panel-border, #e4e7ed);
  position: relative;

  &__search {
    flex-shrink: 0;
    padding: 12px 12px 0;
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
    flex-shrink: 0;
    width: 100%;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background-color: var(--chatbot-panel-border, #e4e7ed);
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

      .chatbot-topics__item-delete {
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

    &--selected {
      background-color: var(--chatbot-primary-color-light, #ecf5ff);
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

    svg {
      width: 14px;
      height: 14px;
      color: var(--chatbot-primary-color, #409eff);
    }

    .chatbot-topics__item--selected & {
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
    color: var(--chatbot-panel-text, #303133);
    font-weight: 500;
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

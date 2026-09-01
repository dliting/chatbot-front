<template>
  <div :class="containerClasses">
    <!-- Header with close button -->
    <header v-if="showCloseButton" class="topic-list-view__header">
      <h1 class="topic-list-view__header-title topic-list-view__title">
        {{ config.labels?.historyTooltip || config.labels?.history || 'History' }}
      </h1>
      <button
        class="topic-list-view__header-close topic-list-view__close"
        :aria-label="labels.cancelLabel"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </header>

    <!-- Search bar -->
    <TopicSearch
      v-model="searchQuery"
      :placeholder="labels.searchPlaceholder"
      class="topic-list-view__search"
    />

    <!-- Batch operation bar (shown when items are selected) -->
    <Transition name="batch-bar">
      <div v-if="selectedTopicIds.length > 0" class="topic-list-view__batch-bar">
        <span class="topic-list-view__batch-count">
          {{ selectedCountText }}
        </span>
        <div class="topic-list-view__batch-actions">
          <button
            class="topic-list-view__batch-btn topic-list-view__batch-btn--cancel"
            @click="clearSelection"
          >
            {{ labels.cancelLabel }}
          </button>
          <button
            class="topic-list-view__batch-btn topic-list-view__batch-btn--delete"
            @click="handleBatchDelete"
          >
            {{ labels.deleteSelectedLabel }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- New topic button -->
    <button v-if="!isBatchMode" class="topic-list-view__new-btn" @click="handleCreateTopic">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
      <span>{{ labels.newTopicLabel }}</span>
    </button>

    <!-- Batch mode toggle -->
    <button v-else class="topic-list-view__batch-toggle" @click="toggleBatchMode">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ labels.doneLabel }}</span>
    </button>

    <!-- Topics list -->
    <div class="topic-list-view__list">
      <TopicActionMenu
        v-for="topic in filteredTopics"
        :key="topic.topicId"
        :edit-label="labels.editLabel"
        :delete-label="labels.deleteLabel"
        @edit="startEditTitle(topic)"
        @delete="handleDelete(topic.topicId)"
      >
        <div :class="topicClasses(topic)" @click="handleTopicClick(topic.topicId)">
          <!-- Checkbox for batch mode -->
          <div
            v-if="isBatchMode"
            class="topic-list-view__checkbox"
            @click.stop="toggleSelection(topic.topicId)"
          >
            <svg
              v-if="selectedTopicIds.includes(topic.topicId)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- Topic icon (shown when not in batch mode) -->
          <div v-else class="topic-list-view__item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="topic-list-view__item-content" @dblclick.stop="startEditTitle(topic)">
            <!-- Editing mode -->
            <input
              v-if="editingTopicId === topic.topicId"
              ref="editInputRef"
              v-model="editingTitle"
              class="topic-list-view__item-title-input"
              @blur="saveTitle(topic.topicId)"
              @keyup.enter="saveTitle(topic.topicId)"
              @keyup.escape="cancelEdit"
              @click.stop
            />
            <!-- Display mode with highlight -->
            <div v-else class="topic-list-view__item-title">
              <!-- eslint-disable-next-line vue/no-v-html -- Sanitized input for text highlighting -->
              <span v-html="highlightText(topic.title || unnamedTopicText, searchQuery)" />
            </div>
            <div class="topic-list-view__item-meta">
              {{ formatTopicMeta(topic) }}
            </div>
          </div>

          <!-- Unread badge -->
          <span v-if="topic.unreadCount > 0" class="topic-list-view__item-badge">
            {{ topic.unreadCount > 99 ? '99+' : topic.unreadCount }}
          </span>

          <!-- Delete button (only in non-batch mode) -->
          <button
            v-if="!isBatchMode"
            class="topic-list-view__item-delete"
            :title="labels.deleteLabel"
            :aria-label="labels.deleteLabel"
            @click.stop="handleDelete(topic.topicId)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        </div>
      </TopicActionMenu>

      <!-- Empty state -->
      <div v-if="filteredTopics.length === 0" class="topic-list-view__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p>{{ searchQuery ? labels.noResultsLabel : labels.noTopicsLabel }}</p>
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
      class="topic-list-view__batch-mode-btn"
      :title="labels.batchModeLabel"
      :aria-label="labels.batchModeLabel"
      @click="toggleBatchMode"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="14" y="3" width="7" height="7" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="14" y="14" width="7" height="7" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="3" y="14" width="7" height="7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, inject } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { Topic } from '@/types'
import { topicActionsKey, uiActionsKey } from '@/symbols'
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
})

// Resolve labels: explicit prop > config.labels > English fallback
const labels = computed(() => {
  const cfg = props.config?.labels
  return {
    newTopicLabel: props.newTopicLabel || cfg?.newTopic || 'New Topic',
    searchPlaceholder: props.searchPlaceholder || cfg?.searchTopics || 'Search topics...',
    editLabel: props.editLabel || cfg?.rename || 'Rename',
    deleteLabel: props.deleteLabel || cfg?.delete || 'Delete',
    cancelLabel: props.cancelLabel || cfg?.cancel || 'Cancel',
    doneLabel: props.doneLabel || cfg?.done || 'Done',
    batchModeLabel: props.batchModeLabel || cfg?.batchSelect || 'Batch Select',
    deleteSelectedLabel: props.deleteSelectedLabel || cfg?.deleteSelected || 'Delete Selected',
    noResultsLabel: props.noResultsLabel || cfg?.noResults || 'No matching topics found',
    noTopicsLabel: props.noTopicsLabel || cfg?.noTopics || 'No topics yet',
    noTopicsHint:
      props.noTopicsHint || cfg?.noTopicsHint || 'Click the button above to start a new topic',
    deleteConfirmTitle: props.deleteConfirmTitle || cfg?.deleteTopicConfirmTitle || 'Delete Topic?',
    deleteConfirmMessage:
      props.deleteConfirmMessage ||
      cfg?.deleteTopicConfirmMessage ||
      'Are you sure you want to delete this topic?',
    batchDeleteConfirmTitle:
      props.batchDeleteConfirmTitle || cfg?.deleteTopicConfirmTitle || 'Delete Topic?',
    batchDeleteConfirmMessage:
      props.batchDeleteConfirmMessage ||
      cfg?.batchDeleteTopicConfirmMessage ||
      'Are you sure you want to delete the selected topics?',
    selectedCountFormat:
      props.selectedCountFormat || cfg?.selectedCountFormat || '{count} selected',
  }
})

/**
 * Emits - reserved for external-facing events only
 * Internal actions (create/switch/delete/rename) are handled via inject (topicActionsKey)
 * View navigation is handled via inject (uiActionsKey)
 */
interface Emits {
  /** Emitted when close button is clicked (external UI event, not a data action) */
  (e: 'close'): void
}

defineEmits<Emits>()

// Inject action handlers from AIChatbot
// - topicActions: data operations (create/switch/delete/rename)
// - uiActions: UI operations (showChatView/showTopicsView for view navigation)
const topicActions = inject(topicActionsKey)
const uiActions = inject(uiActionsKey)

/**
 * Action handlers using inject-primary pattern:
 * - Inject handles the actual operation (data mutation, view navigation)
 * - Emit is reserved for external consumers only (e.g., close event)
 * This eliminates the dual-path problem where inject and emit could get out of sync.
 */

// Create topic - uses inject for data operation
const handleCreateTopic = () => {
  if (topicActions) {
    topicActions.createNewTopic()
  }
  // No emit: action handled by inject, external consumers listen to AIChatbot's topic:created event
}

// Container classes
const containerClasses = computed(() => [
  'topic-list-view',
  {
    'topic-list-view--embedded': props.isEmbedded,
  },
])

// Show close button when layout is dual AND enableClose is true, OR when not embedded (for backward compatibility)
const showCloseButton = computed(
  () => !props.isEmbedded || (props.layout === 'dual' && props.enableClose)
)

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
    title: isBatch ? labels.value.batchDeleteConfirmTitle : labels.value.deleteConfirmTitle,
    message: isBatch
      ? `${labels.value.batchDeleteConfirmMessage} (${pendingDeleteIds.value.length})`
      : labels.value.deleteConfirmMessage,
    confirmText: labels.value.deleteLabel,
    cancelText: labels.value.cancelLabel,
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
  return props.topics.filter((topic) =>
    (topic.title || props.config?.labels?.unnamedTopic || 'Unnamed Topic')
      .toLowerCase()
      .includes(query)
  )
})

// Selected count text
const selectedCountText = computed(() => {
  const count = selectedTopicIds.value.length
  return labels.value.selectedCountFormat.replace('{count}', String(count))
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

// Handle topic click — inject-primary: both data switch and view navigation via inject
const handleTopicClick = (topicId: string) => {
  if (isBatchMode.value) {
    toggleSelection(topicId)
  } else {
    if (topicActions) {
      topicActions.switchToTopic(topicId)
    }
    uiActions?.showChatView?.()
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
    if (topicActions) {
      topicActions.removeTopic(pendingDeleteIds.value[0])
    }
  } else {
    if (topicActions) {
      topicActions.removeTopics(pendingDeleteIds.value)
    }
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
  const originalTopic = props.topics.find((t) => t.topicId === topicId)
  if (trimmedTitle && originalTopic && trimmedTitle !== (originalTopic.title || '')) {
    if (topicActions) {
      topicActions.renameTopic(topicId, trimmedTitle)
    }
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
  'topic-list-view__item',
  {
    'topic-list-view__item--active': topic.topicId === props.currentTopicId,
    'topic-list-view__item--selected': selectedTopicIds.value.includes(topic.topicId),
  },
]

// Format topic metadata
const unnamedTopicText = computed(() => props.config?.labels?.unnamedTopic || 'Unnamed Topic')

const formatTopicMeta = (topic: Topic): string => {
  const timeStr = formatTime(topic.updatedAt)
  const fmt = props.config?.labels?.messageCountFormat || '{count} messages'
  const countStr =
    topic.messageCount === 1
      ? fmt.replace('{count}', '1')
      : fmt.replace('{count}', String(topic.messageCount))
  return `${timeStr} • ${countStr}`
}
</script>

<style scoped lang="scss">
.topic-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-base, #ffffff);
  color: var(--text-primary, #303133);

  &--embedded {
    height: auto;
    border-right: 1px solid var(--topic-border, #e4e7ed);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--border-light, #e4e7ed);
    flex-shrink: 0;
  }

  &__header-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary, #303133);
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
    color: var(--text-tertiary, #909399);
    transition: all 0.2s;

    &:hover {
      background: var(--border-light, #e4e7ed);
      color: var(--text-primary, #303133);
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
    background: var(--theme-primary-light, #ecf5ff);
    border-bottom: 1px solid var(--theme-primary, #409eff);
    flex-shrink: 0;
  }

  &__batch-count {
    font-size: 14px;
    font-weight: 500;
    color: var(--theme-primary, #409eff);
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
      background: var(--bg-base, #ffffff);
      color: var(--text-primary, #303133);
      border: 1px solid var(--border-light, #dcdfe6);

      &:hover {
        background: var(--border-light, #e4e7ed);
      }
    }

    &--delete {
      background: var(--color-danger, #f56c6c);
      color: var(--text-on-primary, #fff);

      &:hover {
        background: var(--color-danger-dark, #f78989);
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
    background: var(--theme-primary-gradient);
    color: var(--text-on-primary, #fff);
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
    background: var(--bg-base, #ffffff);
    color: var(--text-primary, #303133);
    border: 1px solid var(--border-light, #dcdfe6);

    &:hover {
      background: var(--border-light, #e4e7ed);
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
    background: var(--theme-primary, #409eff);
    color: var(--text-on-primary, #fff);
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
      background: var(--border-light, #e4e7ed);
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
      background: var(--theme-primary-light, #ecf5ff);

      .topic-list-view__item-delete {
        opacity: 1;
      }
    }

    &:focus {
      outline: none;
      background: var(--theme-primary-light, #ecf5ff);
    }

    &:focus-visible {
      outline: 2px solid var(--theme-primary, #409eff);
      outline-offset: 2px;
    }

    &--active {
      background: var(--theme-primary-light, #ecf5ff);

      .topic-list-view__item-title {
        color: var(--theme-primary, #409eff);
        font-weight: 500;
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--theme-primary, #409eff);
        border-radius: 12px 0 0 12px;
      }
    }

    &--selected {
      background: var(--theme-primary-light, #ecf5ff);
    }
  }

  &__item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--theme-primary-light, #ecf5ff);
    color: var(--theme-primary, #409eff);
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
    border: 2px solid var(--border-light, #dcdfe6);
    border-radius: 4px;
    flex-shrink: 0;
    transition: all 0.2s;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--theme-primary, #409eff);
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
    }

    &:focus-visible {
      outline: 2px solid var(--theme-primary, #409eff);
      outline-offset: 2px;
    }

    svg {
      width: 14px;
      height: 14px;
      color: var(--theme-primary, #409eff);
    }

    .topic-list-view__item--selected & {
      border-color: var(--theme-primary, #409eff);
      background: var(--theme-primary, #409eff);
    }
  }

  &__item-content {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: 14px;
    color: var(--text-primary, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;

    :deep(mark) {
      background: var(--color-warning-light, #fdf6ec);
      color: var(--color-warning, #e6a23c);
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  &__item-title-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid var(--theme-primary, #409eff);
    border-radius: 4px;
    background-color: var(--bg-base, #ffffff);
    color: var(--text-primary, #303133);
    outline: none;

    &:focus {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }

  &__item-meta {
    font-size: 12px;
    color: var(--text-tertiary, #909399);
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
    color: var(--text-tertiary, #909399);
    opacity: 0;
    transition: all 0.2s;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: var(--color-danger, #f56c6c);
      color: var(--text-on-primary, #fff);
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
    color: var(--text-on-primary, #fff);
    background-color: var(--color-danger, #f56c6c);
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
    color: var(--text-tertiary, #909399);

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

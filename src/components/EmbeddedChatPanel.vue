<template>
  <!-- Embedded Modes: Main container -->
  <div
    :class="containerClasses"
  >
    <!-- Dual Layout: Sidebar + Main Content -->
    <template v-if="effectiveLayout === 'dual'">
      <!-- Topic Sidebar -->
      <aside class="ai-chat__sidebar">
        <TopicListView
          :topics="topics"
          :current-topic-id="currentTopicId"
          :config="config"
          :is-embedded="true"
          :layout="effectiveLayout"
          :enable-close="true"
          @create-topic="$emit('create-topic')"
          @select-topic="$emit('select-topic', $event)"
          @delete-topic="$emit('delete-topic', $event)"
          @delete-topics="$emit('delete-topics', $event)"
          @update-topic-title="(topicId, title) => $emit('update-topic-title', topicId, title)"
          @close="$emit('close')"
        />
      </aside>

      <!-- Main Chat Area -->
      <main class="ai-chat__main">
        <ChatHeader
          v-if="!hideHeader"
          :title="config.labels?.title || '智能助手'"
          :theme="config.theme || 'light'"
          :show-theme-toggle="true"
          @toggle-theme="$emit('toggle-theme')"
        />
        <ChatContent
          :messages="messages"
          :welcome-visible="!hideWelcome && messages.length === 0"
          :quick-actions-visible="!hideQuickActions"
          :is-streaming="isStreaming"
          :enable-thinking="enableThinking"
          :thinking-enabled="thinkingEnabled"
          :is-thinking="isThinking"
          @send-message="handleSendMessage"
          @quick-action="$emit('quick-action', $event)"
          @edit="$emit('edit', $event)"
          @copy="$emit('copy', $event)"
          @refresh="$emit('refresh', $event)"
          @delete="$emit('delete', $event)"
          @file-click="handleFileClick"
          @thinking-toggle="$emit('thinking-toggle', $event)"
          @stop-generating="$emit('stop-generating')"
        />
      </main>
    </template>

    <!-- Single Layout: View-based switching -->
    <template v-else>
      <ChatHeader
        v-if="!hideHeader && viewState.currentView === 'chat'"
        :title="config.labels?.title || '智能助手'"
        :theme="config.theme || 'light'"
        :show-topics-button="true"
        :show-theme-toggle="true"
        @topics="showTopicsView"
        @toggle-theme="$emit('toggle-theme')"
      />
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :key="messages.length"
        :messages="messages"
        :welcome-visible="!hideWelcome && messages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        :enable-thinking="enableThinking"
        :thinking-enabled="thinkingEnabled"
        :is-thinking="isThinking"
        @send-message="handleSendMessage"
        @quick-action="$emit('quick-action', $event)"
        @edit="$emit('edit', $event)"
        @copy="$emit('copy', $event)"
        @refresh="$emit('refresh', $event)"
        @delete="$emit('delete', $event)"
        @file-click="handleFileClick"
        @thinking-toggle="$emit('thinking-toggle', $event)"
        @stop-generating="$emit('stop-generating')"
      />
      <TopicListView
        v-else
        :topics="topics"
        :current-topic-id="currentTopicId"
        :config="config"
        :layout="effectiveLayout"
        @close="showChatView"
        @create-topic="$emit('create-topic')"
        @select-topic="$emit('select-topic', $event)"
        @delete-topic="$emit('delete-topic', $event)"
        @delete-topics="$emit('delete-topics', $event)"
        @update-topic-title="(topicId, title) => $emit('update-topic-title', topicId, title)"
      />
    </template>

    <!-- File Preview Modal (unified for all file types) -->
    <FilePreviewModal
      v-if="previewFile"
      :visible="!!previewFile"
      :file="previewFile"
      @close="previewFile = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChatMode, Layout, ChatbotConfig } from '@/types'
import { defaultChatbotConfig } from '@/types/config'
import { useChatView } from '@/composables/useChatView'

// Components
import TopicListView from './TopicListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import FilePreviewModal from './FilePreviewModal.vue'

interface Props {
  mode?: ChatMode
  layout?: Layout
  config?: ChatbotConfig
  messages?: import('@/types').Message[]
  topics?: import('@/types').Topic[]
  currentTopicId?: string
  isStreaming?: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  hideHeader?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'floating',
  layout: undefined,
  config: () => ({}),
  messages: () => [],
  topics: () => [],
  currentTopicId: '',
  isStreaming: false,
  hideWelcome: false,
  hideQuickActions: false,
  hideHeader: false,
})

// Emits
interface Emits {
  (e: 'create-topic'): void
  (e: 'select-topic', topicId: string): void
  (e: 'delete-topic', topicId: string): void
  (e: 'delete-topics', topicIds: string[]): void
  (e: 'update-topic-title', topicId: string, title: string): void
  (e: 'send-message', data: { content: string; images?: string[]; videos?: string[]; audios?: string[] }): void
  (e: 'quick-action', text: string): void
  (e: 'edit', message: import('@/types').Message): void
  (e: 'copy', message: import('@/types').Message): void
  (e: 'refresh', message: import('@/types').Message): void
  (e: 'delete', message: import('@/types').Message): void
  (e: 'toggle-theme'): void
  (e: 'close'): void
  (e: 'thinking-toggle', enabled: boolean): void
  (e: 'stop-generating'): void
}

const emit = defineEmits<Emits>()

// Preview state
const previewFile = ref<{ type: string; url: string; name?: string } | null>(null)

// Unified file click handler for all file types
const handleFileClick = (file: { type: string; url: string; name?: string }) => {
  previewFile.value = file
}

// Handle send message
const handleSendMessage = (data: { content: string; images?: string[]; videos?: string[]; audios?: string[] }) => {
  emit('send-message', data)
}

// Merge config
const configRef = computed(() => {
  const cfg = props.config
  const configValue = cfg?.value ?? cfg
  return { ...defaultChatbotConfig, ...configValue }
})

// Effective layout - use prop if provided, otherwise derive from mode
const effectiveLayout = computed(() => {
  if (props.layout) return props.layout
  // Derive layout from mode if not explicitly provided
  if (props.mode === 'extended') return 'dual'
  if (props.mode === 'floating') return 'single'
  return 'single'
})

// View state management using useChatView - pass mode as reactive ref
const { viewState, showChatView, showTopicsView } = useChatView(computed(() => props.mode))

// Container classes
const containerClasses = computed(() => [
  'ai-chat',
  `ai-chat--${props.mode}`,
  `ai-chat--${configRef.value.theme || 'light'}`,
])
</script>

<style scoped lang="scss">
.ai-chat {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--chatbot-bg-color, #ffffff);
  color: var(--chatbot-text-color, #303133);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Theme variations
  &--light {
    --chatbot-bg-color: #ffffff;
    --chatbot-text-color: #303133;
  }

  &--dark {
    --chatbot-bg-color: #1a1a1a;
    --chatbot-text-color: #e5e5e5;
  }

  // Extended mode
  &--extended {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100vh;
  }

  // Dual layout (same as extended)
  &--dual {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100vh;
  }

  // Single layout / compact mode / floating / sidebar
  &--single,
  &--compact,
  &--floating,
  &--sidebar {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--chatbot-border-color, #e4e7ed);
    overflow: hidden;

    // Mobile: collapse sidebar to full-width
    @media (max-width: 768px) {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>

<template>
  <!-- Embedded Modes: Main container -->
  <div
    :class="[containerClasses, { 'ai-chat--resizing': sidebarResize.isResizing.value }]"
  >
    <!-- Dual Layout: Sidebar + Main Content -->
    <template v-if="effectiveLayout === 'dual'">
      <!-- Topic Sidebar -->
      <aside class="ai-chat__sidebar" :style="{ width: sidebarResize.width.value + 'px' }">
        <TopicListView
          :topics="topics"
          :current-topic-id="currentTopicId"
          :config="config"
          :is-embedded="true"
          :layout="effectiveLayout"
          :enable-close="true"
          @close="$emit('close')"
        />
      </aside>

      <!-- Resize Handle -->
      <div
        class="ai-chat__resize-handle"
        :class="{ 'ai-chat__resize-handle--active': sidebarResize.isResizing.value }"
        @mousedown="sidebarResize.startResize"
        @dblclick="sidebarResize.resetWidth"
      />

      <!-- Main Chat Area -->
      <main class="ai-chat__main">
        <ChatHeader
          v-if="!hideHeader"
          :title="config.labels?.title || 'AI Assistant'"
          :theme="config.theme || 'light'"
          :show-theme-toggle="false"
          :labels="config.labels"
        />
        <ChatContent
          :messages="messages"
          :welcome-visible="!hideWelcome && messages.length === 0"
          :quick-actions-visible="!hideQuickActions"
          :is-streaming="isStreaming"
          :labels="configRef.labels"
          :enable-thinking="enableThinking"
          :thinking-enabled="thinkingEnabled"
          :is-thinking="isThinking"
          :enable-voice-input="enableVoiceInput"
          @file-click="handleFileClick"
        />
      </main>
    </template>

    <!-- Single Layout: View-based switching -->
    <template v-else>
      <ChatHeader
        v-if="!hideHeader && viewState.currentView === 'chat'"
        :title="config.labels?.title || 'AI Assistant'"
        :theme="config.theme || 'light'"
        :show-topics-button="true"
        :show-theme-toggle="false"
        :labels="config.labels"
      />
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :key="messages.length"
        :messages="messages"
        :welcome-visible="!hideWelcome && messages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        :labels="configRef.labels"
        :enable-thinking="enableThinking"
        :thinking-enabled="thinkingEnabled"
        :is-thinking="isThinking"
        :enable-voice-input="enableVoiceInput"
        @file-click="handleFileClick"
      />
      <TopicListView
        v-else
        :topics="topics"
        :current-topic-id="currentTopicId"
        :config="config"
        :layout="effectiveLayout"
        @close="showChatView"
      />
    </template>

    <!-- File Preview Modal (unified for all file types) -->
    <FilePreviewModal
      v-if="previewFile"
      :visible="!!previewFile"
      :file="previewFile"
      @close="closePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import type { InteractionMode, Layout, ChatbotConfig, UIActionHandlers } from '@/types'
import { defaultChatbotConfig } from '@/types/config'
import { modeToLayoutMap } from '@/types'
import { useChatView } from '@/composables/useChatView'
import { useResizeHandle } from '@/composables/useResizeHandle'
import { useFilePreview } from '@/composables/useFilePreview'
import { uiActionsKey } from '@/symbols'

// Components
import TopicListView from './TopicListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import FilePreviewModal from './FilePreviewModal.vue'

interface Props {
  mode?: InteractionMode
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
  enableVoiceInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'extended',
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

// Emits - reserved for external-facing events only
// Internal actions are handled via inject (topicActionsKey, chatActionsKey, uiActionsKey)
interface Emits {
  (e: 'close'): void
}

defineEmits<Emits>()

// File preview state
const { previewFile, handleFileClick, closePreview } = useFilePreview()

// Merge config
const configRef = computed(() => {
  const cfg = props.config
  const configValue = cfg?.value ?? cfg
  return { ...defaultChatbotConfig, ...configValue }
})

// Effective layout - use prop if provided, otherwise derive from mode
const effectiveLayout = computed(() => {
  if (props.layout) return props.layout
  return modeToLayoutMap[props.mode ?? 'extended']
})

// View state management using useChatView - pass mode as reactive ref
const { viewState, showChatView, showTopicsView } = useChatView(computed(() => props.mode))

// Sidebar resize for dual layout
const sidebarResize = useResizeHandle({
  initialWidth: configRef.value.sidebarWidth,
  minWidth: configRef.value.sidebarMinWidth,
  maxWidth: configRef.value.sidebarMaxWidth,
  storageKey: 'chatbot-extended-sidebar-width',
  direction: 'right',
})

// Inject parent UI actions and provide enhanced version with view navigation
// Enhanced provide chain: panel adds showChatView/showTopicsView so child
// components can navigate views via inject (inject-primary pattern)
const parentUiActions = inject(uiActionsKey, null)
provide(uiActionsKey, {
  ...parentUiActions,
  showChatView,
  showTopicsView,
} satisfies UIActionHandlers)

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
  background: var(--bg-base, #ffffff);
  color: var(--text-primary, #303133);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Theme variations
  &--light {
    --bg-base: #ffffff;
    --text-primary: #303133;
  }

  &--dark {
    --bg-base: #1a1a1a;
    --text-primary: #e5e5e5;
  }

  // Extended mode (dual layout)
  &--extended {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100vh;
  }

  // Floating / sidebar (single layout)
  &--floating,
  &--sidebar {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  &__sidebar {
    flex-shrink: 0;
    border-right: 1px solid var(--border-light, #e4e7ed);
    overflow: hidden;

    // Mobile: collapse sidebar to full-width
    @media (max-width: 768px) {
      width: 100% !important;
      border-right: none;
      border-bottom: 1px solid var(--border-light, #e4e7ed);
    }
  }

  &__resize-handle {
    width: 4px;
    cursor: col-resize;
    background: transparent;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    transition: background 0.2s;

    &:hover {
      background: var(--theme-primary, #409eff);
    }

    &--active {
      background: var(--theme-primary, #409eff);
    }

    // Hide resize handle on mobile
    @media (max-width: 768px) {
      display: none;
    }
  }

  &--resizing {
    user-select: none;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>

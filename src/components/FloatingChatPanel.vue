<template>
  <!-- Floating Mode with DraggableWindow (when open) -->
  <DraggableWindow
    v-if="isPanelOpen"
    v-model="isPanelOpen"
    v-model:x="windowState.x"
    v-model:y="windowState.y"
    v-model:width="windowState.width"
    v-model:height="windowState.height"
    :min-width="configRef.minWidth || 300"
    :min-height="configRef.minHeight || 400"
    :draggable="configRef.draggable !== false"
    :resizable="configRef.resizable !== false"
    :theme="configRef.theme || 'light'"
    :remember-position="configRef.rememberPosition !== false"
    :rounded="true"
    :z-index="9998"
  >
    <template #header>
      <div class="floating-chat-panel__header-wrapper">
        <ChatHeader
          :title="configRef.labels?.title || 'AI Assistant'"
          :theme="configRef.theme || 'light'"
          :show-topics-button="true"
          :show-theme-toggle="false"
          :show-close-button="false"
          :unread-count="0"
          :labels="configRef.labels"
        />
        <button class="floating-chat-panel__close-btn" @click="closePanel">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </template>
    <div class="floating-chat-panel__body">
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
        :config="configRef"
        :layout="'single'"
        @close="showChatView"
      />
    </div>

    <!-- File Preview Modal (unified for all file types) -->
    <FilePreviewModal
      v-if="previewFile"
      :visible="!!previewFile"
      :file="previewFile"
      @close="closePreview"
    />
  </DraggableWindow>

  <!-- Suspended Ball for floating mode (when closed) -->
  <SuspendedBall
    v-if="!isPanelOpen"
    :position="configRef.position || 'bottom-right'"
    :size="56"
    :background-color="configRef.primaryColor || '#667eea'"
    :badge="0"
    @click="openPanel"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, provide } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { UIActionHandlers } from '@/types'
import { defaultChatbotConfig } from '@/types/config'
import type { Message, Topic } from '@/types'
import { useChatView } from '@/composables/useChatView'
import { useFilePreview } from '@/composables/useFilePreview'
import { uiActionsKey } from '@/symbols'

// Components
import DraggableWindow from './DraggableWindow.vue'
import SuspendedBall from './SuspendedBall.vue'
import TopicListView from './TopicListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import FilePreviewModal from './FilePreviewModal.vue'

interface Props {
  config?: ChatbotConfig
  messages: Message[]
  topics: Topic[]
  currentTopicId: string
  isStreaming: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
  enableVoiceInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  hideWelcome: false,
  hideQuickActions: false,
})

// Emits - reserved for external-facing events only
interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// Merge config
const configRef = computed(() => ({
  ...defaultChatbotConfig,
  ...props.config,
}))

// View state
const { viewState, showChatView, showTopicsView } = useChatView('floating')

// Inject parent UI actions and provide enhanced version with view navigation
// Enhanced provide chain: panel adds showChatView/showTopicsView so child
// components can navigate views via inject (inject-primary pattern)
const parentUiActions = inject(uiActionsKey, null)
provide(uiActionsKey, {
  ...parentUiActions,
  showChatView,
  showTopicsView,
} satisfies UIActionHandlers)

// Panel state
const isPanelOpen = ref(configRef.value.defaultExpanded)

// Window state
const windowState = ref({
  x: 0,
  y: 0,
  width: configRef.value.panelWidth || 400,
  height: configRef.value.panelHeight || 500,
})

// File preview state
const { previewFile, handleFileClick, closePreview } = useFilePreview()

// Methods
const openPanel = () => {
  isPanelOpen.value = true
}

const closePanel = () => {
  isPanelOpen.value = false
  emit('close')
}

// Initialize floating window position on mount
onMounted(() => {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  windowState.value = {
    x: windowWidth - (configRef.value.panelWidth || 400) - 20,
    y: Math.max(20, (windowHeight - (configRef.value.panelHeight || 500)) / 2),
    width: configRef.value.panelWidth || 400,
    height: configRef.value.panelHeight || 500,
  }
})

// Expose methods
defineExpose({
  openPanel,
  closePanel,
  showChatView,
  showTopicsView,
})
</script>

<style scoped lang="scss">
.floating-chat-panel {
  &__header-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  &__close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-tertiary, #909399);
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: var(--color-danger, #f56c6c);
      color: #fff;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

// When embedded in DraggableWindow
:deep(.draggable-window__body) {
  padding: 0;
  overflow: hidden;
}
</style>

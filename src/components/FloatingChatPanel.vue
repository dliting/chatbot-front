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
      <ChatHeader
        :title="configRef.labels?.title || '智能助手'"
        :theme="configRef.theme || 'light'"
        :show-topics-button="true"
        :show-theme-toggle="true"
        :show-close-button="true"
        :unread-count="0"
        @topics="showTopicsView"
        @toggle-theme="handleToggleTheme"
        @close="closePanel"
      />
    </template>
    <div class="floating-chat-panel__body">
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
        :enable-voice-input="enableVoiceInput"
        @send-message="handleSend"
        @quick-action="handleQuickAction"
        @edit="handleMessageEdit"
        @copy="handleMessageCopy"
        @refresh="handleMessageRefresh"
        @delete="handleMessageDelete"
        @file-click="handleFileClick"
        @thinking-toggle="$emit('thinking-toggle', $event)"
        @stop-generating="$emit('stop-generating')"
      />
      <TopicListView
        v-else
        :topics="topics"
        :current-topic-id="currentTopicId"
        :config="configRef"
        :layout="'single'"
        @close="showChatView"
        @create-topic="handleCreateTopic"
        @select-topic="handleSelectTopic"
        @delete-topic="handleDeleteTopic"
        @update-topic-title="(topicId, title) => $emit('update-topic-title', topicId, title)"
      />
    </div>

    <!-- File Preview Modal (unified for all file types) -->
    <FilePreviewModal
      v-if="previewFile"
      :visible="!!previewFile"
      :file="previewFile"
      @close="previewFile = null"
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
import { ref, computed, onMounted } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import type { Message, Topic } from '@/types'
import { useChatView } from '@/composables/useChatView'

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

// Emits
interface Emits {
  (e: 'send-message', data: { content: string; attachments?: import('@/types').Attachment[] }): void
  (e: 'quick-action', text: string): void
  (e: 'create-topic'): void
  (e: 'select-topic', topicId: string): void
  (e: 'delete-topic', topicId: string): void
  (e: 'update-topic-title', topicId: string, title: string): void
  (e: 'edit-message', message: Message): void
  (e: 'copy-message', message: Message): void
  (e: 'refresh-message', message: Message): void
  (e: 'delete-message', message: Message): void
  (e: 'toggle-theme'): void
  (e: 'thinking-toggle', enabled: boolean): void
  (e: 'stop-generating'): void
}

const emit = defineEmits<Emits>()

// Merge config
const configRef = computed(() => ({
  ...defaultChatbotConfig,
  ...props.config,
}))

// View state
const { viewState, showChatView, showTopicsView } = useChatView('floating')

// Panel state
const isPanelOpen = ref(configRef.value.defaultExpanded)

// Window state
const windowState = ref({
  x: 0,
  y: 0,
  width: configRef.value.panelWidth || 400,
  height: configRef.value.panelHeight || 500,
})

// Preview state
const previewFile = ref<{ type: string; url: string; name?: string } | null>(null)

// Unified file click handler for all file types
const handleFileClick = (file: { type: string; url: string; name?: string }) => {
  previewFile.value = file
}

// Methods
const openPanel = () => {
  isPanelOpen.value = true
}

const closePanel = () => {
  isPanelOpen.value = false
}

const handleToggleTheme = () => {
  // Note: theme is managed externally through config
  emit('toggle-theme')
}

const handleSend = (data: { content: string; attachments?: import('@/types').Attachment[] }) => {
  emit('send-message', data)
}

const handleQuickAction = (text: string) => {
  emit('quick-action', text)
}

const handleCreateTopic = () => {
  emit('create-topic')
}

const handleSelectTopic = (topicId: string) => {
  emit('select-topic', topicId)
  showChatView()
}

const handleDeleteTopic = (topicId: string) => {
  emit('delete-topic', topicId)
}

const handleMessageEdit = (message: Message) => {
  emit('edit-message', message)
}

const handleMessageCopy = (message: Message) => {
  emit('copy-message', message)
}

const handleMessageRefresh = (message: Message) => {
  emit('refresh-message', message)
}

const handleMessageDelete = (message: Message) => {
  emit('delete-message', message)
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
  handleToggleTheme,
})
</script>

<style scoped lang="scss">
.floating-chat-panel {
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

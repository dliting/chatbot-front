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
        :show-sessions-button="true"
        :show-theme-toggle="true"
        :show-close-button="true"
        :unread-count="0"
        @sessions="showSessionsView"
        @toggle-theme="toggleTheme"
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
        @send-message="handleSend"
        @quick-action="handleQuickAction"
        @edit="handleMessageEdit"
      />
      <SessionListView
        v-else
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :config="configRef"
        @close="showChatView"
        @create-session="handleCreateSession"
        @select-session="handleSelectSession"
        @delete-session="handleDeleteSession"
      />
    </div>
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
import type { Message, Session } from '@/types'
import { useChatView } from '@/composables/useChatView'

// Components
import DraggableWindow from './DraggableWindow.vue'
import SuspendedBall from './SuspendedBall.vue'
import SessionListView from './SessionListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'

interface Props {
  config?: ChatbotConfig
  messages: Message[]
  sessions: Session[]
  currentSessionId: string
  isStreaming: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  hideWelcome: false,
  hideQuickActions: false,
})

// Emits
interface Emits {
  (e: 'send-message', data: { content: string; images?: string[] }): void
  (e: 'quick-action', text: string): void
  (e: 'create-session'): void
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'edit-message', message: Message): void
}

const emit = defineEmits<Emits>()

// Merge config
const configRef = computed(() => ({
  ...defaultChatbotConfig,
  ...props.config,
}))

// View state
const { viewState, showChatView, showSessionsView } = useChatView('floating')

// Panel state
const isPanelOpen = ref(configRef.value.defaultExpanded)

// Window state
const windowState = ref({
  x: 0,
  y: 0,
  width: configRef.value.panelWidth || 400,
  height: configRef.value.panelHeight || 500,
})

// Methods
const openPanel = () => {
  isPanelOpen.value = true
}

const closePanel = () => {
  isPanelOpen.value = false
}

const toggleTheme = () => {
  // Note: theme is managed externally through config
  emit('toggle-theme')
}

const handleSend = (data: { content: string; images?: string[] }) => {
  emit('send-message', data)
}

const handleQuickAction = (text: string) => {
  emit('quick-action', text)
}

const handleCreateSession = () => {
  emit('create-session')
}

const handleSelectSession = (sessionId: string) => {
  emit('select-session', sessionId)
  showChatView()
}

const handleDeleteSession = (sessionId: string) => {
  emit('delete-session', sessionId)
}

const handleMessageEdit = (message: Message) => {
  emit('edit-message', message)
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
  toggleTheme,
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

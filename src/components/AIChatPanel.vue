<template>
  <!-- Embedded mode: When panelOpen is provided, AIChatbot/ChatPanel manages DraggableWindow -->
  <!-- Only render content, no window decorations -->
  <template v-if="props.panelOpen !== undefined">
    <div class="ai-chat__body">
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :messages="currentMessages"
        :welcome-visible="!hideWelcome && currentMessages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        @send-message="handleSend"
        @quick-action="sendQuickMessage"
        @edit="handleMessageEdit"
      />
      <SessionListView
        v-else
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :config="config"
        @close="showChatView"
        @create-session="handleCreateSession"
        @select-session="handleSwitchSession"
        @delete-session="handleDeleteSession"
      />
    </div>
  </template>

  <!-- Standalone mode: When panelOpen is undefined, manage own DraggableWindow -->
  <!-- Floating Mode with DraggableWindow -->
  <DraggableWindow
    v-else-if="chatMode === 'floating' && isPanelOpen"
    v-model="isPanelOpen"
    v-model:x="windowState.x"
    v-model:y="windowState.y"
    v-model:width="windowState.width"
    v-model:height="windowState.height"
    :min-width="config.minWidth || 300"
    :min-height="config.minHeight || 400"
    :draggable="config.draggable !== false"
    :resizable="config.resizable !== false"
    :theme="config.theme || 'light'"
    :remember-position="config.rememberPosition !== false"
    :rounded="true"
    :z-index="9998"
  >
    <template #header>
      <ChatHeader
        :title="config.labels?.title || '智能助手'"
        :theme="config.theme || 'light'"
        :show-sessions-button="true"
        :show-theme-toggle="true"
        :show-close-button="true"
        :unread-count="0"
        @sessions="showSessionsView"
        @toggle-theme="toggleTheme"
        @close="closePanel"
      />
    </template>
    <div class="ai-chat__body">
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :messages="currentMessages"
        :welcome-visible="!hideWelcome && currentMessages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        @send-message="handleSend"
        @quick-action="sendQuickMessage"
        @edit="handleMessageEdit"
      />
      <SessionListView
        v-else
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :config="config"
        @close="showChatView"
        @create-session="handleCreateSession"
        @select-session="handleSwitchSession"
        @delete-session="handleDeleteSession"
      />
    </div>
  </DraggableWindow>

  <!-- Suspended Ball for floating mode (when closed) -->
  <SuspendedBall
    v-else-if="chatMode === 'floating' && !isPanelOpen"
    :position="config.position || 'bottom-right'"
    :size="56"
    :background-color="config.primaryColor || '#667eea'"
    :badge="0"
    @click="openPanel"
  />

  <!-- Non-Floating Modes: Main container -->
  <div
    v-else
    :class="containerClasses"
  >
    <!-- Dual Layout: Sidebar + Main Content -->
    <template v-if="effectiveLayout === 'dual'">
      <!-- Session Sidebar -->
      <aside class="ai-chat__sidebar">
        <SessionListView
          :sessions="sessions"
          :current-session-id="currentSessionId"
          :config="config"
          :is-embedded="true"
          @create-session="handleCreateSession"
          @select-session="handleSwitchSession"
          @delete-session="handleDeleteSession"
        />
      </aside>

      <!-- Main Chat Area -->
      <main class="ai-chat__main">
        <ChatHeader
          v-if="!hideHeader"
          :title="config.labels?.title || '智能助手'"
          :theme="config.theme || 'light'"
          :show-theme-toggle="true"
          @toggle-theme="toggleTheme"
        />
        <ChatContent
          :messages="currentMessages"
          :welcome-visible="!hideWelcome && currentMessages.length === 0"
          :quick-actions-visible="!hideQuickActions"
          :is-streaming="isStreaming"
          @send-message="handleSend"
          @quick-action="sendQuickMessage"
          @edit="handleMessageEdit"
        />
      </main>
    </template>

    <!-- Other Modes: View-based switching -->
    <template v-else>
      <ChatHeader
        v-if="!hideHeader && viewState.currentView === 'chat'"
        :title="config.labels?.title || '智能助手'"
        :theme="config.theme || 'light'"
        :show-sessions-button="true"
        :show-theme-toggle="true"
        @sessions="showSessionsView"
        @toggle-theme="toggleTheme"
      />
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :messages="currentMessages"
        :welcome-visible="!hideWelcome && currentMessages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        @send-message="handleSend"
        @quick-action="sendQuickMessage"
        @edit="handleMessageEdit"
      />
      <SessionListView
        v-else
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :config="config"
        @close="showChatView"
        @create-session="handleCreateSession"
        @select-session="handleSwitchSession"
        @delete-session="handleDeleteSession"
      />
    </template>
  </div>

  <!-- Modals and Overlays (always visible) -->
  <VoiceOverlay
    v-if="isRecording"
    @cancel="cancelVoice"
  />

  <ImagePreviewModal
    v-if="previewImage"
    :url="previewImage"
    @close="previewImage = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import type { ChatMode, Layout } from '@/types'
import { useChatbotState } from '@/composables/useChatbotState'
import { useChatView } from '@/composables/useChatView'
import { useApiClient } from '@/composables/useApiClient'
import { createMockStream } from '@/utils/stream'
import { createMockUploadEndpoint } from '@/utils/upload'

// Components
import DraggableWindow from './DraggableWindow.vue'
import SuspendedBall from './SuspendedBall.vue'
import SessionListView from './SessionListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import VoiceOverlay from './VoiceOverlay.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'

// Icons for quick actions
const WriteIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' }),
  h('path', { d: 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' })
])

const DocIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }),
  h('path', { d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8' })
])

const GlobeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('path', { d: 'M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' })
])

const CubeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' }),
  h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  h('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })
])

// Quick actions - reserved for future use
const _quickActions = [
  { id: 1, title: '写邮件', desc: '帮我撰写邮件', text: '帮我写一封邮件', icon: WriteIcon },
  { id: 2, title: '总结文章', desc: '提取关键信息', text: '帮我总结这篇文章', icon: DocIcon },
  { id: 3, title: '翻译', desc: '多语言翻译', text: '帮我翻译这段文字', icon: GlobeIcon },
  { id: 4, title: '数据分析', desc: '智能分析数据', text: '帮我分析数据', icon: CubeIcon },
]

interface Props {
  config?: ChatbotConfig
  mode?: ChatMode
  layout?: Layout
  hideHeader?: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  hideInputArea?: boolean
  apiClient?: ReturnType<typeof useApiClient>
  panelOpen?: boolean // External panel state (used when embedded in AIChatbot)
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  mode: 'floating',
  layout: 'single',
  hideHeader: false,
  hideWelcome: false,
  hideQuickActions: false,
  hideInputArea: false,
})

// Emits
interface Emits {
  (e: 'edit-message', message: import('@/types').Message): void
}

const emit = defineEmits<Emits>()

// Merge config - props.mode should take priority over config.chatMode
// Handle both plain objects and ref objects
const configRef = computed(() => {
  const cfg = props.config
  // If config is a ref, use its value; otherwise use it directly
  const configValue = cfg?.value ?? cfg
  return { ...defaultChatbotConfig, ...configValue }
})
// In Vue 3 script setup, computed refs are auto-unwrapped, so use configRef directly
const chatMode = computed(() => props.mode || configRef.value?.chatMode || defaultChatbotConfig.mode)

// Effective layout type - use prop if provided, otherwise derive from mode
const effectiveLayout = computed(() => {
  if (props.layout) return props.layout
  // Derive layout from mode if not explicitly provided
  if (chatMode.value === 'extended') return 'dual'
  if (chatMode.value === 'floating') return 'single'
  return 'single'
})

// State
const {
  state,
  currentMessages,
  isStreaming,
  addMessage,
  updateMessage,
  setStreamingMessage,
  switchSession,
  createSession,
  deleteSession,
  cleanup,
} = useChatbotState(configRef.value)

// View state
const { viewState, showChatView, showSessionsView } = useChatView(chatMode.value)

// Panel state for floating mode
// Use external panelOpen prop if provided (when embedded in AIChatbot), otherwise use internal state
const internalIsPanelOpen = ref(configRef.value.defaultExpanded)
const isPanelOpen = computed(() => props.panelOpen ?? internalIsPanelOpen.value)
const windowState = ref({
  x: 0,
  y: 0,
  width: configRef.value.panelWidth,
  height: configRef.value.panelHeight,
})

// Local state
const previewImage = ref<string | null>(null)
const isRecording = ref(false)
const _isMenuOpen = ref(false)

// Mock API - reserved for future use
const _uploadEndpoint = createMockUploadEndpoint(1000)

// Computed
const containerClasses = computed(() => [
  'ai-chat',
  `ai-chat--${chatMode.value}`,
  `ai-chat--${configRef.value.theme || 'light'}`,
])

const sessions = computed(() => state.sessions.list)
const currentSessionId = computed(() => state.sessions.currentId)

// Methods
// Only manage panel state internally if no external panelOpen prop is provided
const openPanel = () => {
  if (props.panelOpen === undefined) {
    internalIsPanelOpen.value = true
  }
}
const closePanel = () => {
  if (props.panelOpen === undefined) {
    internalIsPanelOpen.value = false
  }
}

const toggleTheme = () => {
  const _newTheme = configRef.value.theme === 'light' ? 'dark' : 'light'
  // Update theme logic here
}

const handleSend = async (data: { content: string; images?: string[] }) => {
  if (isStreaming.value) return

  const content = data.content.trim()
  const images = data.images || []
  const sessionId = currentSessionId.value

  // Create user message
  const userMessage = {
    id: `msg_${Date.now()}_user`,
    sessionId,
    role: 'user' as const,
    type: images.length > 0 ? (content ? 'mixed' : 'image') : ('text' as const),
    content,
    images: images.length > 0 ? images : undefined,
    timestamp: Date.now(),
    status: 'sent' as const,
  }
  addMessage(userMessage)

  // Create AI message
  const aiMessage = {
    id: `msg_${Date.now()}_ai`,
    sessionId,
    role: 'assistant' as const,
    type: 'text' as const,
    content: '',
    timestamp: Date.now(),
    status: 'loading' as const,
  }
  addMessage(aiMessage)
  setStreamingMessage(aiMessage.id)

  try {
    // Use API client if provided, otherwise use mock
    if (props.apiClient) {
      // Use real API with streaming
      const stream = props.apiClient.streamChat(sessionId, content, images)
      for await (const event of stream) {
        if (event.type === 'token' && event.content) {
          aiMessage.content += event.content
          updateMessage(aiMessage.id, { content: aiMessage.content })
        } else if (event.type === 'end') {
          aiMessage.status = 'sent'
          updateMessage(aiMessage.id, { status: 'sent' })
        }
      }
    } else {
      // Simulate streaming response (mock)
      const mockContent = generateMockResponse(content)
      const stream = createMockStream(mockContent, 30)

      for await (const event of stream) {
        if (event.type === 'token' && event.content) {
          aiMessage.content += event.content
          updateMessage(aiMessage.id, { content: aiMessage.content })
        } else if (event.type === 'end') {
          aiMessage.status = 'sent'
          updateMessage(aiMessage.id, { status: 'sent' })
        }
      }
    }
  } catch (error) {
    console.error('[AIChatPanel] Error:', error)
    aiMessage.status = 'error'
    updateMessage(aiMessage.id, { status: 'error' })
  } finally {
    setStreamingMessage(null)
  }
}

const sendQuickMessage = (text: string) => {
  handleSend({ content: text })
}

const handleCreateSession = () => {
  createSession()
}

const handleSwitchSession = (sessionId: string) => {
  switchSession(sessionId)
  showChatView()
}

const handleDeleteSession = (sessionId: string) => {
  deleteSession(sessionId)
}

// Handle message edit (double-click on user message)
const handleMessageEdit = (message: import('@/types').Message) => {
  emit('edit-message', message)
}

const _startRecording = () => {
  isRecording.value = true
}

const _stopRecording = () => {
  isRecording.value = false
}

const cancelVoice = () => {
  isRecording.value = false
}

const generateMockResponse = (_userInput: string): string => {
  const responses = [
    `我理解您的意思，让我来帮您分析一下。`,
    `这是一个很好的问题！`,
    `根据我的理解，我可以为您提供以下建议...`,
    `让我思考一下如何最好地帮助您。`,
    `您说得对，我完全理解您的需求。`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// Initialize floating window position
onMounted(() => {
  if (chatMode.value === 'floating') {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    windowState.value = {
      x: windowWidth - configRef.value.panelWidth - 20,
      y: Math.max(20, (windowHeight - configRef.value.panelHeight) / 2),
      width: configRef.value.panelWidth,
      height: configRef.value.panelHeight,
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
})

// Expose methods
defineExpose({
  toggleTheme,
  openPanel,
  closePanel,
})
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

  // Fullscreen mode
  &--fullscreen {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }

  // Extended mode: sidebar layout
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

  // Single layout / compact mode
  &--single,
  &--compact {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--chatbot-border-color, #e4e7ed);
    overflow: hidden;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

// When embedded in DraggableWindow (floating mode)
:deep(.draggable-window__body) {
  padding: 0;
  overflow: hidden;
}
</style>

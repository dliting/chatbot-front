<template>
  <div class="ai-chatbot" :data-theme="resolvedTheme">
    <!-- Suspended Ball (only for floating mode) -->
    <SuspendedBall
      v-if="chatMode === 'floating' && !state.ui.isPanelOpen"
      :position="config.position"
      :size="ballSize"
      :icon-color="state.ui.theme === 'dark' ? '#ffffff' : '#ffffff'"
      :background-color="config.primaryColor"
      :badge="unreadCount"
      @click="togglePanel"
    />

    <!-- Chat Panel (for sidebar and floating modes) -->
    <ChatPanel
      v-if="chatMode !== 'extended'"
      :is-open="state.ui.isPanelOpen"
      :mode="effectivePanelMode"
      :position="config.position"
      :theme="state.ui.theme"
      :title="config.labels?.title"
      :width="config.panelWidth"
      :height="config.panelHeight || 600"
      :show-theme-toggle="true"
      :draggable="config.draggable !== false"
      :resizable="config.resizable !== false"
      :min-width="config.minWidth || 300"
      :min-height="config.minHeight || 400"
      :remember-position="config.rememberPosition !== false"
      @close="togglePanel"
      @toggle-theme="toggleTheme"
    >
      <!-- AIChatPanel Component (handles all layouts internally) -->
      <AIChatPanel
        :mode="chatMode"
        :layout="layout"
        :panel-open="state.ui.isPanelOpen"
        :hide-header="!showAIChatHeader"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :hide-quick-actions="state.ui.panelMode === 'dialog'"
        :hide-input-area="false"
        :config="aiChatConfig"
        :api-client="apiClient"
        @edit-message="handleEditMessage"
        @send-message="handleSendMessage"
      />
    </ChatPanel>

    <!-- Extended Mode: AIChatPanel renders its own layout directly -->
    <AIChatPanel
      v-else
      :mode="chatMode"
      :layout="layout"
      :config="config"
      :messages="currentMessages"
      :sessions="state.sessions.list"
      :current-session-id="state.sessions.currentId"
      :is-streaming="false"
      :hide-welcome="false"
      :hide-quick-actions="false"
      :hide-header="!showAIChatHeader"
      :api-client="apiClient"
      @send-message="handleSendMessage"
      @quick-action="handleQuickAction"
      @create-session="_handleCreateSession"
      @select-session="_handleSwitchSession"
      @delete-session="_handleDeleteSession"
      @edit="handleEditMessage"
      @toggle-theme="toggleTheme"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import type { InteractionMode } from '@/types'
import { modeToLayoutMap } from '@/types'
import { useChatbotState } from '@/composables/useChatbotState'
import { useApiClient } from '@/composables/useApiClient'

// Components
import SuspendedBall from './SuspendedBall.vue'
import ChatPanel from './ChatPanel.vue'
import AIChatPanel from './AIChatPanel.vue'

// Props
interface Props {
  config?: ChatbotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
})

// Merge config with defaults
const config = computed((): Required<ChatbotConfig> => {
  const merged = { ...defaultChatbotConfig, ...props.config } as Required<ChatbotConfig>
  // Use new mode field if provided, fallback to legacy chatMode
  if (!merged.mode && merged.chatMode) {
    merged.mode = merged.chatMode as InteractionMode
  }
  return merged
})

// AIChat config (internal mode)
const aiChatConfig = computed(() => ({
  labels: config.value.labels,
  enableImageUpload: config.value.enableImageUpload,
  maxImageCount: config.value.maxImageCount,
  maxImageSize: config.value.maxImageSize,
  defaultExpanded: config.value.defaultExpanded,
}))

// API client - use ref to avoid instance loss (key fix)
const apiClient = ref()
watch(
  () => config.value.apiBaseUrl,
  (newUrl) => {
    if (newUrl) {
      apiClient.value = useApiClient({
        baseUrl: newUrl,
        streamEnabled: config.value.streamEnabled ?? true,
      })
    } else {
      apiClient.value = undefined
    }
  },
  { immediate: true }
)

// State
const {
  state,
  togglePanel,
  setTheme,
  switchSession,
  createSession,
  deleteSession,
  updateSessionTitle,
  cleanup,
} = useChatbotState(config.value)

// Computed
const ballSize = computed(() => (state.ui.isMobile ? 48 : 56))
// Get unread count from current session
const unreadCount = computed(() => {
  const currentSession = state.sessions.list.find(
    s => s.id === state.sessions.currentId
  )
  return currentSession?.unreadCount ?? 0
})

// Determine the chat mode based on interaction mode (new dual-dimension architecture)
// - 'extended' mode uses 'dual' layout (split layout)
// - 'sidebar' mode uses 'single' layout (tab switching)
// - 'floating' mode uses 'single' layout (tab switching)
const chatMode = computed(() => {
  // Use new mode field if provided
  if (config.value.mode === 'extended') return 'extended'
  if (config.value.mode === 'sidebar') return 'single'
  if (config.value.mode === 'floating') return 'floating'

  // Legacy fallback based on panel mode
  const panelMode = state.ui.panelMode
  if (panelMode === 'floating') return 'floating'
  if (panelMode === 'sidebar') return 'extended'
  return 'internal' // dialog, fullscreen
})

// Derive layout type from interaction mode using modeToLayoutMap
const layout = computed(() => {
  const mode = config.value.mode
  if (mode === 'floating' || mode === 'sidebar' || mode === 'extended') {
    return modeToLayoutMap[mode]
  }
  return 'single' // default
})

// Determine if AIChat should show its own header
// Extended mode: yes (has its own sidebar)
// Sidebar/Floating modes: no (ChatPanel already has a header)
const showAIChatHeader = computed(() => {
  return chatMode.value === 'extended'
})

// Map chatMode to effective panelMode for ChatPanel
const effectivePanelMode = computed(() => {
  const mode = config.value.mode || config.value.chatMode || 'floating'
  if (mode === 'extended' || mode === 'sidebar') return 'sidebar'
  return mode
})

// Resolve theme for data-theme attribute (supports 'system' theme)
const resolvedTheme = computed(() => {
  if (config.value.theme === 'system') {
    return state.ui.theme
  }
  return config.value.theme
})

// Get current messages for the active session
const currentMessages = computed(() => {
  const sessionId = state.sessions.currentId
  return state.messages.bySession[sessionId] || []
})

// Methods
const toggleTheme = () => {
  // Toggle between light and dark (respecting system theme if set)
  const currentTheme = state.ui.theme
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

const _handleCreateSession = () => {
  const newId = createSession()
  emit('sessionCreate', newId)
}

const _handleSwitchSession = (sessionId: string) => {
  switchSession(sessionId)
  emit('sessionChange', sessionId)
}

const _handleDeleteSession = (sessionId: string) => {
  deleteSession(sessionId)
  emit('sessionDelete', sessionId)
}

const _handleUpdateSessionTitle = (sessionId: string, title: string) => {
  updateSessionTitle(sessionId, title)
  emit('sessionTitleUpdate', sessionId, title)
}

const handleEditMessage = (message: import('@/types').Message) => {
  // Emit edit event for parent components to handle (e.g., fill input with message content)
  emit('editMessage', message)
}

// Handle quick action - send predefined text as message
const handleQuickAction = (text: string) => {
  handleSendMessage({ content: text })
}

// Handle send message - use apiClient to send to backend
const handleSendMessage = async (data: { content: string; images?: string[]; videos?: string[]; audios?: string[] }) => {
  const client = apiClient.value
  if (!client) {
    console.error('API client not available')
    return
  }

  // Get current session ID
  const sessionId = state.sessions.currentId
  if (!sessionId) {
    console.error('No active session')
    return
  }

  // Sync messages.currentSessionId with sessions.currentId to ensure consistency
  state.messages.currentSessionId = sessionId

  // Get or create messages array for current session
  if (!state.messages.bySession[sessionId]) {
    state.messages.bySession[sessionId] = []
  }
  const currentMessages = state.messages.bySession[sessionId]

  try {
    // Add user message to state
    const userMessage: import('@/types').Message = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: 'user',
      type: data.images?.length ? 'image' : data.videos?.length ? 'video' : data.audios?.length ? 'audio' : 'text',
      content: data.content,
      images: data.images,
      videos: data.videos,
      audios: data.audios,
      timestamp: Date.now(),
      status: 'sending'
    }
    currentMessages.push(userMessage)

    // Get AI response using streaming
    let fullContent = ''
    const assistantMessageId = `msg-${Date.now() + 1}`

    // Add placeholder for AI response
    currentMessages.push({
      id: assistantMessageId,
      sessionId,
      role: 'assistant',
      type: 'text',
      content: '',
      timestamp: Date.now(),
      status: 'loading'
    })

    // Use streaming API
    const stream = client.streamChat(
      sessionId,
      data.content,
      data.images,
      data.videos,
      data.audios
    )

    for await (const chunk of stream) {
      if (chunk.type === 'token' && chunk.content) {
        fullContent += chunk.content
        // Update assistant message content
        const assistantMsg = currentMessages.find(m => m.id === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.content = fullContent
        }
      } else if (chunk.type === 'end') {
        // Mark message as sent
        const userMsg = currentMessages.find(m => m.id === userMessage.id)
        if (userMsg) {
          userMsg.status = 'sent'
        }
        const assistantMsg = currentMessages.find(m => m.id === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.status = 'sent'
        }
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // Mark message as error
    const userMsg = state.messages.list.find(m => m.role === 'user' && m.status === 'sending')
    if (userMsg) {
      userMsg.status = 'error'
    }
  }
}

// Emits
interface Emits {
  (e: 'panelToggle', data: { isOpen: boolean; mode: string }): void
  (e: 'sessionChange', sessionId: string): void
  (e: 'sessionCreate', sessionId: string): void
  (e: 'sessionDelete', sessionId: string): void
  (e: 'sessionTitleUpdate', sessionId: string, title: string): void
  (e: 'editMessage', message: import('@/types').Message): void
}

const emit = defineEmits<Emits>()

// Watch panel open state
watch(
  () => state.ui.isPanelOpen,
  (isOpen) => {
    emit('panelToggle', { isOpen, mode: state.ui.panelMode })
  }
)

// Initialize theme
onMounted(() => {
  setTheme(config.value.theme)
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
})

// Expose methods
defineExpose({
  togglePanel,
  setTheme,
})
</script>

<style scoped lang="scss">
.ai-chatbot {
  --chatbot-primary-color: v-bind('config.primaryColor');
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>

<style>
/* Global styles for chatbot */
.ai-chatbot {
  --chatbot-primary-color: #409eff;
  --chatbot-success-color: #67c23a;
  --chatbot-warning-color: #e6a23c;
  --chatbot-danger-color: #f56c6c;

  /* Light theme */
  --chatbot-bg-color: #ffffff;
  --chatbot-text-color: #303133;
  --chatbot-border-color: #dcdfe6;
  --chatbot-subtext-color: #909399;

  /* Bubble colors - light */
  --chatbot-user-bubble-bg: #409eff;
  --chatbot-user-bubble-text: #ffffff;
  --chatbot-assistant-bubble-bg: #f5f7fa;
  --chatbot-assistant-bubble-text: #303133;

  /* Panel colors - light */
  --chatbot-panel-bg: #ffffff;
  --chatbot-panel-border: #e4e7ed;
  --chatbot-panel-text: #303133;
  --chatbot-panel-subtext: #909399;

  --chatbot-border-radius: 12px;
}

.ai-chatbot[data-theme='dark'] {
  /* Dark theme */
  --chatbot-bg-color: #1a1a1a;
  --chatbot-text-color: #e5e5e5;
  --chatbot-border-color: #4c4d4f;
  --chatbot-subtext-color: #a3a3a3;

  /* Bubble colors - dark */
  --chatbot-assistant-bubble-bg: #2c2c2c;
  --chatbot-assistant-bubble-text: #e5e5e5;

  /* Panel colors - dark */
  --chatbot-panel-bg: #1a1a1a;
  --chatbot-panel-border: #4c4d4f;
  --chatbot-panel-text: #e5e5e5;
  --chatbot-panel-subtext: #a3a3a3;
}
</style>

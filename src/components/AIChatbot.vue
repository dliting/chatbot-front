<template>
  <div class="ai-chatbot" :data-theme="resolvedTheme">
    <!-- Self-contained modes (floating/extended): AIChatPanel manages its own layout/window -->
    <AIChatPanel
      v-if="chatMode === 'floating' || chatMode === 'extended'"
      :mode="chatMode"
      :layout="layout"
      :config="themedConfig"
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

    <!-- Sidebar/Dialog modes: wrapped in ChatPanel for window management -->
    <ChatPanel
      v-else
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
        :messages="currentMessages"
        :sessions="state.sessions.list"
        :current-session-id="state.sessions.currentId"
        :is-streaming="false"
        :hide-header="!showAIChatHeader"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :hide-quick-actions="state.ui.panelMode === 'dialog'"
        :hide-input-area="false"
        :config="aiChatConfig"
        :api-client="apiClient"
        @send-message="handleSendMessage"
        @quick-action="handleQuickAction"
        @create-session="_handleCreateSession"
        @select-session="_handleSwitchSession"
        @delete-session="_handleDeleteSession"
        @edit="handleEditMessage"
        @toggle-theme="toggleTheme"
      />
    </ChatPanel>
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

// AIChat config (internal mode for floating/sidebar)
const aiChatConfig = computed(() => ({
  labels: config.value.labels,
  theme: resolvedTheme.value,
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

// Resolve theme for data-theme attribute
// Always use state.ui.theme since toggleTheme() updates it
const resolvedTheme = computed(() => {
  return state.ui.theme
})

// Config with resolved theme for passing to child components
const themedConfig = computed(() => ({
  ...config.value,
  theme: resolvedTheme.value,
}))

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
  // Reuse current session if it's empty (avoid duplicate empty sessions)
  const currentMsgs = state.messages.bySession[state.sessions.currentId]
  if (currentMsgs && currentMsgs.length > 0) {
    // Current session has messages, create a new session
    const newId = createSession()
    emit('sessionCreate', newId)
  }
  // If current session is empty, do nothing (user stays on the empty session)
}

const _handleSwitchSession = async (sessionId: string) => {
  switchSession(sessionId)
  emit('sessionChange', sessionId)

  // Load messages from backend for the selected session
  const client = apiClient.value
  if (client && !state.messages.bySession[sessionId]?.length) {
    try {
      const messages = await client.getSessionMessages(sessionId)
      state.messages.bySession[sessionId] = messages
    } catch (error) {
      console.error('Failed to load session messages:', error)
    }
  }
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
      messageId: `msg-${Date.now()}`,
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
      messageId: assistantMessageId,
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
        const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.content = fullContent
        }
      } else if (chunk.type === 'end') {
        // Mark message as sent
        const userMsg = currentMessages.find(m => m.messageId === userMessage.messageId)
        if (userMsg) {
          userMsg.status = 'sent'
        }
        const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.status = 'sent'
        }
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // Mark message as error
    const userMsg = currentMessages.find(m => m.role === 'user' && m.status === 'sending')
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

  /* Content background gradient - light */
  --chatbot-content-bg-1: #f0f4ff;
  --chatbot-content-bg-2: #e8f0ff;
  --chatbot-content-bg-3: #f5f3ff;

  /* Quick action - light */
  --chatbot-quick-action-bg: rgba(255, 255, 255, 0.7);
  --chatbot-quick-action-border: rgba(255, 255, 255, 0.5);

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

  /* Content background gradient - dark */
  --chatbot-content-bg-1: #1a1a2e;
  --chatbot-content-bg-2: #16213e;
  --chatbot-content-bg-3: #1a1a2e;

  /* Quick action - dark */
  --chatbot-quick-action-bg: rgba(44, 44, 44, 0.7);
  --chatbot-quick-action-border: rgba(76, 77, 79, 0.5);
}
</style>

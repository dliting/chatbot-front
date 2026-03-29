<template>
  <div class="ai-chatbot" :data-theme="resolvedTheme">
    <!-- Self-contained modes (floating/extended): AIChatPanel manages its own layout/window -->
    <AIChatPanel
      v-if="chatMode === 'floating' || chatMode === 'extended'"
      :mode="chatMode"
      :layout="layout"
      :config="themedConfig"
      :messages="currentMessages"
      :topics="state.topics.list"
      :current-topic-id="state.topics.currentId"
      :is-streaming="false"
      :hide-welcome="false"
      :hide-quick-actions="false"
      :hide-header="!showAIChatHeader"
      :api-client="apiClient"
      @send-message="handleSendMessage"
      @quick-action="handleQuickAction"
      @create-topic="_handleCreateTopic"
      @select-topic="_handleSwitchTopic"
      @delete-topic="_handleDeleteTopic"
      @edit="handleEditMessage"
      @copy="() => {}"
      @refresh="handleRefreshMessage"
      @delete="handleDeleteMessage"
      @toggle-theme="toggleTheme"
    />

    <!-- Sidebar/Dialog modes: wrapped in ChatPanel for window management -->
    <ChatPanel
      v-else
      :is-open="state.ui.isPanelOpen"
      :mode="effectivePanelMode"
      :show-header="!showAIChatHeader"
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
        :topics="state.topics.list"
        :current-topic-id="state.topics.currentId"
        :is-streaming="false"
        :hide-header="!showAIChatHeader"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :hide-quick-actions="state.ui.panelMode === 'dialog'"
        :hide-input-area="false"
        :config="aiChatConfig"
        :api-client="apiClient"
        @send-message="handleSendMessage"
        @quick-action="handleQuickAction"
        @create-topic="_handleCreateTopic"
        @select-topic="_handleSwitchTopic"
        @delete-topic="_handleDeleteTopic"
        @edit="handleEditMessage"
        @copy="() => {}"
        @refresh="handleRefreshMessage"
        @delete="handleDeleteMessage"
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
  switchTopic,
  createTopic,
  deleteTopic,
  updateTopicTitle,
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
// Sidebar mode: yes (needs topics button for view switching)
// Floating mode: no (FloatingChatPanel has its own header)
const showAIChatHeader = computed(() => {
  const mode = config.value.mode || config.value.chatMode
  return mode === 'extended' || mode === 'sidebar'
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

// Get current messages for the active topic
const currentMessages = computed(() => {
  const topicId = state.topics.currentId
  return state.messages.byTopic[topicId] || []
})

// Methods
const toggleTheme = () => {
  // Toggle between light and dark (respecting system theme if set)
  const currentTheme = state.ui.theme
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

const _handleCreateTopic = () => {
  // Reuse current topic if it's empty (avoid duplicate empty topics)
  const currentMsgs = state.messages.byTopic[state.topics.currentId]
  if (currentMsgs && currentMsgs.length > 0) {
    // Current topic has messages, create a new topic
    const newId = createTopic()
    emit('topicCreate', newId)
  }
  // If current topic is empty, do nothing (user stays on the empty topic)
}

const _handleSwitchTopic = async (topicId: string) => {
  switchTopic(topicId)
  emit('topicChange', topicId)

  // Load messages from backend for the selected topic
  const client = apiClient.value
  if (client && !state.messages.byTopic[topicId]?.length) {
    try {
      const messages = await client.getTopicMessages(topicId)
      state.messages.byTopic[topicId] = messages
    } catch (error) {
      console.error('Failed to load topic messages:', error)
    }
  }
}

const _handleDeleteTopic = (topicId: string) => {
  deleteTopic(topicId)
  emit('topicDelete', topicId)
}

const _handleUpdateTopicTitle = (topicId: string, title: string) => {
  updateTopicTitle(topicId, title)
  emit('topicTitleUpdate', topicId, title)
}

const handleEditMessage = (message: import('@/types').Message) => {
  // Emit edit event for parent components to handle (e.g., fill input with message content)
  emit('editMessage', message)
}

const handleRefreshMessage = (message: import('@/types').Message) => {
  // Refresh: remove the assistant message and resend the preceding user message
  const topicId = state.topics.currentId
  const msgs = state.messages.byTopic[topicId]
  if (!msgs) return

  // Find the assistant message and remove it
  const index = msgs.findIndex(m => m.messageId === message.messageId)
  if (index !== -1) {
    msgs.splice(index, 1)
  }

  // Find the preceding user message
  for (let i = index - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') {
      handleSendMessage({ content: msgs[i].content })
      break
    }
  }
}

const handleDeleteMessage = (message: import('@/types').Message) => {
  const topicId = state.topics.currentId
  const msgs = state.messages.byTopic[topicId]
  if (!msgs) return

  const index = msgs.findIndex(m => m.messageId === message.messageId)
  if (index !== -1) {
    msgs.splice(index, 1)
  }
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

  // Get current topic ID
  const topicId = state.topics.currentId
  if (!topicId) {
    console.error('No active topic')
    return
  }

  // Sync messages.currentTopicId with topics.currentId to ensure consistency
  state.messages.currentTopicId = topicId

  // Get or create messages array for current topic
  if (!state.messages.byTopic[topicId]) {
    state.messages.byTopic[topicId] = []
  }
  const currentMessages = state.messages.byTopic[topicId]

  try {
    // Add user message to state
    const userMessage: import('@/types').Message = {
      messageId: `msg-${Date.now()}`,
      topicId,
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
      topicId,
      role: 'assistant',
      type: 'text',
      content: '',
      timestamp: Date.now(),
      status: 'loading'
    })

    // Use streaming API
    const stream = client.streamChat(
      topicId,
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
  (e: 'topicChange', topicId: string): void
  (e: 'topicCreate', topicId: string): void
  (e: 'topicDelete', topicId: string): void
  (e: 'topicTitleUpdate', topicId: string, title: string): void
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
  --chatbot-user-bubble-bg: #5a6fd6;
  --chatbot-user-bubble-text: #ffffff;
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

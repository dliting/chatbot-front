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
      :is-streaming="isGenerating"
      :hide-welcome="false"
      :hide-quick-actions="false"
      :hide-header="!showAIChatHeader"
      :api-client="apiClient"
      :enable-thinking="config.enableThinking"
      :thinking-enabled="thinkingEnabled"
      :is-thinking="isThinkingActive"
      :enable-voice-input="config.enableVoiceInput"
      @send-message="handleSendMessage"
      @quick-action="handleQuickAction"
      @create-topic="_handleCreateTopic"
      @select-topic="_handleSwitchTopic"
      @delete-topic="_handleDeleteTopic"
      @update-topic-title="_handleUpdateTopicTitle"
      @edit="handleEditMessage"
      @copy="() => {}"
      @refresh="handleRefreshMessage"
      @delete="handleDeleteMessage"
      @toggle-theme="toggleTheme"
      @thinking-toggle="thinkingEnabled = $event"
      @stop-generating="handleStopGenerating"
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
        :is-streaming="isGenerating"
        :hide-header="!showAIChatHeader"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :hide-quick-actions="state.ui.panelMode === 'dialog'"
        :hide-input-area="false"
        :config="aiChatConfig"
        :api-client="apiClient"
        :enable-thinking="config.enableThinking"
        :thinking-enabled="thinkingEnabled"
        :is-thinking="isThinkingActive"
        :enable-voice-input="config.enableVoiceInput"
        @send-message="handleSendMessage"
        @quick-action="handleQuickAction"
        @create-topic="_handleCreateTopic"
        @select-topic="_handleSwitchTopic"
        @delete-topic="_handleDeleteTopic"
        @update-topic-title="_handleUpdateTopicTitle"
        @edit="handleEditMessage"
        @copy="() => {}"
        @refresh="handleRefreshMessage"
        @delete="handleDeleteMessage"
        @toggle-theme="toggleTheme"
        @thinking-toggle="thinkingEnabled = $event"
        @stop-generating="handleStopGenerating"
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
import { generateId } from '@/utils/helpers'

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
        streamTimeout: config.value.streamTimeout,
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

// Thinking state
const thinkingEnabled = ref(config.value.thinkingDefaultEnabled ?? defaultChatbotConfig.thinkingDefaultEnabled)
const isThinkingActive = ref(false)
const isGenerating = ref(false)
const abortController = ref<AbortController | null>(null)

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
// Sidebar mode: yes (needs sessions button for view switching)
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
  emit('ui:theme-changed', { theme: newTheme })
}

const _handleCreateTopic = async () => {
  // Reuse current topic if it's empty (avoid duplicate empty topics)
  const currentMsgs = state.messages.byTopic[state.topics.currentId]
  if (currentMsgs && currentMsgs.length > 0) {
    // Current topic has messages, create a new topic
    if (config.value.callbacks?.onCreateTopic) {
      try {
        const topic = await config.value.callbacks.onCreateTopic()
        state.topics.list.unshift(topic)
        state.topics.currentId = topic.topicId
        state.messages.currentTopicId = topic.topicId
        emit('topic:created', { topic })
        emit('topicCreate', topic.topicId)
      } catch (error) {
        console.error('Create topic callback failed:', error)
      }
    } else if (apiClient.value) {
      try {
        const topic = await apiClient.value.createTopic()
        state.topics.list.unshift(topic)
        state.topics.currentId = topic.topicId
        state.messages.currentTopicId = topic.topicId
        emit('topic:created', { topic })
        emit('topicCreate', topic.topicId)
      } catch (error) {
        console.error('Failed to create topic:', error)
      }
    } else {
      const newId = createTopic()
      const topic = state.topics.list.find(t => t.topicId === newId)
      if (topic) {
        emit('topic:created', { topic })
      }
      emit('topicCreate', newId)
    }
  }
  // If current topic is empty, do nothing (user stays on the empty topic)
}

const _handleSwitchTopic = async (topicId: string) => {
  // Call callback if provided (for host-side tracking)
  if (config.value.callbacks?.onSwitchTopic) {
    try {
      await config.value.callbacks.onSwitchTopic(topicId)
    } catch (error) {
      console.error('Switch topic callback failed:', error)
    }
  }

  // Switch topic locally
  switchTopic(topicId)

  // Emit both new and legacy events
  emit('topic:switched', { topicId })
  emit('topicChange', topicId)

  // Load messages: callback first, then apiClient fallback
  if (config.value.callbacks?.onLoadMessages) {
    try {
      const messages = await config.value.callbacks.onLoadMessages(topicId)
      state.messages.byTopic[topicId] = messages
    } catch (error) {
      console.error('Failed to load topic messages:', error)
    }
  } else if (apiClient.value && !state.messages.byTopic[topicId]?.length) {
    try {
      const messages = await apiClient.value.getTopicMessages(topicId)
      state.messages.byTopic[topicId] = messages
    } catch (error) {
      console.error('Failed to load topic messages:', error)
    }
  }
}

const _handleDeleteTopic = async (topicId: string) => {
  try {
    if (config.value.callbacks?.onDeleteTopic) {
      await config.value.callbacks.onDeleteTopic(topicId)
    } else if (apiClient.value) {
      await apiClient.value.deleteTopic(topicId)
    }
    // Remove from local state after successful backend operation
    deleteTopic(topicId)
    emit('topic:deleted', { topicId })
    emit('topicDelete', topicId)

    // Reload topics list after deletion (spec Section 4.1)
    await reloadTopics()
  } catch (error) {
    console.error('Failed to delete topic:', error)
  }
}

const _handleUpdateTopicTitle = async (topicId: string, title: string) => {
  // Get current topic to save old title for rollback
  const currentTopic = state.topics.list.find(t => t.topicId === topicId)
  const oldTitle = currentTopic?.title || ''

  // Optimistic local update
  updateTopicTitle(topicId, title)

  try {
    if (config.value.callbacks?.onUpdateTopicTitle) {
      await config.value.callbacks.onUpdateTopicTitle(topicId, title)
    } else if (apiClient.value) {
      await apiClient.value.updateTopicTitle(topicId, title)
    }
    emit('topic:title-updated', { topicId, title })
    emit('topicTitleUpdate', topicId, title)
  } catch (error) {
    console.error('Failed to update topic title:', error)
    // Rollback on failure
    updateTopicTitle(topicId, oldTitle)
    emit('topicTitleUpdate', topicId, oldTitle)
  }
}

const handleEditMessage = (message: import('@/types').Message) => {
  // Emit both new and legacy events
  // The host component is expected to handle filling the input with the edited content.
  // After the user submits the edited content, the flow goes through handleSendMessage
  // which will use onSendMessage callback (or apiClient) with messageId set for backend reference.
  emit('message:edited', { messageId: message.messageId, topicId: message.topicId })
  emit('editMessage', message)
}

const handleRefreshMessage = async (message: import('@/types').Message) => {
  // Regenerate: remove the assistant message and get a new AI response
  const topicId = state.topics.currentId
  const msgs = state.messages.byTopic[topicId]
  if (!msgs) return

  // Find the assistant message and remove it
  const index = msgs.findIndex(m => m.messageId === message.messageId)
  if (index !== -1) {
    msgs.splice(index, 1)
  }

  // Find the preceding user message
  let userMsg: import('@/types').Message | undefined
  for (let i = index - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') {
      userMsg = msgs[i]
      break
    }
  }
  if (!userMsg) return

  emit('message:regenerated', { messageId: message.messageId, topicId })

  // Use onRegenerateMessage callback if available, otherwise fall through to handleSendMessage
  if (config.value.callbacks?.onRegenerateMessage) {
    // Use the dedicated regenerate callback — follow same streaming pattern as handleSendMessage
    if (isGenerating.value) return

    isGenerating.value = true
    const controller = new AbortController()
    abortController.value = controller

    const assistantMessageId = generateId('msg')

    try {
      // Add placeholder for new AI response
      msgs.splice(index, 0, {
        messageId: assistantMessageId,
        topicId,
        role: 'assistant',
        type: 'text',
        content: '',
        timestamp: Date.now(),
        status: 'loading'
      })

      const thinkingRequested = thinkingEnabled.value
      const stream = config.value.callbacks.onRegenerateMessage({
        topicId,
        content: userMsg.content,
        attachments: userMsg.attachments,
        thinking: { enabled: thinkingRequested },
        signal: controller.signal,
        messageId: userMsg.messageId,
      })

      let fullContent = ''
      let fullThinkingContent = ''
      let thinkingStartTime = 0

      for await (const chunk of stream) {
        if (chunk.type === 'reasoning' && chunk.reasoningContent) {
          if (!thinkingRequested) continue
          if (!thinkingStartTime) thinkingStartTime = Date.now()
          isThinkingActive.value = true
          fullThinkingContent += chunk.reasoningContent
          const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
          if (assistantMsg) {
            assistantMsg.thinkingContent = fullThinkingContent
            assistantMsg.thinkingTime = Date.now() - thinkingStartTime
          }
        } else if (chunk.type === 'token' && chunk.content) {
          isThinkingActive.value = false
          fullContent += chunk.content
          const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
          if (assistantMsg) {
            assistantMsg.content = fullContent
            if (thinkingStartTime) {
              assistantMsg.thinkingTime = Date.now() - thinkingStartTime
            }
          }
        } else if (chunk.type === 'end') {
          if (controller.signal.aborted) break
          isThinkingActive.value = false
          const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
          if (assistantMsg) {
            assistantMsg.status = 'sent'
          }
        }
      }

      // Finalize status
      isThinkingActive.value = false
      const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
      if (assistantMsg && assistantMsg.status === 'loading') {
        assistantMsg.status = assistantMsg.content ? 'sent' : 'error'
      }
    } catch (error) {
      console.error('Failed to regenerate message:', error)
      isThinkingActive.value = false
      const assistantMsg = msgs.find(m => m.messageId === assistantMessageId)
      if (assistantMsg) {
        assistantMsg.status = 'error'
        assistantMsg.errorMessage = (error as Error).message || '重新生成失败'
      }
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  } else {
    // No regenerate callback — use handleSendMessage (which uses onSendMessage or apiClient)
    handleSendMessage({ content: userMsg.content, attachments: userMsg.attachments })
  }
}

const handleDeleteMessage = async (message: import('@/types').Message) => {
  const topicId = state.topics.currentId
  const msgs = state.messages.byTopic[topicId]
  if (!msgs) return

  const index = msgs.findIndex(m => m.messageId === message.messageId)
  if (index === -1) return

  try {
    // Try callback first, then apiClient fallback
    if (config.value.callbacks?.onDeleteMessage) {
      await config.value.callbacks.onDeleteMessage(message.messageId, topicId)
    } else if (apiClient.value) {
      await apiClient.value.deleteMessage(message.messageId)
    }
    // Remove from local state after successful backend operation
    msgs.splice(index, 1)
    emit('message:deleted', { messageId: message.messageId, topicId })
  } catch (error) {
    console.error('Failed to delete message:', error)
  }
}

// Handle quick action - send predefined text as message
const handleQuickAction = (text: string) => {
  handleSendMessage({ content: text })
}

// Handle send message - use callback > apiClient > local-only fallback
const handleSendMessage = async (data: { content: string; attachments?: import('@/types').Attachment[] }) => {
  // Prevent sending while generating
  if (isGenerating.value) return

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

  isGenerating.value = true
  const controller = new AbortController()
  abortController.value = controller

  // Hoist IDs so they're accessible in catch block
  let userMessageId = ''
  let assistantMessageId = ''

  try {
    // Add user message to state
    const userMessage: import('@/types').Message = {
      messageId: generateId('msg'),
      topicId,
      role: 'user',
      type: data.attachments?.length
        ? (data.attachments.length === 1 ? data.attachments[0].type : 'mixed')
        : 'text',
      content: data.content,
      attachments: data.attachments,
      timestamp: Date.now(),
      status: 'sending'
    }
    userMessageId = userMessage.messageId
    currentMessages.push(userMessage)
    emit('message:sent', { message: userMessage })

    // Get AI response using streaming
    let fullContent = ''
    assistantMessageId = generateId('msg')

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

    // Capture thinking preference at send time (toggle may change mid-stream)
    const thinkingRequested = thinkingEnabled.value

    // Three-tier fallback: callback > apiClient > local-only
    let stream: AsyncGenerator<{ type: string; messageId?: string; content?: string; fullContent?: string; reasoningContent?: string }>
    if (config.value.callbacks?.onSendMessage) {
      stream = config.value.callbacks.onSendMessage({
        topicId,
        content: data.content,
        attachments: data.attachments,
        thinking: { enabled: thinkingRequested },
        signal: controller.signal,
      })
    } else if (apiClient.value) {
      stream = apiClient.value.streamChat(
        topicId,
        data.content,
        data.attachments,
        { thinking: { enabled: thinkingRequested }, signal: controller.signal }
      )
    } else {
      // Local-only mode: no API available
      console.error('No API client or callback provided')
      isGenerating.value = false
      return
    }

    emit('message:stream-start', { messageId: assistantMessageId })

    let fullThinkingContent = ''
    let thinkingStartTime = 0

    for await (const chunk of stream) {
      if (chunk.type === 'reasoning' && chunk.reasoningContent) {
        // Only process reasoning if user requested thinking mode
        if (!thinkingRequested) continue
        if (!thinkingStartTime) thinkingStartTime = Date.now()
        isThinkingActive.value = true
        fullThinkingContent += chunk.reasoningContent
        const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.thinkingContent = fullThinkingContent
          assistantMsg.thinkingTime = Date.now() - thinkingStartTime
        }
      } else if (chunk.type === 'token' && chunk.content) {
        isThinkingActive.value = false
        fullContent += chunk.content
        const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
        if (assistantMsg) {
          assistantMsg.content = fullContent
          if (thinkingStartTime) {
            assistantMsg.thinkingTime = Date.now() - thinkingStartTime
          }
        }
      } else if (chunk.type === 'end') {
        // If user already stopped, don't overwrite the stopped/error status
        if (controller.signal.aborted) break
        isThinkingActive.value = false
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
    // Stream ended — ensure message status is finalized
    isThinkingActive.value = false
    if (controller.signal.aborted) {
      // User aborted — finalize both user and assistant messages
      const userMsg = currentMessages.find(m => m.messageId === userMessage.messageId)
      if (userMsg) {
        userMsg.status = 'sent'
      }
      const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
      if (assistantMsg && assistantMsg.status === 'loading') {
        if (assistantMsg.content) {
          assistantMsg.status = 'stopped'
          assistantMsg.errorMessage = '已停止生成'
        } else {
          assistantMsg.status = 'error'
          assistantMsg.errorMessage = '已停止生成'
        }
      }
    } else {
      // Stream completed without abort — finalize any message still in loading state
      // (handles cases where 'end' event was missed or stream closed prematurely)
      const userMsg = currentMessages.find(m => m.messageId === userMessage.messageId)
      if (userMsg && userMsg.status === 'sending') {
        userMsg.status = 'sent'
      }
      const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
      if (assistantMsg && assistantMsg.status === 'loading') {
        if (assistantMsg.content || assistantMsg.thinkingContent) {
          assistantMsg.status = 'sent'
        } else {
          assistantMsg.status = 'error'
          assistantMsg.errorMessage = '响应异常结束'
        }
      }
    }
    emit('message:stream-end', { messageId: assistantMessageId, fullContent })
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // useApiClient swallows AbortError, so this branch is unreachable via normal abort flow.
      // It remains as defense-in-depth if the API client behavior ever changes.
      isThinkingActive.value = false
      const userMsg = currentMessages.find(m => m.messageId === userMessageId)
      if (userMsg) {
        userMsg.status = 'sent'
      }
      const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
      if (assistantMsg) {
        if (assistantMsg.content) {
          assistantMsg.status = 'stopped'
          assistantMsg.errorMessage = '已停止生成'
        } else {
          assistantMsg.status = 'error'
          assistantMsg.errorMessage = '已停止生成'
        }
      }
    } else {
      // Real error (network, timeout, server)
      console.error('Failed to send message:', error)
      const userMsg = currentMessages.find(m => m.messageId === userMessageId)
      if (userMsg) {
        userMsg.status = 'error'
      }
      const assistantMsg = currentMessages.find(m => m.messageId === assistantMessageId)
      if (assistantMsg) {
        assistantMsg.status = 'error'
        // Generate user-friendly error message
        const err = error as Error & { code?: string; status?: number }
        if (err.code === 'TIMEOUT' || err.name === 'TimeoutError') {
          assistantMsg.errorMessage = '响应超时，请检查网络或后端服务'
        } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          assistantMsg.errorMessage = '网络连接失败，请检查网络'
        } else if (err.status) {
          assistantMsg.errorMessage = `服务器错误 (HTTP ${err.status})`
        } else {
          assistantMsg.errorMessage = err.message || '发送失败，请重试'
        }
        emit('message:error', { message: assistantMsg, error: error as Error })
      }
    }
  } finally {
    isGenerating.value = false
    abortController.value = null
  }
}

// Handle stop generating
const handleStopGenerating = () => {
  if (abortController.value) {
    abortController.value.abort()
    emit('ui:stop-generating')
  }
}

// Emits
interface Emits {
  // New events (colon-separated, object payloads)
  (e: 'message:sent', data: { message: import('@/types').Message }): void
  (e: 'message:error', data: { message: import('@/types').Message; error: Error }): void
  (e: 'message:deleted', data: { messageId: string; topicId: string }): void
  (e: 'message:edited', data: { messageId: string; topicId: string }): void
  (e: 'message:copied', data: { message: import('@/types').Message }): void
  (e: 'message:resend', data: { message: import('@/types').Message }): void
  (e: 'message:regenerated', data: { messageId: string; topicId: string }): void
  (e: 'message:stream-start', data: { messageId: string }): void
  (e: 'message:stream-end', data: { messageId: string; fullContent: string }): void
  (e: 'topic:created', data: { topic: import('@/types').Topic }): void
  (e: 'topic:switched', data: { topicId: string }): void
  (e: 'topic:deleted', data: { topicId: string }): void
  (e: 'topic:title-updated', data: { topicId: string; title: string }): void
  (e: 'topic:cleared', data: { topicId: string }): void
  (e: 'ui:panel-toggle', data: { isOpen: boolean; mode: string }): void
  (e: 'ui:theme-changed', data: { theme: string }): void
  (e: 'ui:stop-generating'): void
  (e: 'chatbot:ready'): void

  // Legacy events (kept for backward compatibility)
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
    emit('ui:panel-toggle', { isOpen, mode: state.ui.panelMode })
    emit('panelToggle', { isOpen, mode: state.ui.panelMode })
  }
)

// Reload topics list from callback or apiClient (used after create/delete operations)
const reloadTopics = async () => {
  try {
    if (config.value.callbacks?.onLoadTopics) {
      const topics = await config.value.callbacks.onLoadTopics()
      if (topics.length > 0) {
        state.topics.list.length = 0
        state.topics.list.push(...topics)
      }
    } else if (apiClient.value) {
      const topics = await apiClient.value.getTopics()
      if (topics.length > 0) {
        state.topics.list.length = 0
        state.topics.list.push(...topics)
      }
    }
  } catch (error) {
    console.error('Failed to reload topics:', error)
  }
}

// Load messages for current topic from backend or callback
const loadCurrentTopicMessages = async () => {
  const topicId = state.topics.currentId
  if (!topicId) return

  try {
    let messages: import('@/types').Message[] = []
    if (config.value.callbacks?.onLoadMessages) {
      messages = await config.value.callbacks.onLoadMessages(topicId)
    } else if (apiClient.value) {
      messages = await apiClient.value.getTopicMessages(topicId)
    }
    if (messages.length > 0) {
      state.messages.byTopic[topicId] = messages
    }
  } catch (error: unknown) {
    // 404 is expected for new topics without message history - silently ignore
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('404')) {
      // New topic - no messages to load, this is normal
      return
    }
    console.error('Failed to load topic messages on mount:', error)
  }
}

// Initialize theme and restore messages from backend
onMounted(async () => {
  setTheme(config.value.theme)

  // Load topics from callback/apiClient if available
  if (config.value.callbacks?.onLoadTopics) {
    try {
      const topics = await config.value.callbacks.onLoadTopics()
      if (topics.length > 0) {
        state.topics.list.length = 0
        state.topics.list.push(...topics)
        state.topics.currentId = topics[0].topicId
        state.messages.currentTopicId = topics[0].topicId
      }
    } catch (error) {
      console.error('Failed to load topics:', error)
    }
  }

  await loadCurrentTopicMessages()
  emit('chatbot:ready')
})

// Watch theme changes from external config (e.g. settings page)
watch(() => config.value.theme, (newTheme) => {
  if (newTheme) {
    setTheme(newTheme)
  }
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
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>

<style>
/* Global styles for chatbot */
.ai-chatbot {
  /* Primary colors */
  --chatbot-primary-color: #409eff;
  --chatbot-primary-color-light: #ecf5ff;
  --chatbot-primary-color-dark: #337ecc;
  --chatbot-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* Status colors */
  --chatbot-success-color: #67c23a;
  --chatbot-warning-color: #e6a23c;
  --chatbot-danger-color: #f56c6c;
  --chatbot-danger-color-strong: #ef4444;
  --chatbot-info-color: #909399;

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

  /* Sizes */
  --chatbot-border-radius: 12px;
  --chatbot-ball-size: 56px;
  --chatbot-message-max-width: 800px;
  --chatbot-user-bubble-max-width: 70%;
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

  /* Primary color light variant for dark theme */
  --chatbot-primary-color-light: #1a3a5c;
  --chatbot-danger-color-dark: #c45656;
  --chatbot-primary-gradient: linear-gradient(135deg, #5a6fd6 0%, #6a5bb5 100%);
}
</style>

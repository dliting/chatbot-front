<template>
  <div class="ai-chatbot" :data-theme="resolvedTheme">
    <!-- Floating Mode (self-contained) -->
    <FloatingChatPanel
      v-if="config.mode === 'floating'"
      :config="themedConfig"
      :hide-welcome="false"
      :quick-actions="config.quickActions"
    />

    <!-- Extended Mode (self-contained) -->
    <EmbeddedChatPanel
      v-else-if="config.mode === 'extended'"
      :mode="config.mode"
      :layout="layout"
      :config="themedConfig"
      :hide-welcome="false"
      :quick-actions="config.quickActions"
      :hide-header="!showAIChatHeader"
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
      :show-theme-toggle="false"
      :draggable="config.draggable !== false"
      :resizable="config.resizable !== false"
      :min-width="config.minWidth || 300"
      :min-height="config.minHeight || 400"
      :remember-position="config.rememberPosition !== false"
      :labels="config.labels"
      @close="togglePanel"
      @toggle-theme="toggleTheme"
    >
      <EmbeddedChatPanel
        :mode="config.mode"
        :layout="layout"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :quick-actions="state.ui.panelMode === 'dialog' ? [] : config.quickActions"
        :hide-header="!showAIChatHeader"
        :config="aiChatConfig"
      />
    </ChatPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, provide } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import type { ChatActionHandlers, TopicActionHandlers, UIActionHandlers, ChatState } from '@/types'
import { defaultChatbotConfig, getDefaultLabels } from '@/types/config'
import { getDefaultQuickActions } from '@/constants/quickActions'
import { modeToLayoutMap } from '@/types'
import { chatStateKey, chatActionsKey, topicActionsKey, uiActionsKey, promptVarResolverKey } from '@/symbols'
import { useChatbotState } from '@/composables/useChatbotState'
import { useChatActions } from '@/composables/useChatActions'
import { useTopicActions } from '@/composables/useTopicActions'
import { useApiClient } from '@/composables/useApiClient'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePromptVariables } from '@/composables/usePromptVariables'

import ChatPanel from './ChatPanel.vue'
import FloatingChatPanel from './FloatingChatPanel.vue'
import EmbeddedChatPanel from './EmbeddedChatPanel.vue'

// Props
interface Props {
  config?: ChatbotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
})

// Emits
interface Emits {
  (e: 'message:sent', data: { message: import('@/types').Message }): void
  (e: 'message:error', data: { message: import('@/types').Message; error: Error }): void
  (e: 'message:deleted', data: { messageId: string; topicId: string }): void
  (e: 'message:edited', data: { messageId: string; topicId: string }): void
  (e: 'message:regenerated', data: { messageId: string; topicId: string }): void
  (e: 'message:stream-start', data: { messageId: string }): void
  (e: 'message:stream-end', data: { messageId: string; fullContent: string }): void
  (e: 'topic:created', data: { topic: import('@/types').Topic }): void
  (e: 'topic:switched', data: { topicId: string }): void
  (e: 'topic:deleted', data: { topicId: string }): void
  (e: 'topic:title-updated', data: { topicId: string; title: string }): void
  (e: 'ui:panel-toggle', data: { isOpen: boolean; mode: string }): void
  (e: 'ui:theme-changed', data: { theme: string }): void
  (e: 'ui:stop-generating'): void
  (e: 'chatbot:ready'): void
  (e: 'chatbot:error', data: { error: import('@/utils/errors').ChatbotError }): void
}

const emit = defineEmits<Emits>()

// Merge config with defaults
const config = computed((): Required<ChatbotConfig> => {
  const merged = { ...defaultChatbotConfig, ...props.config } as Required<ChatbotConfig>
  // Use locale-aware labels when user hasn't overridden labels
  if (!props.config?.labels || Object.keys(props.config.labels).length === 0) {
    merged.labels = getDefaultLabels(merged.locale)
  }
  // Use locale-aware quick actions when user hasn't provided custom ones
  if (!props.config?.quickActions) {
    merged.quickActions = getDefaultQuickActions(merged.locale)
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

// API client
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
  { immediate: true },
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
  removeMessage,
  insertMessage,
  updateMessage,
  ensureMessages: ensureMessagesForTopic,
  setTopicList,
  setCurrentTopicId,
  addTopicToFront,
  setMessages,
  init: stateInit,
  cleanup,
} = useChatbotState(config.value)

// Thinking state
const thinkingEnabled = ref(config.value.thinkingDefaultEnabled ?? defaultChatbotConfig.thinkingDefaultEnabled)

// Emit helper (bridges composable string-based emits to Vue's typed defineEmits)
function emitEvent(event: string, ...args: unknown[]): void {
  // Vue's emit supports string event names at runtime; cast to bypass TS strictness
  ;(emit as (event: string, ...args: unknown[]) => void)(event, ...args)
}

// Error handler
const { handleError } = useErrorHandler({ emit: emitEvent })

// Chat actions (message send/stream/delete/edit)
const chatActions = useChatActions({
  config,
  state,
  apiClient,
  emit: emitEvent,
  handleError,
  ensureMessages: ensureMessagesForTopic,
  removeMessage,
  insertMessage,
  updateMessage,
  setCurrentTopicId,
})

// Topic actions (create/switch/delete/rename)
const topicActions = useTopicActions({
  config,
  state,
  apiClient,
  emit: emitEvent,
  handleError,
  switchTopic,
  createTopic,
  deleteTopic,
  updateTopicTitle,
  setTopicList,
  setCurrentTopicId,
  addTopicToFront,
  setMessages,
})

// Computed
const layout = computed(() => {
  const mode = config.value.mode
  if (mode === 'floating' || mode === 'sidebar' || mode === 'extended') {
    return modeToLayoutMap[mode]
  }
  return 'single'
})

const showAIChatHeader = computed(() => {
  const mode = config.value.mode
  return mode === 'extended' || mode === 'sidebar'
})

const effectivePanelMode = computed(() => {
  const mode = config.value.mode || 'floating'
  if (mode === 'extended' || mode === 'sidebar') return 'sidebar'
  return mode
})

const resolvedTheme = computed(() => state.ui.theme)

const themedConfig = computed(() => ({
  ...config.value,
  theme: resolvedTheme.value,
}))

const currentMessages = computed(() => {
  const topicId = state.topics.currentId
  return state.messages.byTopic[topicId] || []
})

// Provide state for child components via inject (reduces prop drilling)
provide(chatStateKey, {
  messages: currentMessages,
  topics: computed(() => state.topics.list),
  currentTopicId: computed(() => state.topics.currentId),
  isStreaming: computed(() => chatActions.isGenerating.value),
  streamingMessageId: computed(() => state.messages.streamingMessageId),
  enableThinking: config.value.enableThinking,
  thinkingEnabled,
  isThinking: chatActions.isThinkingActive,
  enableVoiceInput: config.value.enableVoiceInput,
} satisfies ChatState)

provide(chatActionsKey, {
  sendMessage: chatActions.sendMessage,
  refreshMessage: chatActions.refreshMessage,
  deleteMessage: chatActions.deleteMessage,
  editMessage: chatActions.editMessage,
  stopGenerating: chatActions.stopGenerating,
  isGenerating: chatActions.isGenerating,
  isThinkingActive: chatActions.isThinkingActive,
} satisfies ChatActionHandlers)

provide(topicActionsKey, {
  createNewTopic: topicActions.createNewTopic,
  switchToTopic: topicActions.switchToTopic,
  removeTopic: topicActions.removeTopic,
  removeTopics: topicActions.removeTopics,
  renameTopic: topicActions.renameTopic,
} satisfies TopicActionHandlers)

// Methods
const toggleTheme = () => {
  const newTheme = state.ui.theme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
  emit('ui:theme-changed', { theme: newTheme })
}

// Provide UI action handlers
provide(uiActionsKey, {
  toggleTheme,
  setThinkingEnabled: (enabled: boolean) => { thinkingEnabled.value = enabled },
  thinkingEnabled,
} satisfies UIActionHandlers)

// Provide prompt variable resolver for QuickAction variable substitution
// Note: uses config.value snapshot — resolver won't update if promptVariables changes reactively
const promptVarResolver = usePromptVariables(config.value.promptVariables)
provide(promptVarResolverKey, promptVarResolver)

// Watch panel open state
watch(
  () => state.ui.isPanelOpen,
  (isOpen) => {
    emit('ui:panel-toggle', { isOpen, mode: state.ui.panelMode })
  },
)

// Initialize
onMounted(async () => {
  stateInit()
  await topicActions.loadInitialTopics()
  await topicActions.loadCurrentTopicMessages()
  emit('chatbot:ready')
})

watch(() => config.value.theme, (newTheme) => {
  if (newTheme) setTheme(newTheme)
})

onUnmounted(() => {
  cleanup()
})

defineExpose({
  togglePanel,
  setTheme,
})
</script>

<style scoped lang="scss">
.ai-chatbot {
  --theme-primary: v-bind('config.primaryColor');
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>

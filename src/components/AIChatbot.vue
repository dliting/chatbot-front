<template>
  <div class="ai-chatbot" :data-theme="config.theme">
    <!-- Suspended Ball -->
    <SuspendedBall
      v-if="!state.ui.isPanelOpen"
      :position="config.position"
      :size="ballSize"
      :icon-color="config.theme === 'dark' ? '#ffffff' : '#ffffff'"
      :background-color="config.primaryColor"
      :badge="unreadCount"
      @click="togglePanel"
    />

    <!-- Chat Panel -->
    <ChatPanel
      :is-open="state.ui.isPanelOpen"
      :mode="state.ui.panelMode"
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
      <!-- Session Sidebar -->
      <SessionManager
        v-if="config.enableSessionManager && state.ui.panelMode === 'sidebar'"
        :sessions="state.sessions.list"
        :current-session-id="state.sessions.currentId"
        :new-chat-label="config.labels?.newChat"
        @create-session="handleCreateSession"
        @switch-session="handleSwitchSession"
        @delete-session="handleDeleteSession"
      />

      <!-- AIChat Component (Internal Mode) -->
      <AIChat
        :mode="chatMode"
        :hide-header="true"
        :hide-welcome="state.ui.panelMode === 'dialog'"
        :hide-quick-actions="state.ui.panelMode === 'dialog'"
        :hide-input-area="false"
        :config="aiChatConfig"
      />
    </ChatPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import { useChatbotState } from '@/composables/useChatbotState'

// Components
import SuspendedBall from './SuspendedBall.vue'
import ChatPanel from './ChatPanel.vue'
import SessionManager from './SessionManager.vue'
import AIChat from './AIChat.vue'

// Props
interface Props {
  config?: ChatbotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
})

// Merge config with defaults
const config = computed((): Required<ChatbotConfig> => {
  return { ...defaultChatbotConfig, ...props.config } as Required<ChatbotConfig>
})

// AIChat config (internal mode)
const aiChatConfig = computed(() => ({
  labels: config.value.labels,
  enableImageUpload: config.value.enableImageUpload,
  maxImageCount: config.value.maxImageCount,
  maxImageSize: config.value.maxImageSize,
}))

// State
const {
  state,
  togglePanel,
  setTheme,
  switchSession,
  createSession,
  deleteSession,
} = useChatbotState(config.value)

// Computed
const ballSize = computed(() => (state.ui.isMobile ? 48 : 56))
const unreadCount = computed(() => 1) // Simplified badge
// Determine the chat mode based on panel mode - only floating uses floating style, others use internal
const chatMode = computed(() => {
  return state.ui.panelMode === 'floating' ? 'floating' : 'internal'
})

// Methods
const toggleTheme = () => {
  const newTheme = state.ui.theme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

const handleCreateSession = () => {
  const newId = createSession()
  emit('sessionCreate', newId)
}

const handleSwitchSession = (sessionId: string) => {
  switchSession(sessionId)
  emit('sessionChange', sessionId)
}

const handleDeleteSession = (sessionId: string) => {
  deleteSession(sessionId)
  emit('sessionDelete', sessionId)
}

// Emits
interface Emits {
  (e: 'panelToggle', data: { isOpen: boolean; mode: string }): void
  (e: 'sessionChange', sessionId: string): void
  (e: 'sessionCreate', sessionId: string): void
  (e: 'sessionDelete', sessionId: string): void
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

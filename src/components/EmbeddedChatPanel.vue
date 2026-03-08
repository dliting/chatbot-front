<template>
  <!-- Embedded Modes: Main container -->
  <div
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
          @create-session="$emit('create-session')"
          @select-session="$emit('select-session', $event)"
          @delete-session="$emit('delete-session', $event)"
        />
      </aside>

      <!-- Main Chat Area -->
      <main class="ai-chat__main">
        <ChatHeader
          v-if="!hideHeader"
          :title="config.labels?.title || '智能助手'"
          :theme="config.theme || 'light'"
          :show-theme-toggle="true"
          @toggle-theme="$emit('toggle-theme')"
        />
        <ChatContent
          :messages="messages"
          :welcome-visible="!hideWelcome && messages.length === 0"
          :quick-actions-visible="!hideQuickActions"
          :is-streaming="isStreaming"
          @send-message="$emit('send-message', $event)"
          @quick-action="$emit('quick-action', $event)"
          @edit="$emit('edit', $event)"
        />
      </main>
    </template>

    <!-- Single Layout: View-based switching -->
    <template v-else>
      <ChatHeader
        v-if="!hideHeader && viewState.currentView === 'chat'"
        :title="config.labels?.title || '智能助手'"
        :theme="config.theme || 'light'"
        :show-sessions-button="true"
        :show-theme-toggle="true"
        @sessions="showSessionsView"
        @toggle-theme="$emit('toggle-theme')"
      />
      <ChatContent
        v-if="viewState.currentView === 'chat'"
        :key="messages.length"
        :messages="messages"
        :welcome-visible="!hideWelcome && messages.length === 0"
        :quick-actions-visible="!hideQuickActions"
        :is-streaming="isStreaming"
        @send-message="$emit('send-message', $event)"
        @quick-action="$emit('quick-action', $event)"
        @edit="$emit('edit', $event)"
      />
      <SessionListView
        v-else
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :config="config"
        @close="showChatView"
        @create-session="$emit('create-session')"
        @select-session="$emit('select-session', $event)"
        @delete-session="$emit('delete-session', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMode, Layout, ChatbotConfig } from '@/types'
import { defaultChatbotConfig } from '@/types/config'
import { useChatView } from '@/composables/useChatView'

// Components
import SessionListView from './SessionListView.vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'

interface Props {
  mode?: ChatMode
  layout?: Layout
  config?: ChatbotConfig
  messages?: import('@/types').Message[]
  sessions?: import('@/types').Session[]
  currentSessionId?: string
  isStreaming?: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  hideHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'floating',
  layout: undefined,
  config: () => ({}),
  messages: () => [],
  sessions: () => [],
  currentSessionId: '',
  isStreaming: false,
  hideWelcome: false,
  hideQuickActions: false,
  hideHeader: false,
})

// Emits
interface Emits {
  (e: 'create-session'): void
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'send-message', data: { content: string; images?: string[]; videos?: string[]; audios?: string[] }): void
  (e: 'quick-action', text: string): void
  (e: 'edit', message: import('@/types').Message): void
  (e: 'toggle-theme'): void
}

defineEmits<Emits>()

// Merge config
const configRef = computed(() => {
  const cfg = props.config
  const configValue = cfg?.value ?? cfg
  return { ...defaultChatbotConfig, ...configValue }
})

// Effective layout - use prop if provided, otherwise derive from mode
const effectiveLayout = computed(() => {
  if (props.layout) return props.layout
  // Derive layout from mode if not explicitly provided
  if (props.mode === 'extended') return 'dual'
  if (props.mode === 'floating') return 'single'
  return 'single'
})

// View state management using useChatView - pass mode as reactive ref
const { viewState, showChatView, showSessionsView } = useChatView(computed(() => props.mode))

// Container classes
const containerClasses = computed(() => [
  'ai-chat',
  `ai-chat--${props.mode}`,
  `ai-chat--${configRef.value.theme || 'light'}`,
])
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

  // Extended mode
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

  // Single layout / compact mode / floating / sidebar
  &--single,
  &--compact,
  &--floating,
  &--sidebar {
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
}
</style>

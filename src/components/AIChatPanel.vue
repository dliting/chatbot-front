<template>
  <!-- Floating Mode -->
  <FloatingChatPanel
    v-if="mode === 'floating'"
    :config="config"
    :messages="messages"
    :sessions="sessions"
    :current-session-id="currentSessionId"
    :is-streaming="isStreaming"
    :hide-welcome="hideWelcome"
    :hide-quick-actions="hideQuickActions"
    :enable-thinking="enableThinking"
    :thinking-enabled="thinkingEnabled"
    :is-thinking="isThinking"
    @send-message="handleSendMessage"
    @quick-action="$emit('quick-action', $event)"
    @create-session="$emit('create-session')"
    @select-session="$emit('select-session', $event)"
    @delete-session="$emit('delete-session', $event)"
    @edit-message="$emit('edit', $event)"
    @copy-message="$emit('copy', $event)"
    @refresh-message="$emit('refresh', $event)"
    @delete-message="$emit('delete', $event)"
    @toggle-theme="$emit('toggle-theme')"
    @thinking-toggle="$emit('thinking-toggle', $event)"
  />

  <!-- Embedded Modes (extended/sidebar) -->
  <EmbeddedChatPanel
    v-else
    :mode="mode"
    :layout="layout"
    :config="config"
    :messages="messages"
    :sessions="sessions"
    :current-session-id="currentSessionId"
    :is-streaming="isStreaming"
    :hide-welcome="hideWelcome"
    :hide-quick-actions="hideQuickActions"
    :hide-header="hideHeader"
    :enable-thinking="enableThinking"
    :thinking-enabled="thinkingEnabled"
    :is-thinking="isThinking"
    @send-message="handleSendMessage"
    @quick-action="$emit('quick-action', $event)"
    @create-session="$emit('create-session')"
    @select-session="$emit('select-session', $event)"
    @delete-session="$emit('delete-session', $event)"
    @edit="$emit('edit', $event)"
    @copy="$emit('copy', $event)"
    @refresh="$emit('refresh', $event)"
    @delete="$emit('delete', $event)"
    @toggle-theme="$emit('toggle-theme')"
    @thinking-toggle="$emit('thinking-toggle', $event)"
  />
</template>

<script setup lang="ts">
import type { ChatMode, Layout, ChatbotConfig, Message, Session } from '@/types'

// Components
import FloatingChatPanel from './FloatingChatPanel.vue'
import EmbeddedChatPanel from './EmbeddedChatPanel.vue'

interface Props {
  mode?: ChatMode
  layout?: Layout
  config?: ChatbotConfig
  apiClient?: ReturnType<typeof import('@/composables/useApiClient')['useApiClient']>
  messages?: Message[]
  sessions?: Session[]
  currentSessionId?: string
  isStreaming?: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  hideHeader?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
}

withDefaults(defineProps<Props>(), {
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
  (e: 'edit', message: Message): void
  (e: 'copy', message: Message): void
  (e: 'refresh', message: Message): void
  (e: 'delete', message: Message): void
  (e: 'toggle-theme'): void
  (e: 'thinking-toggle', enabled: boolean): void
}

const emit = defineEmits<Emits>()

// Handle send message
const handleSendMessage = (data: { content: string; images?: string[]; videos?: string[]; audios?: string[] }) => {
  emit('send-message', data)
}
</script>

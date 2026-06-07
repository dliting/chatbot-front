<template>
  <!-- Floating Mode -->
  <FloatingChatPanel
    v-if="mode === 'floating'"
    :config="config"
    :messages="messages"
    :topics="topics"
    :current-topic-id="currentTopicId"
    :is-streaming="isStreaming"
    :hide-welcome="hideWelcome"
    :hide-quick-actions="hideQuickActions"
    :enable-thinking="enableThinking"
    :thinking-enabled="thinkingEnabled"
    :is-thinking="isThinking"
    :enable-voice-input="enableVoiceInput"
  />

  <!-- Embedded Modes (extended/sidebar) -->
  <EmbeddedChatPanel
    v-else
    :mode="mode"
    :layout="layout"
    :config="config"
    :messages="messages"
    :topics="topics"
    :current-topic-id="currentTopicId"
    :is-streaming="isStreaming"
    :hide-welcome="hideWelcome"
    :hide-quick-actions="hideQuickActions"
    :hide-header="hideHeader"
    :enable-thinking="enableThinking"
    :thinking-enabled="thinkingEnabled"
    :is-thinking="isThinking"
    :enable-voice-input="enableVoiceInput"
  />
</template>

<script setup lang="ts">
/**
 * AIChatPanel - Intermediate component that delegates to FloatingChatPanel or EmbeddedChatPanel.
 * With the inject-primary pattern, action events no longer need to be forwarded through this layer.
 * All data actions are handled via inject (topicActionsKey, chatActionsKey, uiActionsKey).
 */
import type { InteractionMode, Layout, ChatbotConfig, Message, Topic } from '@/types'

// Components
import FloatingChatPanel from './FloatingChatPanel.vue'
import EmbeddedChatPanel from './EmbeddedChatPanel.vue'

interface Props {
  mode?: InteractionMode
  layout?: Layout
  config?: ChatbotConfig
  apiClient?: ReturnType<typeof import('@/composables/useApiClient')['useApiClient']>
  messages?: Message[]
  topics?: Topic[]
  currentTopicId?: string
  isStreaming?: boolean
  hideWelcome?: boolean
  hideQuickActions?: boolean
  hideHeader?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
  enableVoiceInput?: boolean
}

withDefaults(defineProps<Props>(), {
  mode: 'floating',
  layout: undefined,
  config: () => ({}),
  messages: () => [],
  topics: () => [],
  currentTopicId: '',
  isStreaming: false,
  hideWelcome: false,
  hideQuickActions: false,
  hideHeader: false,
})
</script>

<template>
  <div class="chat-content">
    <!-- Chat Container -->
    <div class="chat-content__messages">
      <!-- Welcome Section -->
      <WelcomeScreen
        v-if="welcomeVisible"
        :labels="mergedLabels"
        :quick-actions="quickActions"
        :icon-base="quickActionIconBase"
        @quick-action="handleQuickAction"
      />

      <!-- Messages -->
      <MessageList
        :messages="effectiveMessages"
        :is-streaming="effectiveIsStreaming"
        :streaming-message-id="effectiveStreamingMessageId"
        :labels="mergedLabels"
        @file-click="$emit('file-click', $event)"
      />
    </div>

    <!-- Input Area -->
    <div class="chat-content__input-area">
      <ChatInput
        :disabled="effectiveIsStreaming"
        :enable-thinking="effectiveEnableThinking"
        :thinking-enabled="effectiveThinkingEnabled"
        :enable-voice-input="effectiveEnableVoiceInput"
        :placeholder="mergedLabels.placeholder"
        @send="handleSend"
        @stop="chatActions?.stopGenerating()"
        @file-click="$emit('file-click', $event)"
        @update:thinking-enabled="uiActions?.setThinkingEnabled?.($event)"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="mergedLabels.deleteConfirmTitle || 'Delete Confirmation'"
      :message="mergedLabels.deleteConfirm || 'Are you sure you want to delete this message?'"
      :confirm-text="mergedLabels.confirm || 'Confirm'"
      :cancel-text="mergedLabels.cancel || 'Cancel'"
      type="danger"
      @confirm="confirmDeleteMessage"
      @cancel="showDeleteDialog = false"
      @update:show="showDeleteDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Message } from '@/types'
import type { ChatbotLabels, QuickAction } from '@/types/config'
import { getDefaultLabels } from '@/types/config'
import { chatStateKey, chatActionsKey, uiActionsKey, promptVarResolverKey } from '@/symbols'
import WelcomeScreen from './WelcomeScreen.vue'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  messages?: Message[]
  welcomeVisible?: boolean
  quickActions?: QuickAction[]
  quickActionIconBase?: string
  isStreaming?: boolean
  streamingMessageId?: string | null
  labels?: Partial<ChatbotLabels>
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
  enableVoiceInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  welcomeVisible: true,
  quickActions: () => [],
  isStreaming: false,
  streamingMessageId: null,
  labels: () => ({}),
})

interface Emits {
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
}

defineEmits<Emits>()

// Inject state (preferred) and action handlers
const chatState = inject(chatStateKey, null)
const chatActions = inject(chatActionsKey)
const uiActions = inject(uiActionsKey)
const promptVarResolver = inject(promptVarResolverKey, null)

// Resolve state from inject (preferred) or props (fallback)
const effectiveMessages = computed(() => chatState?.messages?.value ?? props.messages)
const effectiveIsStreaming = computed(() => chatState?.isStreaming?.value ?? props.isStreaming)
const effectiveStreamingMessageId = computed(
  () => chatState?.streamingMessageId?.value ?? props.streamingMessageId
)
const effectiveEnableThinking = computed(() => chatState?.enableThinking ?? props.enableThinking)
const effectiveThinkingEnabled = computed(
  () => chatState?.thinkingEnabled?.value ?? props.thinkingEnabled
)
const effectiveEnableVoiceInput = computed(
  () => chatState?.enableVoiceInput ?? props.enableVoiceInput
)

const mergedLabels = computed(() => ({
  ...getDefaultLabels(),
  ...props.labels,
}))

const handleQuickAction = async (action: QuickAction) => {
  const resolvedPrompt = promptVarResolver
    ? await promptVarResolver.resolve(action.prompt)
    : action.prompt
  chatActions?.sendMessage({ content: resolvedPrompt, extraInfo: action.extraInfo })
}

const handleSend = (data: { content: string; attachments?: import('@/types').Attachment[] }) => {
  chatActions?.sendMessage(data)
}

// Delete dialog
const showDeleteDialog = ref(false)
const pendingDeleteMessage = ref<Message | null>(null)

const confirmDeleteMessage = () => {
  if (pendingDeleteMessage.value) {
    chatActions?.deleteMessage(pendingDeleteMessage.value)
    pendingDeleteMessage.value = null
  }
  showDeleteDialog.value = false
}
</script>

<style scoped lang="scss">
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    var(--content-bg-1, #f0f4ff) 0%,
    var(--content-bg-2, #e8f0ff) 50%,
    var(--content-bg-3, #f5f3ff) 100%
  );

  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.3);
      border-radius: 2px;
    }
  }

  &__input-area {
    flex-shrink: 0;
  }
}
</style>

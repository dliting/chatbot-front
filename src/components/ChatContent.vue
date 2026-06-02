<template>
  <div class="chat-content">
    <!-- Chat Container -->
    <div ref="messagesRef" class="chat-content__messages">
      <!-- Welcome Section -->
      <div v-if="welcomeVisible" class="chat-content__welcome">
        <h2 class="chat-content__welcome-title">{{ mergedLabels.welcomeTitle }}</h2>
        <p class="chat-content__welcome-subtitle">{{ mergedLabels.welcomeSubtitle }}</p>

        <!-- Quick Actions -->
        <div v-if="quickActionsVisible" class="chat-content__quick-actions">
          <div
            v-for="action in quickActions"
            :key="action.id"
            class="chat-content__quick-action"
            @click="handleQuickAction(action.text)"
          >
            <div class="chat-content__quick-action-icon">
              <component :is="action.icon" />
            </div>
            <div class="chat-content__quick-action-title">{{ action.title }}</div>
            <div class="chat-content__quick-action-desc">{{ action.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-content__message-list">
        <div
          v-for="message in messages"
          :key="message.messageId"
          :class="['chat-content__message', message.role, { 'chat-content__message--last-ai': lastAiMessageIds.has(message.messageId) }]"
          @dblclick="handleMessageDblClick(message)"
        >
          <!-- Thinking Block -->
          <ThinkingBlock
            v-if="message.role === 'assistant' && message.thinkingContent"
            :content="message.thinkingContent"
            :thinking-time="message.thinkingTime || 0"
            :is-thinking="isThinking && lastAiMessageIds.has(message.messageId)"
            :labels="mergedLabels.thinking"
            @copy="(content) => handleCopyThinking(content)"
          />
          <div class="chat-content__bubble">
            <!-- Images -->
            <div v-if="message.attachments && message.attachments.some(a => a.type === 'image')" class="chat-content__images">
              <img
                v-for="(img, idx) in message.attachments.filter(a => a.type === 'image')"
                :key="idx"
                :src="img.url"
                class="chat-content__image"
                @click="$emit('file-click', { type: 'image', url: img.url })"
              />
            </div>
            <!-- Text -->
            <div v-if="message.content" class="chat-content__text" :class="{ 'markdown-content': message.role === 'assistant' }">
              <span v-if="message.role === 'assistant'" v-html="formatMarkdownContent(message.content)" />
              <span v-else>{{ message.content }}</span>
            </div>
            <!-- Typing indicator -->
            <div v-if="message.status === 'loading' && !message.content" class="chat-content__typing">
              <span/><span/><span/>
            </div>
            <!-- Error / Stopped indicator -->
            <div v-if="(message.status === 'error' || message.status === 'stopped') && message.errorMessage" class="chat-content__error-msg">
              <svg viewBox="0 0 24 24" fill="currentColor" class="chat-content__error-icon">
                <path v-if="message.status === 'stopped'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{{ message.errorMessage }}</span>
              <button
                v-if="message.role === 'assistant' || message.status === 'error'"
                class="chat-content__error-retry"
                @click.stop="handleRefreshMessage(message)"
              >
                {{ mergedLabels.retry || 'Retry' }}
              </button>
            </div>
          </div>
          <!-- Message Actions (hover to show, Cherry Studio style) -->
          <div v-if="message.status !== 'loading' && message.status !== 'error' && message.content" :class="['chat-content__message-actions', { 'chat-content__message-actions--visible': lastAiMessageIds.has(message.messageId) }]">
            <button
              :class="['chat-content__action-btn', { 'chat-content__action-btn--copied': copyFeedbackMap[message.messageId] }]"
              :title="mergedLabels.copy || 'Copy'"
              @click.stop="handleCopyMessage(message)"
            >
              <Check v-if="copyFeedbackMap[message.messageId]" :size="14" class="chat-content__action-icon--copied" />
              <Copy v-else :size="14" />
            </button>
            <button
              v-if="message.role === 'assistant'"
              class="chat-content__action-btn"
              :title="mergedLabels.refresh || 'Regenerate'"
              @click.stop="handleRefreshMessage(message)"
            >
              <RefreshCw :size="14" />
            </button>
            <button
              class="chat-content__action-btn chat-content__action-btn--danger"
              :title="mergedLabels.delete || 'Delete'"
              @click.stop="handleDeleteMessage(message)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-content__input-area">
      <ChatInput
        :disabled="isStreaming"
        :enable-thinking="enableThinking"
        :thinking-enabled="thinkingEnabled"
        :enable-voice-input="enableVoiceInput"
        :placeholder="mergedLabels.placeholder"
        @send="handleSend"
        @stop="chatActions ? chatActions.stopGenerating() : $emit('stop-generating')"
        @file-click="$emit('file-click', $event)"
        @update:thinking-enabled="uiActions ? uiActions.setThinkingEnabled($event) : $emit('thinking-toggle', $event)"
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
import { ref, reactive, watch, nextTick, h, onMounted, onUnmounted, computed, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { Copy, Check, RefreshCw, Trash2 } from 'lucide-vue-next'
import type { Message } from '@/types'
import type { ChatbotLabels } from '@/types/config'
import { getDefaultLabels } from '@/types/config'
import { chatActionsKey, uiActionsKey } from '@/symbols'
import ChatInput from './ChatInput.vue'
import ThinkingBlock from './ThinkingBlock.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { formatMarkdownContent, copyToClipboard } from '@/utils/helpers'

// Quick action icons
const WriteIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' }),
  h('path', { d: 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' })
])

const DocIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }),
  h('path', { d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8' })
])

const GlobeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('path', { d: 'M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' })
])

const CubeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' }),
  h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  h('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })
])

interface Props {
  messages: Message[]
  welcomeVisible?: boolean
  quickActionsVisible?: boolean
  isStreaming?: boolean
  labels?: Partial<ChatbotLabels>
  enableThinking?: boolean
  thinkingEnabled?: boolean
  isThinking?: boolean
  enableVoiceInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  welcomeVisible: true,
  quickActionsVisible: true,
  isStreaming: false,
  labels: () => ({}),
})

// Merge default labels with prop labels
const mergedLabels = computed(() => ({
  ...getDefaultLabels(),
  ...props.labels,
}))

// Build quick actions from labels
const quickActions = computed(() => [
  { id: 1, title: mergedLabels.value.quickAction1Title, desc: mergedLabels.value.quickAction1Desc, text: mergedLabels.value.quickAction1Text, icon: WriteIcon },
  { id: 2, title: mergedLabels.value.quickAction2Title, desc: mergedLabels.value.quickAction2Desc, text: mergedLabels.value.quickAction2Text, icon: DocIcon },
  { id: 3, title: mergedLabels.value.quickAction3Title, desc: mergedLabels.value.quickAction3Desc, text: mergedLabels.value.quickAction3Text, icon: GlobeIcon },
  { id: 4, title: mergedLabels.value.quickAction4Title, desc: mergedLabels.value.quickAction4Desc, text: mergedLabels.value.quickAction4Text, icon: CubeIcon },
])

interface Emits {
  (e: 'send-message', data: { content: string; attachments?: import('@/types').Attachment[] }): void
  (e: 'edit', message: Message): void
  (e: 'refresh', message: Message): void
  (e: 'delete', message: Message): void
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
  (e: 'thinking-toggle', enabled: boolean): void
  (e: 'stop-generating'): void
}

const emit = defineEmits<Emits>()

// Inject action handlers from AIChatbot (fallback to emit when not provided)
const chatActions = inject(chatActionsKey)
const uiActions = inject(uiActionsKey)

// Handle quick action click (sends the action text as a message)
const handleQuickAction = (text: string) => {
  if (chatActions) { chatActions.sendMessage({ content: text }) } else { emit('send-message', { content: text }) }
}

// Handle send event from ChatInput
const handleSend = (data: { content: string; attachments?: import('@/types').Attachment[] }) => {
  if (chatActions) {
    chatActions.sendMessage(data)
  } else {
    emit('send-message', data)
  }
}

// Handle message double-click for editing (only for user messages)
const handleMessageDblClick = (message: Message) => {
  if (message.role === 'user' && message.status !== 'loading') {
    if (chatActions) {
      chatActions.editMessage(message)
    } else {
      emit('edit', message)
    }
  }
}

// Copy feedback state (track per message ID)
const copyFeedbackMap = reactive<Record<string, boolean>>({})

const handleCopyMessage = async (message: Message) => {
  if (!message.content || message.status === 'loading') return

  const success = await copyToClipboard(message.content)
  if (success) {
    copyFeedbackMap[message.messageId] = true
    ElMessage.success(mergedLabels.value.copied || 'Copied')
    setTimeout(() => {
      copyFeedbackMap[message.messageId] = false
    }, 2000)
  }
}

const handleCopyThinking = async (content: string) => {
  const success = await copyToClipboard(content)
  if (success) {
    ElMessage.success(mergedLabels.value.copied || 'Copied')
  }
}

const handleRefreshMessage = (message: Message) => {
  if (chatActions) { chatActions.refreshMessage(message) } else { emit('refresh', message) }
}

const showDeleteDialog = ref(false)
const pendingDeleteMessage = ref<Message | null>(null)

const handleDeleteMessage = (message: Message) => {
  pendingDeleteMessage.value = message
  showDeleteDialog.value = true
}

const confirmDeleteMessage = () => {
  if (pendingDeleteMessage.value) {
    if (chatActions) { chatActions.deleteMessage(pendingDeleteMessage.value) } else { emit('delete', pendingDeleteMessage.value) }
    pendingDeleteMessage.value = null
  }
  showDeleteDialog.value = false
}

// Pre-compute the set of last AI message IDs (optimized: computed once, not per-message)
const lastAiMessageIds = computed(() => {
  const ids = new Set<string>()
  let lastAssistantIdx = -1
  for (let i = props.messages.length - 1; i >= 0; i--) {
    if (props.messages[i].role === 'assistant') {
      lastAssistantIdx = i
      break
    }
  }
  if (lastAssistantIdx >= 0) {
    ids.add(props.messages[lastAssistantIdx].messageId)
  }
  return ids
})

// Auto-scroll to bottom when messages change
const messagesRef = ref<HTMLElement | null>(null)

// Handle copy button click in code blocks
const handleCodeCopy = async (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.classList.contains('code-copy-btn')) return

  const wrapper = target.closest('.code-block-wrapper')
  const pre = wrapper?.querySelector('pre')
  if (!pre) return

  const code = pre.textContent || ''
  await navigator.clipboard.writeText(code)

  target.textContent = mergedLabels.value.copied || 'Copied'
  target.classList.add('copied')
  setTimeout(() => {
    target.textContent = mergedLabels.value.copy || 'Copy'
    target.classList.remove('copied')
  }, 1000)
}

// Initialize code block copy button text with current locale
const initCodeButtonLabels = () => {
  const container = messagesRef.value
  if (!container) return
  container.querySelectorAll('.code-copy-btn').forEach(btn => {
    if (btn.getAttribute('data-i18n') === 'copy') {
      btn.textContent = mergedLabels.value.copy || 'Copy'
    }
  })
}

onMounted(() => {
  const container = messagesRef.value
  if (!container) return

  container.addEventListener('click', handleCodeCopy)
  initCodeButtonLabels()
})

onUnmounted(() => {
  const container = messagesRef.value
  if (container) {
    container.removeEventListener('click', handleCodeCopy)
  }
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(() => props.messages, () => {
  scrollToBottom()
  nextTick(initCodeButtonLabels)
}, { deep: true })
</script>

<style scoped lang="scss">
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, var(--content-bg-1, #f0f4ff) 0%, var(--content-bg-2, #e8f0ff) 50%, var(--content-bg-3, #f5f3ff) 100%);

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

  &__welcome {
    text-align: center;
    padding: 40px 20px;
  }

  &__avatar {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: var(--theme-primary-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

    svg {
      width: 42px;
      height: 42px;
      stroke: white;
    }
  }

  &__welcome-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary, #1a1a2e);
  }

  &__welcome-subtitle {
    font-size: 14px;
    color: var(--text-tertiary, #6b7280);
    font-weight: 300;
    margin-bottom: 24px;
  }

  &__quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__quick-action {
    background: var(--quick-action-bg, rgba(255, 255, 255, 0.7));
    backdrop-filter: blur(10px);
    border: 1px solid var(--quick-action-border, rgba(255, 255, 255, 0.5));
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
    }
  }

  &__quick-action-icon {
    width: 36px;
    height: 36px;
    background: var(--theme-primary-gradient);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;

    svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }
  }

  &__quick-action-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #1a1a2e);
    margin-bottom: 4px;
  }

  &__quick-action-desc {
    font-size: 12px;
    color: var(--text-tertiary, #6b7280);
  }

  &__message-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: var(--message-max-width, 800px);
    margin: 0 auto;
    width: 100%;
  }

  &__message {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &.user {
      align-items: flex-end;

      .chat-content__bubble {
        max-width: var(--user-bubble-max-width, 70%);
        align-self: flex-end;
      }
    }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--theme-primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);

    .user & {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }
  }

  &__bubble {
    min-width: 0;
    padding: 14px 16px;
    border-radius: 20px;
    font-size: 15px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .user & {
      background: var(--chat-user-bg, #409eff);
      color: var(--chat-user-text, #ffffff);
      border-bottom-right-radius: 6px;
    }

    .assistant & {
      background: var(--chat-assistant-bg, rgba(255, 255, 255, 0.9));
      backdrop-filter: blur(10px);
      color: var(--chat-assistant-text, #1a1a2e);
      border-bottom-left-radius: 6px;
    }
  }

  &__images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 12px;
    cursor: pointer;
  }

  &__text {
    white-space: pre-wrap;
    min-width: 0;

    :deep(pre) {
      max-width: 100%;
      overflow-x: auto;
    }

    :deep(code) {
      max-width: 100%;
      overflow-x: auto;
      display: inline-block;
    }

    :deep(table) {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }
  }

  &__typing {
    display: flex;
    gap: 6px;
    padding: 8px 0;

    span {
      width: 8px;
      height: 8px;
      background: var(--text-tertiary, #6b7280);
      border-radius: 50%;
      animation: typing 1.4s infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  &__error-msg {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-danger, #f56c6c);
    background: rgba(245, 108, 108, 0.08);
    border-radius: 6px;
    border: 1px solid rgba(245, 108, 108, 0.15);

    svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    span {
      flex: 1;
      line-height: 1.4;
    }
  }

  &__error-retry {
    flex-shrink: 0;
    padding: 2px 8px;
    font-size: 12px;
    color: var(--theme-primary, #409eff);
    background: transparent;
    border: 1px solid var(--theme-primary, #409eff);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--theme-primary, #409eff);
      color: white;
    }
  }

  &__message-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;

    .chat-content__message:hover & {
      opacity: 1;
    }

    .chat-content__message.user & {
      flex-direction: row-reverse;
    }

    &--visible {
      opacity: 1;
    }
  }

  &__action-feedback {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 12px;
    color: var(--color-success, #67c23a);
    background-color: rgba(103, 194, 58, 0.1);
    border-radius: 4px;
    white-space: nowrap;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-tertiary, #909399);
    transition: all 0.2s ease;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: var(--border-light, rgba(0, 0, 0, 0.08));
      color: var(--text-primary, #303133);
    }

    &--danger:hover {
      background-color: rgba(245, 108, 108, 0.1);
      color: var(--color-danger, #f56c6c);
    }

    &--copied {
      color: var(--color-success, #67c23a);
    }
  }

  &__action-icon--copied {
    color: inherit;
  }

  &__input-area {
    flex-shrink: 0;
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

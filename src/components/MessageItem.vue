<template>
  <div :class="classes">
    <!-- Avatar -->
    <div v-if="showAvatar" class="chatbot-message__avatar">
      <slot name="avatar">
        <svg v-if="isUser" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          />
        </svg>
      </slot>
    </div>

    <!-- Content -->
    <div class="chatbot-message__content-wrapper">
      <!-- Username/Label -->
      <div v-if="showLabel" class="chatbot-message__label">
        <slot name="label">{{ label }}</slot>
      </div>

      <!-- Bubble -->
      <div :class="bubbleClasses" @dblclick="handleDoubleClick">
        <!-- Thinking block -->
        <ThinkingBlock
          v-if="message.thinkingContent"
          :content="message.thinkingContent"
          :thinking-time="message.thinkingTime"
          :is-thinking="isStreaming && isThinkingActive"
          :auto-collapse="autoCollapse"
          :labels="labels?.thinking"
          @toggle="thinkingCollapsed = !thinkingCollapsed"
        />

        <!-- Text content -->
        <!-- eslint-disable-next-line vue/no-v-html -- Content is sanitized via DOMPurify in formatMarkdownContent -->
        <div
          v-if="hasText"
          class="chatbot-message__text"
          @click="handleTextClick"
          v-html="formattedContent"
        />

        <!-- Attachments (images / videos / audios / documents) -->
        <MessageAttachments
          :attachments="message.attachments ?? []"
          @file-click="$emit('file-click', $event)"
        />

        <!-- Streaming indicator -->
        <span v-if="isStreaming" class="chatbot-message__cursor" />

        <!-- Error indicator -->
        <div v-if="isError" class="chatbot-message__error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          <span>
            {{
              message.errorMessage ||
              (isUser
                ? labels?.sendFailed || 'Send failed'
                : labels?.responseFailed || 'Response failed')
            }}
          </span>
        </div>

        <!-- Stopped indicator -->
        <div v-if="isStopped" class="chatbot-message__stopped">
          <span>
            {{ message.errorMessage || labels?.generationStopped || 'Generation stopped' }}
          </span>
        </div>
      </div>

      <!-- Timestamp -->
      <div v-if="showTimestamp" class="chatbot-message__timestamp">
        {{ formattedTime }}
      </div>

      <!-- Actions -->
      <div v-if="showActions" :class="actionsClasses">
        <!-- Feedback buttons (assistant messages only) -->
        <template v-if="showFeedback">
          <button
            class="chatbot-message__action-btn chatbot-message__action-btn--feedback-up"
            :class="{ 'chatbot-message__action-btn--active': message.feedback === 'up' }"
            :title="labels?.feedbackUp || 'Helpful'"
            :aria-label="labels?.feedbackUp || 'Helpful'"
            :aria-pressed="message.feedback === 'up'"
            @click="handleFeedback('up')"
          >
            <ThumbsUp :size="14" />
          </button>
          <button
            class="chatbot-message__action-btn chatbot-message__action-btn--feedback-down"
            :class="{ 'chatbot-message__action-btn--active': message.feedback === 'down' }"
            :title="labels?.feedbackDown || 'Not helpful'"
            :aria-label="labels?.feedbackDown || 'Not helpful'"
            :aria-pressed="message.feedback === 'down'"
            @click="handleFeedback('down')"
          >
            <ThumbsDown :size="14" />
          </button>
        </template>

        <!-- Copy button -->
        <button
          v-if="enableCopy && canCopy"
          :class="[
            'chatbot-message__action-btn',
            { 'chatbot-message__action-btn--copied': isCopied },
          ]"
          :title="labels?.copy || 'Copy'"
          @click="handleCopy"
        >
          <Check v-if="isCopied" :size="14" />
          <Copy v-else :size="14" />
        </button>

        <!-- Resend button (for error messages) -->
        <button
          v-if="isError && enableResend"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          :title="labels?.resend || 'Resend'"
          @click="handleResend"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
        </button>

        <!-- Delete button -->
        <button
          v-if="enableDelete"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          :title="labels?.delete || 'Delete'"
          @click="handleDelete"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Copy, Check, Trash2, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import type { Message } from '@/types'
import type { ChatbotLabels } from '@/types/config'
import { chatActionsKey } from '@/symbols'
import { formatTime, copyToClipboard } from '@/utils/helpers'
import { formatMarkdownContent } from '@/utils/markdown'
import { getAttachmentsByType } from '@/utils/message'
import ThinkingBlock from './ThinkingBlock.vue'
import MessageAttachments from './MessageAttachments.vue'

interface Props {
  message: Message
  theme?: 'light' | 'dark'
  showAvatar?: boolean
  showLabel?: boolean
  showTimestamp?: boolean
  showActions?: boolean
  enableCopy?: boolean
  enableDelete?: boolean
  enableResend?: boolean
  /** Show 👍/👎 feedback buttons (assistant messages only) */
  enableFeedback?: boolean
  isStreaming?: boolean
  autoCollapse?: boolean
  copyTimeout?: number
  isLastMessage?: boolean
  labels?: ChatbotLabels
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  showAvatar: true,
  showLabel: false,
  showTimestamp: false,
  showActions: true,
  enableCopy: true,
  enableDelete: true,
  enableResend: true,
  enableFeedback: false,
  isStreaming: false,
  autoCollapse: true,
  copyTimeout: 2000,
  isLastMessage: false,
})

interface Emits {
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
}

defineEmits<Emits>()

// Inject chat actions
const chatActions = inject(chatActionsKey, null)

// Thinking state
const thinkingCollapsed = ref(true)

// Computed
const isUser = computed(() => props.message.role === 'user')
const isError = computed(() => props.message.status === 'error')
const isStopped = computed(() => props.message.status === 'stopped')
const hasText = computed(() => Boolean(props.message.content))
// Rendering moved to MessageAttachments; these flags drive bubbleClasses
const hasImages = computed(() => getAttachmentsByType(props.message, 'image').length > 0)
const hasVideos = computed(() => getAttachmentsByType(props.message, 'video').length > 0)
const hasAudios = computed(() => getAttachmentsByType(props.message, 'audio').length > 0)
const hasDocuments = computed(() => getAttachmentsByType(props.message, 'document').length > 0)
const canCopy = computed(() => hasText.value && !props.isStreaming)
// Feedback is rateable only for complete-enough assistant answers
const showFeedback = computed(
  () =>
    props.enableFeedback &&
    isUser.value === false &&
    (props.message.status === 'sent' || props.message.status === 'stopped')
)
const isThinkingActive = computed(() => chatActions?.isThinkingActive?.value ?? false)

const label = computed(() =>
  isUser.value ? props.labels?.userLabel || 'You' : props.labels?.assistantLabel || 'AI Assistant'
)
const formattedTime = computed(() => formatTime(props.message.timestamp))
const formattedContent = computed(() => formatMarkdownContent(props.message.content))

// Classes
const classes = computed(() => [
  'chatbot-message',
  `chatbot-message--${props.message.role}`,
  `chatbot-message--${props.message.status}`,
  `chatbot-message--${props.theme}`,
  {
    'chatbot-message--streaming': props.isStreaming,
    'chatbot-message--last': props.isLastMessage,
  },
])

const actionsClasses = computed(() => [
  'chatbot-message__actions',
  {
    'chatbot-message__actions--visible': props.isLastMessage && !isUser.value,
  },
])

const bubbleClasses = computed(() => [
  'chatbot-message__bubble',
  `chatbot-message__bubble--${props.message.role}`,
  {
    'chatbot-message__bubble--image': !hasText.value && hasImages.value,
    'chatbot-message__bubble--mixed': hasText.value && hasImages.value,
    'chatbot-message__bubble--video': hasVideos.value,
    'chatbot-message__bubble--audio': hasAudios.value,
    'chatbot-message__bubble--document': hasDocuments.value,
  },
])

// Copy state
const isCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})

const handleCopy = async () => {
  if (!props.message.content || props.isStreaming) {
    ElMessage({
      message: props.labels?.noContentToCopy || 'No content to copy',
      type: 'error',
      duration: 3000,
    })
    return
  }

  try {
    await copyToClipboard(props.message.content)
    ElMessage({
      message: props.labels?.copiedToClipboard || 'Copied to clipboard',
      type: 'success',
      duration: 3000,
    })
    isCopied.value = true

    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
      copyTimer = null
    }, props.copyTimeout)
  } catch {
    ElMessage({ message: props.labels?.copyFailed || 'Copy failed', type: 'error', duration: 3000 })
  }
}

/** Mutually exclusive 👍/👎; clicking the active one deselects ('none') */
const handleFeedback = (feedback: 'up' | 'down') => {
  const next = props.message.feedback === feedback ? 'none' : feedback
  chatActions?.submitMessageFeedback(props.message, next)
}

const handleDelete = () => {
  ElMessageBox.confirm(
    props.labels?.deleteConfirm || 'Are you sure you want to delete this message?',
    props.labels?.deleteMessageTitle || 'Delete Message',
    {
      confirmButtonText: props.labels?.delete || 'Delete',
      cancelButtonText: props.labels?.cancel || 'Cancel',
      type: 'warning',
    }
  )
    .then(() => {
      chatActions?.deleteMessage(props.message)
      ElMessage({
        message: props.labels?.messageDeleted || 'Message deleted',
        type: 'success',
        duration: 3000,
      })
    })
    .catch(() => {
      // User cancelled
    })
}

const handleResend = () => {
  if (isUser.value) {
    chatActions?.sendMessage({
      content: props.message.content,
      attachments: props.message.attachments,
    })
  } else {
    chatActions?.refreshMessage(props.message)
  }
}

const handleDoubleClick = () => {
  if (props.message.role === 'user' && !props.isStreaming) {
    chatActions?.editMessage(props.message)
  }
}

/** Handle clicks on code blocks within rendered markdown */
const handleTextClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // Copy button inside a code block wrapper: copy the wrapped pre's code
  const copyBtnHit = target.closest('.markdown-copy-btn') as HTMLElement | null
  if (copyBtnHit) {
    const codeEl = copyBtnHit.closest('.code-block-wrapper')?.querySelector('pre code')
    const text = codeEl?.textContent
    if (text) {
      copyToClipboard(text).then(() => {
        ElMessage({
          message: props.labels?.copiedToClipboard || 'Copied to clipboard',
          type: 'success',
          duration: 3000,
        })
      })
    }
    return
  }

  const codeBlock = target.closest('pre')
  if (!codeBlock) return

  const codeEl = codeBlock.querySelector('code')
  const text = codeEl?.textContent ?? codeBlock.textContent
  if (text) {
    copyToClipboard(text).then(() => {
      ElMessage({
        message: props.labels?.copiedToClipboard || 'Copied to clipboard',
        type: 'success',
        duration: 3000,
      })
    })
  }
}
</script>

<style scoped lang="scss">
.chatbot-message {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  &--user {
    flex-direction: row-reverse;

    .chatbot-message__content-wrapper {
      align-items: flex-end;
    }
  }

  &--assistant {
    flex-direction: row;

    .chatbot-message__content-wrapper {
      align-items: flex-start;
    }
  }

  &--error {
    .chatbot-message__bubble {
      border: 1px solid var(--color-danger, #f56c6c);
    }
  }

  &--streaming {
    .chatbot-message__bubble {
      position: relative;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 20px;
      height: 20px;
    }

    .chatbot-message--user & {
      background-color: var(--chat-user-bg, #409eff);
      color: var(--chat-user-text, #ffffff);
    }

    .chatbot-message--assistant & {
      background-color: var(--chat-assistant-bg, #f5f7fa);
      color: var(--chat-assistant-text, #303133);
    }
  }

  &__content-wrapper {
    max-width: 70%;
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 12px;
    color: var(--text-tertiary, #909399);
    margin-bottom: 4px;
    padding: 0 4px;
  }

  &__bubble {
    padding: 10px 14px;
    border-radius: 12px;
    position: relative;
    word-wrap: break-word;
    overflow-wrap: break-word;

    &--user {
      background-color: var(--chat-user-bg, #409eff);
      color: var(--chat-user-text, #ffffff);
      border-bottom-right-radius: 4px;
    }

    &--assistant {
      background-color: var(--chat-assistant-bg, #f5f7fa);
      color: var(--chat-assistant-text, #303133);
      border-bottom-left-radius: 4px;
    }

    &--image,
    &--mixed {
      padding: 8px;
    }
  }

  &__text {
    line-height: 1.5;
    white-space: pre-wrap;

    :deep(code) {
      background-color: var(--bg-tertiary, rgba(0, 0, 0, 0.1));
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
    }

    :deep(strong) {
      font-weight: 600;
    }

    :deep(br) {
      line-height: 1.8;
    }

    :deep(pre) {
      background-color: var(--bg-code-block, #1e1e1e);
      color: var(--text-code-block, #d4d4d4);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
      cursor: pointer;

      code {
        background: none;
        padding: 0;
        font-size: 0.85em;
      }
    }
  }

  &__cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background-color: currentColor;
    margin-left: 2px;
    animation: blink 1s infinite;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-danger, #f56c6c);
    font-size: 12px;
    margin-top: 4px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  &__stopped {
    font-size: 12px;
    color: var(--text-tertiary, #909399);
    margin-top: 4px;
    font-style: italic;
  }

  &__timestamp {
    font-size: 11px;
    color: var(--text-tertiary, #909399);
    margin-top: 4px;
    padding: 0 4px;
  }

  &__actions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    opacity: 0;
    transition: opacity 0.2s;

    .chatbot-message:hover & {
      opacity: 1;
    }

    &--visible {
      opacity: 1;
    }
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--action-icon-color, #8c8c8c);
    transition: all 0.2s;

    svg,
    :deep(svg) {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: var(--action-hover-bg, rgba(0, 0, 0, 0.1));
      color: var(--action-icon-hover-color, #4a4a4a);
    }

    &--copied {
      color: var(--color-success, #67c23a);
    }

    &--active {
      color: var(--color-primary, #409eff);
    }

    &--danger:hover {
      background-color: var(--color-danger, #f56c6c);
      color: var(--text-on-primary, #fff);
    }
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>

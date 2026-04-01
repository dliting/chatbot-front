<template>
  <div :class="classes">
    <!-- Avatar -->
    <div v-if="showAvatar" class="chatbot-message__avatar">
      <slot name="avatar">
        <svg v-if="isUser" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
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
        <!-- Text content -->
        <!-- eslint-disable-next-line vue/no-v-html -- Content is sanitized via DOMPurify in formatMessageContent -->
        <div v-if="hasText" class="chatbot-message__text" v-html="formattedContent"/>

        <!-- Image content -->
        <div v-if="hasImages" class="chatbot-message__images">
          <img
            v-for="(image, index) in message.images"
            :key="index"
            :src="image"
            :alt="`Image ${index + 1}`"
            class="chatbot-message__image"
            @click="$emit('file-click', { type: 'image', url: image })"
          />
        </div>

        <!-- Video content -->
        <div v-if="hasVideos" class="chatbot-message__videos">
          <div
            v-for="(video, index) in message.videos"
            :key="`video-${index}`"
            class="chatbot-message__video"
            @click="$emit('file-click', { type: 'video', url: `data:video/mp4;base64,${video}` })"
          >
            <video :src="`data:video/mp4;base64,${video}`" class="chatbot-message__video-player" preload="metadata" />
            <div class="chatbot-message__video-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Audio content -->
        <div v-if="hasAudios" class="chatbot-message__audios">
          <div
            v-for="(audio, index) in message.audios"
            :key="`audio-${index}`"
            class="chatbot-message__audio"
            @click="$emit('file-click', { type: 'audio', url: `data:audio/mp3;base64,${audio}` })"
          >
            <audio :src="`data:audio/mp3;base64,${audio}`" controls class="chatbot-message__audio-player" />
          </div>
        </div>

        <!-- Document content -->
        <div v-if="hasDocuments" class="chatbot-message__documents">
          <div
            v-for="(doc, index) in message.documents"
            :key="`doc-${index}`"
            class="chatbot-message__document"
            @click="$emit('file-click', { type: doc.type, url: doc.url, name: doc.name })"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="chatbot-message__document-name">{{ doc.name }}</span>
          </div>
        </div>

        <!-- Streaming indicator -->
        <span v-if="isStreaming" class="chatbot-message__cursor"/>

        <!-- Error indicator -->
        <div v-if="isError" class="chatbot-message__error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{{ message.errorMessage || (isUser ? '发送失败' : '响应失败') }}</span>
        </div>

        <!-- Stopped indicator -->
        <div v-if="isStopped" class="chatbot-message__stopped">
          <span>{{ message.errorMessage || '已停止生成' }}</span>
        </div>
      </div>

      <!-- Timestamp -->
      <div v-if="showTimestamp" class="chatbot-message__timestamp">
        {{ formattedTime }}
      </div>

      <!-- Actions -->
      <div v-if="showActions" :class="actionsClasses">
        <!-- Copy button -->
        <button
          v-if="enableCopy && canCopy"
          :class="['chatbot-message__action-btn', { 'chatbot-message__action-btn--copied': isCopied }]"
          title="复制"
          @click="handleCopy"
        >
          <Check v-if="isCopied" :size="14" />
          <Copy v-else :size="14" />
        </button>

        <!-- Resend button (for error messages) -->
        <button
          v-if="isError && enableResend"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          title="重新发送"
          @click="$emit('resend')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>

        <!-- Delete button -->
        <button
          v-if="enableDelete"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          title="删除"
          @click="handleDelete"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Copy, Check, Trash2 } from 'lucide-vue-next'
import type { Message } from '@/types'
import { formatTime, copyToClipboard } from '@/utils/helpers'
import { formatMessageContent } from '@/utils/message'

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
  isStreaming?: boolean
  copyTimeout?: number
  isLastMessage?: boolean  // AI 最后一条消息时，默认显示操作按钮
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
  isStreaming: false,
  copyTimeout: 2000,
  isLastMessage: false,
})

interface Emits {
  (e: 'copy'): void
  (e: 'delete'): void
  (e: 'resend'): void
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
  (e: 'edit', message: Message): void
}

const emit = defineEmits<Emits>()

// Computed
const isUser = computed(() => props.message.role === 'user')
const isError = computed(() => props.message.status === 'error')
const isStopped = computed(() => props.message.status === 'stopped')
const hasText = computed(() => Boolean(props.message.content))
const hasImages = computed(() => Boolean(props.message.images?.length))
const hasVideos = computed(() => Boolean(props.message.videos?.length))
const hasAudios = computed(() => Boolean(props.message.audios?.length))
const hasDocuments = computed(() => Boolean(props.message.documents?.length))
const canCopy = computed(() => hasText.value && !props.isStreaming)

const label = computed(() => isUser.value ? 'You' : 'AI Assistant')
const formattedTime = computed(() => formatTime(props.message.timestamp))
const formattedContent = computed(() => formatMessageContent(props.message.content))

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

// Actions visibility: AI last message shows by default, others require hover
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

// Copy state - icon switching
const isCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// Cleanup timer on component unmount
onUnmounted(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})

const handleCopy = async () => {
  if (!props.message.content || props.isStreaming) {
    ElMessage({ message: '无内容可复制', type: 'error', duration: 3000 })
    return
  }

  try {
    await copyToClipboard(props.message.content)
    ElMessage({ message: '已复制到剪贴板', type: 'success', duration: 3000 })
    isCopied.value = true

    // Reset icon after timeout
    if (copyTimer) {
      clearTimeout(copyTimer)
    }
    copyTimer = setTimeout(() => {
      isCopied.value = false
      copyTimer = null
    }, props.copyTimeout)

    emit('copy')
  } catch {
    ElMessage({ message: '复制失败', type: 'error', duration: 3000 })
  }
}

const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这条消息吗？', '删除消息', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete')
    ElMessage({ message: '消息已删除', type: 'success', duration: 3000 })
  }).catch(() => {
    // User cancelled, do nothing
  })
}

const handleDoubleClick = () => {
  // Only emit edit for user messages that are not streaming
  if (props.message.role === 'user' && !props.isStreaming) {
    emit('edit', props.message)
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
      border: 1px solid var(--chatbot-danger-color, #f56c6c);
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
      background-color: var(--chatbot-user-bubble-bg, #409eff);
      color: var(--chatbot-user-bubble-text, #ffffff);
    }

    .chatbot-message--assistant & {
      background-color: var(--chatbot-assistant-bubble-bg, #f5f7fa);
      color: var(--chatbot-assistant-bubble-text, #303133);
    }
  }

  &__content-wrapper {
    max-width: 70%;
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 12px;
    color: var(--chatbot-panel-subtext, #909399);
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
      background-color: var(--chatbot-user-bubble-bg, #409eff);
      color: var(--chatbot-user-bubble-text, #ffffff);
      border-bottom-right-radius: 4px;
    }

    &--assistant {
      background-color: var(--chatbot-assistant-bubble-bg, #f5f7fa);
      color: var(--chatbot-assistant-bubble-text, #303133);
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
  }

  &__images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;

    .chatbot-message__bubble--image & {
      margin-top: 0;
    }
  }

  &__image {
    max-width: 150px;
    max-height: 150px;
    border-radius: 8px;
    cursor: pointer;
    object-fit: cover;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__videos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  &__video {
    position: relative;
    width: 200px;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: var(--bg-video-overlay, #000);

    &-player {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-overlay, rgba(0, 0, 0, 0.3));

      svg {
        width: 48px;
        height: 48px;
        fill: var(--text-on-primary, #fff);
      }
    }
  }

  &__audios {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    width: 250px;
  }

  &__audio-player {
    width: 100%;
    height: 40px;
  }

  &__documents {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  &__document {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      stroke: var(--chatbot-text-color, #606266);
    }

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    &-name {
      font-size: 13px;
      color: var(--chatbot-text-color, #303133);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    color: var(--chatbot-danger-color, #f56c6c);
    font-size: 12px;
    margin-top: 4px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  &__stopped {
    font-size: 12px;
    color: var(--chatbot-subtext-color, #909399);
    margin-top: 4px;
    font-style: italic;
  }

  &__timestamp {
    font-size: 11px;
    color: var(--chatbot-panel-subtext, #909399);
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
    color: var(--chatbot-action-icon-color, #8c8c8c);
    transition: all 0.2s;

    svg, :deep(svg) {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: var(--chatbot-action-hover-bg, rgba(0, 0, 0, 0.1));
      color: var(--chatbot-action-icon-hover-color, #4a4a4a);
    }

    &--copied {
      color: var(--chatbot-color-success, #67c23a);
    }

    &--danger:hover {
      background-color: var(--chatbot-danger-color, #f56c6c);
      color: var(--text-on-primary, #fff);
    }
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>

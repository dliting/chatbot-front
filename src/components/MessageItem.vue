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
      <div :class="bubbleClasses">
        <!-- Text content -->
        <div v-if="hasText" class="chatbot-message__text" v-html="formattedContent"></div>

        <!-- Image content -->
        <div v-if="hasImages" class="chatbot-message__images">
          <img
            v-for="(image, index) in message.images"
            :key="index"
            :src="image"
            :alt="`Image ${index + 1}`"
            class="chatbot-message__image"
            @click="$emit('image-click', image)"
          />
        </div>

        <!-- Streaming indicator -->
        <span v-if="isStreaming" class="chatbot-message__cursor"></span>

        <!-- Error indicator -->
        <div v-if="isError" class="chatbot-message__error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>Failed to send</span>
        </div>
      </div>

      <!-- Timestamp -->
      <div v-if="showTimestamp" class="chatbot-message__timestamp">
        {{ formattedTime }}
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="chatbot-message__actions">
        <!-- Copy button -->
        <button
          v-if="enableCopy && canCopy"
          class="chatbot-message__action-btn"
          @click="$emit('copy')"
          title="Copy"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>

        <!-- Resend button (for error messages) -->
        <button
          v-if="isError && enableResend"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          @click="$emit('resend')"
          title="Resend"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>

        <!-- Delete button -->
        <button
          v-if="enableDelete"
          class="chatbot-message__action-btn chatbot-message__action-btn--danger"
          @click="$emit('delete')"
          title="Delete"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@/types'
import { formatTime } from '@/utils/helpers'
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
})

interface Emits {
  (e: 'copy'): void
  (e: 'delete'): void
  (e: 'resend'): void
  (e: 'image-click', url: string): void
}

defineEmits<Emits>()

// Computed
const isUser = computed(() => props.message.role === 'user')
const isError = computed(() => props.message.status === 'error')
const hasText = computed(() => Boolean(props.message.content))
const hasImages = computed(() => Boolean(props.message.images?.length))
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
  },
])

const bubbleClasses = computed(() => [
  'chatbot-message__bubble',
  `chatbot-message__bubble--${props.message.role}`,
  {
    'chatbot-message__bubble--image': !hasText.value && hasImages.value,
    'chatbot-message__bubble--mixed': hasText.value && hasImages.value,
  },
])
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
      background-color: rgba(0, 0, 0, 0.1);
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
    color: var(--chatbot-panel-subtext, #909399);
    transition: all 0.2s;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: var(--chatbot-panel-text, #303133);
    }

    &--danger:hover {
      background-color: var(--chatbot-danger-color, #f56c6c);
      color: #fff;
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

<template>
  <div ref="containerRef" class="chatbot-messages" @scroll="handleScroll">
    <!-- Messages -->
    <div class="chatbot-messages__list">
      <div
        v-for="message in messages"
        :key="message.id"
        class="chatbot-messages__item"
      >
        <MessageItem
          :message="message"
          :theme="theme"
          :show-avatar="showAvatar"
          :show-timestamp="showTimestamp"
          :show-actions="showActions"
          :enable-copy="enableCopy"
          :enable-delete="enableDelete"
          :enable-resend="enableResend"
          :is-streaming="isStreaming && message.id === streamingMessageId"
          @copy="$emit('copy', message)"
          @delete="$emit('delete', message)"
          @resend="$emit('resend', message)"
          @image-click="$emit('image-click', $event)"
          @document-click="$emit('document-click', $event)"
        />
      </div>

      <!-- Empty state -->
      <div v-if="messages.length === 0" class="chatbot-messages__empty">
        <slot name="empty">
          <div class="chatbot-messages__empty-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p>{{ emptyMessage }}</p>
          </div>
        </slot>
      </div>
    </div>

    <!-- Scroll to bottom button -->
    <Transition name="chatbot-scroll-btn">
      <button
        v-if="showScrollButton"
        class="chatbot-messages__scroll-btn"
        @click="scrollToBottom"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import type { Message } from '@/types'
import MessageItem from './MessageItem.vue'

interface Props {
  messages: Message[]
  theme?: 'light' | 'dark'
  showAvatar?: boolean
  showTimestamp?: boolean
  showActions?: boolean
  enableCopy?: boolean
  enableDelete?: boolean
  enableResend?: boolean
  isStreaming?: boolean
  streamingMessageId?: string | null
  autoScroll?: boolean
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  showAvatar: true,
  showTimestamp: false,
  showActions: true,
  enableCopy: true,
  enableDelete: true,
  enableResend: true,
  isStreaming: false,
  streamingMessageId: null,
  autoScroll: true,
  emptyMessage: 'Start a conversation...',
})

interface Emits {
  (e: 'copy', message: Message): void
  (e: 'delete', message: Message): void
  (e: 'resend', message: Message): void
  (e: 'image-click', url: string): void
  (e: 'document-click', doc: { name: string; url: string; type: string }): void
  (e: 'scroll-to-top'): void
  (e: 'scroll-to-bottom'): void
}

defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLElement>()
const showScrollButton = ref(false)
const isNearBottom = ref(true)

// Scroll to bottom
const scrollToBottom = (smooth = true) => {
  if (!containerRef.value) return

  const behavior = smooth ? 'smooth' : 'instant'
  containerRef.value.scrollTo({
    top: containerRef.value.scrollHeight,
    behavior,
  })
}

// Handle scroll
const handleScroll = () => {
  if (!containerRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  isNearBottom.value = distanceFromBottom < 100
  showScrollButton.value = !isNearBottom.value
}

// Watch for new messages
watch(
  () => props.messages.length,
  () => {
    if (props.autoScroll && isNearBottom.value) {
      nextTick(() => scrollToBottom())
    }
  }
)

// Watch for streaming
watch(
  () => props.streamingMessageId,
  () => {
    if (props.autoScroll && props.isStreaming) {
      nextTick(() => scrollToBottom())
    }
  }
)

// Initial scroll
onMounted(() => {
  scrollToBottom(false)
})

// Expose methods
defineExpose({
  scrollToBottom,
})
</script>

<style scoped lang="scss">
.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  &__list {
    padding: 16px;
  }

  &__item {
    margin-bottom: 0;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }

  &__empty-content {
    text-align: center;
    color: var(--chatbot-panel-subtext, #909399);

    svg {
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      margin: 0;
    }
  }

  &__scroll-btn {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border: none;
    background-color: var(--chatbot-bg-color, #ffffff);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chatbot-panel-subtext, #909399);
    transition: all 0.2s;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background-color: var(--chatbot-primary-color, #409eff);
      color: #fff;
      transform: scale(1.1);
    }
  }
}

.chatbot-scroll-btn-enter-active,
.chatbot-scroll-btn-leave-active {
  transition: all 0.3s ease;
}

.chatbot-scroll-btn-enter-from,
.chatbot-scroll-btn-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(10px);
}
</style>

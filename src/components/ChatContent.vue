<template>
  <div class="chat-content">
    <!-- Chat Container -->
    <div ref="messagesRef" class="chat-content__messages">
      <!-- Welcome Section -->
      <div v-if="welcomeVisible" class="chat-content__welcome">
        <div class="chat-content__avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="chat-content__welcome-title">智能助手</h2>
        <p class="chat-content__welcome-subtitle">有什么可以帮助您的吗？</p>

        <!-- Quick Actions -->
        <div v-if="quickActionsVisible" class="chat-content__quick-actions">
          <div
            v-for="action in quickActions"
            :key="action.id"
            class="chat-content__quick-action"
            @click="$emit('quick-action', action.text)"
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
          :key="message.id"
          :class="['chat-content__message', message.role]"
          @dblclick="handleMessageDblClick(message)"
        >
          <div class="chat-content__avatar">
            <svg v-if="message.role === 'assistant'" viewBox="0 0 24 24" fill="none" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="chat-content__bubble">
            <!-- Images -->
            <div v-if="message.images && message.images.length > 0" class="chat-content__images">
              <img
                v-for="(img, idx) in message.images"
                :key="idx"
                :src="img"
                class="chat-content__image"
              />
            </div>
            <!-- Text -->
            <div v-if="message.content" class="chat-content__text">
              {{ message.content }}
            </div>
            <!-- Typing indicator -->
            <div v-if="message.status === 'loading' && !message.content" class="chat-content__typing">
              <span/><span/><span/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-content__input-area">
      <ChatInput :disabled="isStreaming" @send="$emit('send-message', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, h } from 'vue'
import type { Message } from '@/types'
import ChatInput from './ChatInput.vue'

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

const quickActions = [
  { id: 1, title: '写邮件', desc: '帮我撰写邮件', text: '帮我写一封邮件', icon: WriteIcon },
  { id: 2, title: '总结文章', desc: '提取关键信息', text: '帮我总结这篇文章', icon: DocIcon },
  { id: 3, title: '翻译', desc: '多语言翻译', text: '帮我翻译这段文字', icon: GlobeIcon },
  { id: 4, title: '数据分析', desc: '智能分析数据', text: '帮我分析数据', icon: CubeIcon },
]

interface Props {
  messages: Message[]
  welcomeVisible?: boolean
  quickActionsVisible?: boolean
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  welcomeVisible: true,
  quickActionsVisible: true,
  isStreaming: false,
})

interface Emits {
  (e: 'send-message', data: { content: string; images?: string[] }): void
  (e: 'quick-action', text: string): void
  (e: 'edit', message: Message): void
  (e: 'copy', message: Message): void
}

const emit = defineEmits<Emits>()

// Handle message double-click for editing (only for user messages)
const handleMessageDblClick = (message: Message) => {
  // Only allow editing user messages that are not streaming
  if (message.role === 'user' && message.status !== 'loading') {
    emit('edit', message)
  }
}

// Auto-scroll to bottom when messages change
const messagesRef = ref<HTMLElement>()

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped lang="scss">
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #f0f4ff 0%, #e8f0ff 50%, #f5f3ff 100%);

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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    color: #1a1a2e;
  }

  &__welcome-subtitle {
    font-size: 14px;
    color: #6b7280;
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
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  &__quick-action-desc {
    font-size: 12px;
    color: #6b7280;
  }

  &__message-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__message {
    display: flex;
    gap: 10px;

    &.user {
      flex-direction: row-reverse;
    }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    max-width: 70%;
    padding: 14px 16px;
    border-radius: 20px;
    font-size: 15px;
    line-height: 1.5;
    word-wrap: break-word;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .user & {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 6px;
    }

    .assistant & {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      color: #1a1a2e;
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
  }

  &__typing {
    display: flex;
    gap: 6px;
    padding: 8px 0;

    span {
      width: 8px;
      height: 8px;
      background: #6b7280;
      border-radius: 50%;
      animation: typing 1.4s infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  &__input-area {
    flex-shrink: 0;
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}
</style>

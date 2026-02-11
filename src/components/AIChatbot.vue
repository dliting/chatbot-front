<template>
  <div class="ai-chatbot" :data-theme="config.theme">
    <!-- Suspended Ball -->
    <SuspendedBall
      v-if="!state.ui.isPanelOpen"
      :position="config.position"
      :size="ballSize"
      :icon-color="config.theme === 'dark' ? '#ffffff' : '#ffffff'"
      :background-color="config.primaryColor"
      :badge="unreadCount"
      @click="togglePanel"
    />

    <!-- Chat Panel -->
    <ChatPanel
      :is-open="state.ui.isPanelOpen"
      :mode="state.ui.panelMode"
      :position="config.position"
      :theme="state.ui.theme"
      :title="config.labels?.title"
      :width="config.panelWidth"
      :show-theme-toggle="true"
      @close="togglePanel"
      @toggle-theme="toggleTheme"
    >
      <template v-if="config.enableSessionManager && state.ui.panelMode === 'sidebar'">
        <!-- Session Sidebar -->
        <SessionManager
          :sessions="state.sessions.list"
          :current-session-id="state.sessions.currentId"
          :new-chat-label="config.labels?.newChat"
          @create-session="handleCreateSession"
          @switch-session="handleSwitchSession"
          @delete-session="handleDeleteSession"
        />

        <!-- Messages Area -->
        <div class="ai-chatbot__main">
          <MessageList
            ref="messageListRef"
            :messages="currentMessages"
            :theme="state.ui.theme"
            :is-streaming="isStreaming"
            :streaming-message-id="state.messages.streamingMessageId"
            :empty-message="config.labels?.placeholder"
            @copy="handleCopyMessage"
            @delete="handleDeleteMessage"
            @resend="handleResendMessage"
            @image-click="handleImageClick"
          />

          <InputArea
            ref="inputAreaRef"
            :placeholder="config.labels?.placeholder"
            :max-image-count="config.maxImageCount"
            :max-image-size="config.maxImageSize"
            :enable-image-upload="config.enableImageUpload"
            :is-uploading="isUploading"
            :upload-progress="uploadProgress"
            v-model="inputText"
            @send="handleSend"
            @upload="handleUpload"
          />
        </div>
      </template>

      <template v-else>
        <!-- Messages Only (no sidebar) -->
        <MessageList
          ref="messageListRef"
          :messages="currentMessages"
          :theme="state.ui.theme"
          :is-streaming="isStreaming"
          :streaming-message-id="state.messages.streamingMessageId"
          :empty-message="config.labels?.placeholder"
          @copy="handleCopyMessage"
          @delete="handleDeleteMessage"
          @resend="handleResendMessage"
          @image-click="handleImageClick"
        />

        <InputArea
          ref="inputAreaRef"
          :placeholder="config.labels?.placeholder"
          :max-image-count="config.maxImageCount"
          :max-image-size="config.maxImageSize"
          :enable-image-upload="config.enableImageUpload"
          :is-uploading="isUploading"
          :upload-progress="uploadProgress"
          v-model="inputText"
          @send="handleSend"
          @upload="handleUpload"
        />
      </template>
    </ChatPanel>

    <!-- Image Preview Modal -->
    <Transition name="chatbot-preview">
      <div
        v-if="imagePreviewVisible"
        class="ai-chatbot__preview-overlay"
        @click="imagePreviewVisible = false"
      >
        <button class="ai-chatbot__preview-close" @click="imagePreviewVisible = false">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <img :src="previewImageUrl" alt="Preview" class="ai-chatbot__preview-image" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import type { Message, SendMessageData, MessageSuccessData } from '@/types'
import { useChatbotState } from '@/composables/useChatbotState'
import { createMockStream } from '@/utils/stream'
import { createMockUploadEndpoint } from '@/utils/upload'
import { copyToClipboard } from '@/utils/helpers'

// Components
import SuspendedBall from './SuspendedBall.vue'
import ChatPanel from './ChatPanel.vue'
import MessageList from './MessageList.vue'
import InputArea from './InputArea.vue'
import SessionManager from './SessionManager.vue'

// Props
interface Props {
  config?: ChatbotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
})

// Merge config with defaults
const config = computed(() => {
  return { ...defaultChatbotConfig, ...props.config }
})

// State
const {
  state,
  currentMessages,
  isStreaming,
  togglePanel,
  setTheme,
  addMessage,
  updateMessage,
  clearCurrentMessages,
  setStreamingMessage,
  switchSession,
  createSession,
  deleteSession,
} = useChatbotState(config.value)

// Refs
const messageListRef = ref<InstanceType<typeof MessageList>>()
const inputAreaRef = ref<InstanceType<typeof InputArea>>()

// Local state
const inputText = ref('')
const isUploading = ref(false)
const uploadProgress = ref(0)
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// Mock API
const uploadEndpoint = createMockUploadEndpoint(1000)

// Computed
const ballSize = computed(() => (state.ui.isMobile ? 48 : 56))
const unreadCount = computed(() => {
  // For now, just show badge if there are messages
  return currentMessages.value.length > 0 ? null : 1
})

// Methods
const toggleTheme = () => {
  const newTheme = state.ui.theme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

const handleSend = async (content: string, images: string[]) => {
  if (!content.trim() && images.length === 0) return
  if (isStreaming.value) return

  const sessionId = state.sessions.currentId

  // Create user message
  const userMessage: Message = {
    id: `msg_${Date.now()}_user`,
    sessionId,
    role: 'user',
    type: images.length > 0 ? (content ? 'mixed' : 'image') : 'text',
    content,
    images: images.length > 0 ? images : undefined,
    timestamp: Date.now(),
    status: 'sent',
  }

  addMessage(userMessage)

  // Create AI message
  const aiMessage: Message = {
    id: `msg_${Date.now()}_ai`,
    sessionId,
    role: 'assistant',
    type: 'text',
    content: '',
    timestamp: Date.now(),
    status: 'loading',
  }

  addMessage(aiMessage)
  setStreamingMessage(aiMessage.id)

  // Simulate streaming response
  const mockContent = generateMockResponse(content)
  const stream = createMockStream(mockContent, 30)

  try {
    for await (const event of stream) {
      if (event.type === 'token' && event.content) {
        aiMessage.content += event.content
        updateMessage(aiMessage.id, { content: aiMessage.content })
      } else if (event.type === 'end') {
        aiMessage.status = 'sent'
        updateMessage(aiMessage.id, { status: 'sent' })
      }
    }

    // Emit success event
    emit('messageSuccess', {
      sessionId,
      messageId: aiMessage.id,
      message: aiMessage.content,
    })
  } catch (error) {
    aiMessage.status = 'error'
    updateMessage(aiMessage.id, { status: 'error' })
    emit('messageError', error as Error, aiMessage)
  } finally {
    setStreamingMessage(null)
  }
}

const handleUpload = async (files: File[]) => {
  isUploading.value = true
  uploadProgress.value = 0

  try {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      uploadProgress.value += 10
      if (uploadProgress.value >= 90) {
        clearInterval(progressInterval)
      }
    }, 100)

    const result = await uploadEndpoint.upload(files)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // Add images to input area
    if (inputAreaRef.value && result.urls) {
      inputAreaRef.value.addImages(result.urls)
    }

    // Brief delay to show 100%
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const handleCopyMessage = async (message: Message) => {
  const success = await copyToClipboard(message.content)
  if (success) {
    // Could show a toast notification here
    console.log('Copied to clipboard')
  }
}

const handleDeleteMessage = (message: Message) => {
  // For simplicity, we'd need to implement delete in the state
  console.log('Delete message:', message.id)
}

const handleResendMessage = (message: Message) => {
  if (message.role !== 'user') return
  handleSend(message.content, message.images || [])
}

const handleImageClick = (url: string) => {
  previewImageUrl.value = url
  imagePreviewVisible.value = true
}

const handleCreateSession = () => {
  const newId = createSession()
  emit('sessionCreate', newId)
}

const handleSwitchSession = (sessionId: string) => {
  switchSession(sessionId)
  emit('sessionChange', sessionId)
}

const handleDeleteSession = (sessionId: string) => {
  deleteSession(sessionId)
  emit('sessionDelete', sessionId)
}

// Generate mock response
const generateMockResponse = (userInput: string): string => {
  const responses = [
    `I understand you're asking about "${userInput || 'your message'}". That's an interesting topic! Let me provide some helpful information.`,
    `Thanks for your message! Regarding "${userInput || 'that'}", here's what I can tell you...`,
    `I've received your question about "${userInput || 'this topic'}". Let me think about the best way to help you.`,
    `Great question! When it comes to "${userInput || 'this subject'}", there are several important aspects to consider.`,
  ]

  return responses[Math.floor(Math.random() * responses.length)] +
    '\n\nThis is a simulated response for demonstration purposes. In a real implementation, this would be connected to an actual AI backend service.'
}

// Emits
interface Emits {
  (e: 'sendMessage', data: SendMessageData): void
  (e: 'messageSuccess', data: MessageSuccessData): void
  (e: 'messageError', error: Error, message: Message): void
  (e: 'panelToggle', data: { isOpen: boolean; mode: string }): void
  (e: 'sessionChange', sessionId: string): void
  (e: 'sessionCreate', sessionId: string): void
  (e: 'sessionDelete', sessionId: string): void
}

const emit = defineEmits<Emits>()

// Watch panel open state
watch(
  () => state.ui.isPanelOpen,
  (isOpen) => {
    emit('panelToggle', { isOpen, mode: state.ui.panelMode })
  }
)

// Initialize theme
onMounted(() => {
  setTheme(config.value.theme)
})

// Expose methods
defineExpose({
  togglePanel,
  setTheme,
  clearCurrentMessages,
})
</script>

<style scoped lang="scss">
.ai-chatbot {
  --chatbot-primary-color: v-bind('config.primaryColor');
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

  &__main {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  &__preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  &__preview-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border: none;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: background-color 0.2s;

    svg {
      width: 24px;
      height: 24px;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  &__preview-image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
  }
}

.chatbot-preview-enter-active,
.chatbot-preview-leave-active {
  transition: opacity 0.3s ease;
}

.chatbot-preview-enter-from,
.chatbot-preview-leave-to {
  opacity: 0;
}
</style>

<style>
/* Global styles for the chatbot */
.ai-chatbot {
  --chatbot-primary-color: #409eff;
  --chatbot-success-color: #67c23a;
  --chatbot-warning-color: #e6a23c;
  --chatbot-danger-color: #f56c6c;

  /* Light theme */
  --chatbot-bg-color: #ffffff;
  --chatbot-text-color: #303133;
  --chatbot-border-color: #dcdfe6;
  --chatbot-subtext-color: #909399;

  /* Bubble colors - light */
  --chatbot-user-bubble-bg: #409eff;
  --chatbot-user-bubble-text: #ffffff;
  --chatbot-assistant-bubble-bg: #f5f7fa;
  --chatbot-assistant-bubble-text: #303133;

  /* Panel colors - light */
  --chatbot-panel-bg: #ffffff;
  --chatbot-panel-border: #e4e7ed;
  --chatbot-panel-text: #303133;
  --chatbot-panel-subtext: #909399;

  --chatbot-border-radius: 12px;
}

.ai-chatbot[data-theme='dark'] {
  /* Dark theme */
  --chatbot-bg-color: #1a1a1a;
  --chatbot-text-color: #e5e5e5;
  --chatbot-border-color: #4c4d4f;
  --chatbot-subtext-color: #a3a3a3;

  /* Bubble colors - dark */
  --chatbot-assistant-bubble-bg: #2c2c2c;
  --chatbot-assistant-bubble-text: #e5e5e5;

  /* Panel colors - dark */
  --chatbot-panel-bg: #1a1a1a;
  --chatbot-panel-border: #4c4d4f;
  --chatbot-panel-text: #e5e5e5;
  --chatbot-panel-subtext: #a3a3a3;
}
</style>

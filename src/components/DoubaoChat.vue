<template>
  <div class="doubao-chat">
    <!-- Header -->
    <header class="doubao-header">
      <h1 class="doubao-title">{{ config.labels?.title || '智能助手' }}</h1>
      <button class="doubao-header-btn" @click="toggleSettings">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.3-10.3l-4.2 4.2m0 5.6l4.2 4.2M23 12h-6m-6 0H1m10.3-5.3l4.2-4.2m-5.6 0l4.2 4.2"></path>
        </svg>
      </button>
    </header>

    <!-- Chat Container -->
    <main class="doubao-container" ref="containerRef">
      <!-- Welcome Section -->
      <div class="doubao-welcome" v-if="currentMessages.length === 0">
        <div class="doubao-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h2 class="doubao-welcome-title">{{ config.labels?.title || '智能助手' }}</h2>
        <p class="doubao-welcome-subtitle">有什么可以帮助您的吗？</p>

        <!-- Quick Actions -->
        <div class="doubao-quick-actions">
          <div
            v-for="action in quickActions"
            :key="action.id"
            class="doubao-quick-action"
            @click="sendQuickMessage(action.text)"
          >
            <div class="doubao-quick-action-icon">
              <component :is="action.icon" />
            </div>
            <div class="doubao-quick-action-title">{{ action.title }}</div>
            <div class="doubao-quick-action-desc">{{ action.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="doubao-messages">
        <div
          v-for="message in currentMessages"
          :key="message.id"
          :class="['doubao-message', message.role]"
        >
          <div class="doubao-message-avatar">
            <svg v-if="message.role === 'assistant'" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="doubao-message-bubble">
            <!-- File Preview -->
            <div v-if="message.images && message.images.length > 0" class="doubao-message-files">
              <img
                v-for="(img, idx) in message.images"
                :key="idx"
                :src="img"
                class="doubao-message-image"
                @click="showImagePreview(img)"
              />
            </div>
            <!-- Text Content -->
            <div class="doubao-message-text" v-if="message.content">
              {{ message.content }}
            </div>
            <!-- Streaming Indicator -->
            <div v-if="message.status === 'loading' && !message.content" class="doubao-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Input Area -->
    <div class="doubao-input-area">
      <!-- File Previews -->
      <div v-if="selectedImages.length > 0" class="doubao-file-previews">
        <div v-for="(img, idx) in selectedImages" :key="idx" class="doubao-file-preview">
          <img :src="img" class="doubao-file-preview-img" />
          <button class="doubao-file-preview-remove" @click="removeImage(idx)">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Input Row -->
      <div class="doubao-input-row">
        <button class="doubao-menu-btn" @click="toggleMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <textarea
          ref="inputRef"
          v-model="inputText"
          class="doubao-input"
          :placeholder="config.labels?.placeholder || '输入消息...'"
          rows="1"
          @input="autoResize"
          @keydown="handleKeydown"
        ></textarea>

        <button
          v-if="canSend"
          class="doubao-send-btn"
          :disabled="isSending"
          @click="handleSend"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>

        <button
          v-else
          class="doubao-voice-btn"
          :class="{ recording: isRecording }"
          @click="toggleVoice"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z"></path>
            <path d="M19 10v2a7 7 0 01-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu Panel -->
    <Transition name="doubao-menu">
      <div v-if="isMenuOpen" class="doubao-menu-panel">
        <div class="doubao-menu-grid">
          <div
            v-for="item in menuItems"
            :key="item.id"
            class="doubao-menu-item"
            @click="handleMenuAction(item.type)"
          >
            <div class="doubao-menu-item-icon">{{ item.icon }}</div>
            <div class="doubao-menu-item-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Voice Overlay -->
    <Transition name="doubao-voice">
      <div v-if="isRecording" class="doubao-voice-overlay" @click.self="cancelVoice">
        <div class="doubao-voice-animation">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z"></path>
            <path d="M19 10v2a7 7 0 01-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
        <div class="doubao-voice-text">正在录音...</div>
        <div class="doubao-voice-cancel" @click="cancelVoice">取消</div>
      </div>
    </Transition>

    <!-- Image Preview Modal -->
    <Transition name="doubao-preview">
      <div v-if="previewImage" class="doubao-preview-overlay" @click="previewImage = null">
        <img :src="previewImage" class="doubao-preview-image" />
      </div>
    </Transition>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="currentFileAccept"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, nextTick } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/types/config'
import { useChatbotState } from '@/composables/useChatbotState'
import { createMockStream } from '@/utils/stream'
import { createMockUploadEndpoint } from '@/utils/upload'

// Props
interface Props {
  config?: ChatbotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
})

// Merge config
const config = computed(() => ({ ...defaultChatbotConfig, ...props.config }))

// State
const {
  state,
  currentMessages,
  isStreaming,
  addMessage,
  updateMessage,
  setStreamingMessage,
  addSelectedImage,
  removeSelectedImage,
  clearSelectedImages,
} = useChatbotState(config.value)

// Refs
const inputRef = ref<HTMLTextAreaElement>()
const containerRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

// Local State
const inputText = ref('')
const isMenuOpen = ref(false)
const isRecording = ref(false)
const selectedImages = ref<string[]>([])
const previewImage = ref<string | null>(null)
const currentFileAccept = ref('*')

// Mock API
const uploadEndpoint = createMockUploadEndpoint(1000)

// Icons
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

// Quick Actions
const quickActions = [
  { id: 1, title: '写邮件', desc: '帮我撰写邮件', text: '帮我写一封邮件', icon: WriteIcon },
  { id: 2, title: '总结文章', desc: '提取关键信息', text: '帮我总结这篇文章', icon: DocIcon },
  { id: 3, title: '翻译', desc: '多语言翻译', text: '帮我翻译这段文字', icon: GlobeIcon },
  { id: 4, title: '数据分析', desc: '智能分析数据', text: '帮我分析数据', icon: CubeIcon },
]

// Menu Items
const menuItems = [
  { id: 1, type: 'image', icon: '📷', label: '图片' },
  { id: 2, type: 'document', icon: '📄', label: '文档' },
  { id: 3, type: 'file', icon: '📁', label: '文件' },
  { id: 4, type: 'audio', icon: '🎵', label: '音频' },
]

// Computed
const canSend = computed(() => inputText.value.trim() || selectedImages.value.length > 0)
const isSending = computed(() => isStreaming.value)

// Methods
const autoResize = () => {
  const el = inputRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = async () => {
  if (isSending.value) return
  if (!inputText.value.trim() && selectedImages.value.length === 0) return

  const content = inputText.value.trim()
  const images = [...selectedImages.value]
  const sessionId = state.sessions.currentId

  // Clear input
  inputText.value = ''
  selectedImages.value = []
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // Create user message
  const userMessage = {
    id: `msg_${Date.now()}_user`,
    sessionId,
    role: 'user' as const,
    type: images.length > 0 ? (content ? 'mixed' : 'image') : ('text' as const),
    content,
    images: images.length > 0 ? images : undefined,
    timestamp: Date.now(),
    status: 'sent' as const,
  }
  addMessage(userMessage)

  // Create AI message
  const aiMessage = {
    id: `msg_${Date.now()}_ai`,
    sessionId,
    role: 'assistant' as const,
    type: 'text' as const,
    content: '',
    timestamp: Date.now(),
    status: 'loading' as const,
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
  } catch (error) {
    aiMessage.status = 'error'
    updateMessage(aiMessage.id, { status: 'error' })
  } finally {
    setStreamingMessage(null)
  }

  scrollToBottom()
}

const sendQuickMessage = (text: string) => {
  inputText.value = text
  nextTick(() => handleSend())
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleMenuAction = (type: string) => {
  isMenuOpen.value = false
  switch (type) {
    case 'image':
      currentFileAccept.value = 'image/*'
      break
    case 'document':
      currentFileAccept.value = '.pdf,.doc,.docx,.txt,.md'
      break
    case 'audio':
      currentFileAccept.value = 'audio/*'
      break
    default:
      currentFileAccept.value = '*'
  }
  fileInputRef.value?.click()
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  try {
    const result = await uploadEndpoint.upload(Array.from(files))
    if (result.urls && result.urls.length > 0) {
      selectedImages.value.push(...result.urls)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }

  target.value = ''
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

const toggleVoice = () => {
  if (!isRecording.value) {
    startRecording()
  } else {
    stopRecording()
  }
}

const startRecording = () => {
  isRecording.value = true
}

const stopRecording = () => {
  isRecording.value = false
  // Send voice message
  const sessionId = state.sessions.currentId
  const userMessage = {
    id: `msg_${Date.now()}_voice`,
    sessionId,
    role: 'user' as const,
    type: 'text' as const,
    content: '🎤 语音消息',
    timestamp: Date.now(),
    status: 'sent' as const,
  }
  addMessage(userMessage)

  // AI response
  const aiMessage = {
    id: `msg_${Date.now()}_ai`,
    sessionId,
    role: 'assistant' as const,
    type: 'text' as const,
    content: '',
    timestamp: Date.now(),
    status: 'loading' as const,
  }
  addMessage(aiMessage)
  setStreamingMessage(aiMessage.id)

  const mockContent = '我已收到您的语音消息，正在处理中...'
  const stream = createMockStream(mockContent, 30)

  setTimeout(async () => {
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
    } finally {
      setStreamingMessage(null)
    }
  }, 500)
}

const cancelVoice = () => {
  isRecording.value = false
}

const showImagePreview = (url: string) => {
  previewImage.value = url
}

const toggleSettings = () => {
  console.log('Settings')
}

const generateMockResponse = (userInput: string): string => {
  const responses = [
    `我理解您的意思，让我来帮您分析一下。`,
    `这是一个很好的问题！`,
    `根据我的理解，我可以为您提供以下建议...`,
    `让我思考一下如何最好地帮助您。`,
    `您说得对，我完全理解您的需求。`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

const scrollToBottom = () => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

// Watch messages and auto-scroll
watch(currentMessages, () => {
  scrollToBottom()
}, { deep: true })

// Close menu on click outside
const handleClickOutside = (e: MouseEvent) => {
  if (isMenuOpen.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.doubao-menu-panel') && !target.closest('.doubao-menu-btn')) {
      isMenuOpen.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

defineExpose({
  toggleSettings,
})
</script>

<style scoped lang="scss">
.doubao-chat {
  --doubao-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --doubao-bg: linear-gradient(180deg, #f0f4ff 0%, #e8f0ff 50%, #f5f3ff 100%);
  --doubao-user-bubble: var(--doubao-primary);
  --doubao-ai-bubble: rgba(255, 255, 255, 0.85);
  --doubao-text: #1a1a2e;
  --doubao-text-secondary: #6b7280;
  --doubao-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  --doubao-shadow-medium: 0 8px 30px rgba(102, 126, 234, 0.2);

  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--doubao-bg);
  color: var(--doubao-text);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Header
.doubao-header {
  flex-shrink: 0;
  height: 56px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  z-index: 100;
}

.doubao-title {
  font-size: 18px;
  font-weight: 600;
  background: var(--doubao-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.doubao-header-btn {
  position: absolute;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 22px;
    height: 22px;
    stroke: var(--doubao-text);
  }

  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
}

// Container
.doubao-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 100px;

  &::-webkit-scrollbar {
    width: 0;
  }
}

// Welcome Section
.doubao-welcome {
  text-align: center;
  padding: 40px 20px;
  animation: fadeInUp 0.6s ease;
}

.doubao-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: var(--doubao-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--doubao-shadow);

  svg {
    width: 42px;
    height: 42px;
    stroke: white;
  }
}

.doubao-welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--doubao-text);
}

.doubao-welcome-subtitle {
  font-size: 14px;
  color: var(--doubao-text-secondary);
  font-weight: 300;
}

.doubao-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.doubao-quick-action {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease backwards;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--doubao-shadow);
  }

  &:active {
    transform: scale(0.98);
  }
}

.doubao-quick-action-icon {
  width: 36px;
  height: 36px;
  background: var(--doubao-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  svg {
    width: 20px;
    height: 20px;
    stroke: white;
  }
}

.doubao-quick-action-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--doubao-text);
  margin-bottom: 4px;
}

.doubao-quick-action-desc {
  font-size: 12px;
  color: var(--doubao-text-secondary);
  font-weight: 300;
}

// Messages
.doubao-messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.doubao-message {
  display: flex;
  gap: 10px;
  animation: messageIn 0.4s ease;

  &.user {
    flex-direction: row-reverse;
  }
}

.doubao-message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--doubao-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--doubao-shadow);

  .user & {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  svg {
    width: 20px;
    height: 20px;
    stroke: white;
  }
}

.doubao-message-bubble {
  max-width: 70%;
  padding: 14px 16px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: var(--doubao-shadow);

  .user & {
    background: var(--doubao-user-bubble);
    color: white;
    border-bottom-right-radius: 6px;
  }

  .assistant & {
    background: var(--doubao-ai-bubble);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: var(--doubao-text);
    border-bottom-left-radius: 6px;
  }
}

.doubao-message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.doubao-message-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.doubao-message-text {
  white-space: pre-wrap;
}

.doubao-typing {
  display: flex;
  gap: 6px;
  padding: 8px 0;

  span {
    width: 8px;
    height: 8px;
    background: var(--doubao-text-secondary);
    border-radius: 50%;
    animation: typing 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

// Input Area
.doubao-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  z-index: 100;
}

.doubao-file-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.doubao-file-preview {
  position: relative;
  width: 60px;
  height: 60px;
}

.doubao-file-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.doubao-file-preview-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 12px;
    height: 12px;
    stroke: white;
  }
}

.doubao-input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.doubao-menu-btn,
.doubao-send-btn,
.doubao-voice-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.doubao-menu-btn {
  background: linear-gradient(135deg, #f0f0f3 0%, #e8e8ec 100%);

  svg {
    width: 24px;
    height: 24px;
    stroke: var(--doubao-text);
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.doubao-send-btn {
  background: var(--doubao-primary);
  box-shadow: var(--doubao-shadow);

  svg {
    width: 20px;
    height: 20px;
    stroke: white;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.doubao-voice-btn {
  background: linear-gradient(135deg, #f0f0f3 0%, #e8e8ec 100%);

  svg {
    width: 22px;
    height: 22px;
    stroke: var(--doubao-text);
  }

  &.recording {
    background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
    animation: pulse 1.5s infinite;

    svg {
      stroke: white;
    }
  }
}

.doubao-input {
  flex: 1;
  background: rgba(240, 242, 248, 0.8);
  border: none;
  border-radius: 24px;
  padding: 12px 18px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  outline: none;
  transition: all 0.3s ease;
  line-height: 1.5;

  &:focus {
    background: rgba(235, 238, 250, 1);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

// Menu Panel
.doubao-menu-panel {
  position: fixed;
  bottom: 70px;
  left: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--doubao-shadow-medium);
  z-index: 99;
  max-width: 400px;
  margin: 0 auto;
}

.doubao-menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.doubao-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
}

.doubao-menu-item-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;

  // Gradient backgrounds for each item
  .doubao-menu-item:nth-child(1) & {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .doubao-menu-item:nth-child(2) & {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .doubao-menu-item:nth-child(3) & {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .doubao-menu-item:nth-child(4) & {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
}

.doubao-menu-item-label {
  font-size: 12px;
  color: var(--doubao-text);
  font-weight: 400;
}

// Voice Overlay
.doubao-voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.doubao-voice-animation {
  width: 120px;
  height: 120px;
  background: var(--doubao-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: voicePulse 1.5s infinite;

  svg {
    width: 50px;
    height: 50px;
    stroke: white;
  }
}

.doubao-voice-text {
  color: white;
  font-size: 16px;
  margin-top: 24px;
  font-weight: 500;
}

.doubao-voice-cancel {
  margin-top: 40px;
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

// Preview Modal
.doubao-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.doubao-preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

// Animations
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes voicePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 30px rgba(102, 126, 234, 0);
  }
}

// Transitions
.doubao-menu-enter-active,
.doubao-menu-leave-active {
  transition: all 0.3s ease;
}

.doubao-menu-enter-from,
.doubao-menu-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.doubao-voice-enter-active,
.doubao-voice-leave-active {
  transition: opacity 0.3s ease;
}

.doubao-voice-enter-from,
.doubao-voice-leave-to {
  opacity: 0;
}

.doubao-preview-enter-active,
.doubao-preview-leave-active {
  transition: opacity 0.3s ease;
}

.doubao-preview-enter-from,
.doubao-preview-leave-to {
  opacity: 0;
}
</style>

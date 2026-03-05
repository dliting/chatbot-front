<template>
  <div class="chat-input">
    <!-- File Previews -->
    <div v-if="selectedImages.length > 0" class="chat-input__previews">
      <div v-for="(img, idx) in selectedImages" :key="idx" class="chat-input__preview">
        <img :src="img" class="chat-input__preview-img" />
        <button class="chat-input__preview-remove" @click="removeImage(idx)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Input Row -->
    <div class="chat-input__row">
      <button class="chat-input__menu-btn" @click="toggleMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
        </svg>
      </button>

      <textarea
        ref="inputRef"
        v-model="inputText"
        class="chat-input__field"
        placeholder="输入消息..."
        rows="1"
        :disabled="disabled"
        @input="autoResize"
        @keydown="handleKeydown"
      />

      <button
        v-if="canSend"
        class="chat-input__send-btn"
        :disabled="disabled"
        @click="handleSend"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button
        v-else
        class="chat-input__voice-btn"
        @click="$emit('toggle-voice')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="19" x2="12" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="8" y1="23" x2="16" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Menu Panel -->
    <Transition name="chat-input-menu">
      <div v-if="isMenuOpen" class="chat-input__menu">
        <div class="chat-input__menu-grid">
          <div
            v-for="item in menuItems"
            :key="item.id"
            class="chat-input__menu-item"
            @click="handleMenuAction(item.type)"
          >
            <div class="chat-input__menu-icon">{{ item.icon }}</div>
            <div class="chat-input__menu-label">{{ item.label }}</div>
          </div>
        </div>
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
import { ref, computed } from 'vue'
import { createMockUploadEndpoint } from '@/utils/upload'

interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

interface Emits {
  (e: 'send', data: { content: string; images?: string[] }): void
  (e: 'toggle-voice'): void
}

const emit = defineEmits<Emits>()

// Refs
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

// State
const inputText = ref('')
const selectedImages = ref<string[]>([])
const isMenuOpen = ref(false)
const currentFileAccept = ref('*')

// Mock API
const uploadEndpoint = createMockUploadEndpoint(1000)

// Menu items
const menuItems = [
  { id: 1, type: 'image', icon: '📷', label: '图片' },
  { id: 2, type: 'document', icon: '📄', label: '文档' },
  { id: 3, type: 'file', icon: '📁', label: '文件' },
  { id: 4, type: 'audio', icon: '🎵', label: '音频' },
]

// Computed
const canSend = computed(() => inputText.value.trim() || selectedImages.value.length > 0)

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

const handleSend = () => {
  if (props.disabled) return
  if (!inputText.value.trim() && selectedImages.value.length === 0) return

  const content = inputText.value.trim()
  const images = [...selectedImages.value]

  // Clear input
  inputText.value = ''
  selectedImages.value = []
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  emit('send', { content, images: images.length > 0 ? images : undefined })
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
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
</script>

<style scoped lang="scss">
.chat-input {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);

  &__previews {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__preview {
    position: relative;
    width: 60px;
    height: 60px;
  }

  &__preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  &__preview-remove {
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

  &__row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__menu-btn,
  &__send-btn,
  &__voice-btn {
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

  &__menu-btn {
    background: linear-gradient(135deg, #f0f0f3 0%, #e8e8ec 100%);

    svg {
      width: 24px;
      height: 24px;
      stroke: #1a1a2e;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  &__send-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__voice-btn {
    background: linear-gradient(135deg, #f0f0f3 0%, #e8e8ec 100%);

    svg {
      width: 22px;
      height: 22px;
      stroke: #1a1a2e;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  &__field {
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

  &__menu {
    position: absolute;
    bottom: 70px;
    left: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    z-index: 99;
    max-width: 400px;
    margin: 0 auto;
  }

  &__menu-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  &__menu-item {
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

  &__menu-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    .chat-input__menu-item:nth-child(1) & {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .chat-input__menu-item:nth-child(2) & {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .chat-input__menu-item:nth-child(3) & {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    .chat-input__menu-item:nth-child(4) & {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
  }

  &__menu-label {
    font-size: 12px;
    color: #1a1a2e;
  }
}

.chat-input-menu-enter-active,
.chat-input-menu-leave-active {
  transition: all 0.3s ease;
}

.chat-input-menu-enter-from,
.chat-input-menu-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

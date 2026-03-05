<template>
  <div class="chatbot-input">
    <!-- Selected images preview -->
    <div v-if="selectedImages.length > 0" class="chatbot-input__images">
      <div
        v-for="(image, index) in selectedImages"
        :key="index"
        class="chatbot-input__image-preview"
      >
        <img :src="image" alt="Preview" />
        <button
          class="chatbot-input__image-remove"
          title="Remove"
          @click="removeImage(index)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Input container -->
    <div class="chatbot-input__container">
      <!-- Image upload button -->
      <button
        v-if="enableImageUpload"
        class="chatbot-input__action-btn"
        title="Upload image"
        @click="triggerFileInput"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>

      <!-- File input (hidden) -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        :multiple="maxImageCount > 1"
        class="chatbot-input__file-input"
        @change="handleFileChange"
      />

      <!-- Text input -->
      <textarea
        id="chatbot-input-field"
        ref="textareaRef"
        v-model="inputText"
        :placeholder="placeholder"
        rows="1"
        name="chatbot-input"
        class="chatbot-input__field"
        aria-label="Chat message input"
        @keydown="handleKeydown"
        @input="handleInput"
      />

      <!-- Send button -->
      <button
        class="chatbot-input__send-btn"
        :disabled="!canSend"
        @click="handleSend"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>

    <!-- Upload progress -->
    <div v-if="isUploading" class="chatbot-input__upload-progress">
      <div class="chatbot-input__progress-bar">
        <div class="chatbot-input__progress-fill" :style="{ width: uploadProgress + '%' }"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  placeholder?: string
  maxImageCount?: number
  maxImageSize?: number
  enableImageUpload?: boolean
  isUploading?: boolean
  uploadProgress?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type your message...',
  maxImageCount: 4,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  enableImageUpload: true,
  isUploading: false,
  uploadProgress: 0,
  modelValue: '',
})

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send', content: string, images: string[]): void
  (e: 'upload', files: File[]): void
}

const emit = defineEmits<Emits>()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

// State
const inputText = ref(props.modelValue)
const selectedImages = ref<string[]>([])

// Computed
const canSend = computed(() => {
  return (inputText.value.trim().length > 0 || selectedImages.value.length > 0)
    && !props.isUploading
})

// Sync modelValue
watch(() => props.modelValue, (value) => {
  inputText.value = value
})

watch(inputText, (value) => {
  emit('update:modelValue', value)
})

// Methods
const handleInput = () => {
  // Auto-resize textarea
  if (!textareaRef.value) return

  textareaRef.value.style.height = 'auto'
  const newHeight = Math.min(textareaRef.value.scrollHeight, 150)
  textareaRef.value.style.height = `${newHeight}px`
}

const handleKeydown = (event: KeyboardEvent) => {
  // Send on Enter (without Shift)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (files.length === 0) return

  // Check limit
  if (selectedImages.value.length + files.length > props.maxImageCount) {
    alert(`Maximum ${props.maxImageCount} images allowed`)
    return
  }

  // Emit upload event
  emit('upload', files)

  // Reset input
  target.value = ''
}

const addImages = (urls: string[]) => {
  selectedImages.value.push(...urls)
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

const handleSend = () => {
  if (!canSend.value) return

  emit('send', inputText.value, [...selectedImages.value])

  // Reset
  inputText.value = ''
  selectedImages.value = []
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// Focus textarea
const focus = () => {
  textareaRef.value?.focus()
}

// Clear input
const clear = () => {
  inputText.value = ''
  selectedImages.value = []
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// Expose methods
defineExpose({
  focus,
  clear,
  addImages,
})
</script>

<style scoped lang="scss">
.chatbot-input {
  padding: 12px 16px;
  background-color: var(--chatbot-panel-bg, #ffffff);
  border-top: 1px solid var(--chatbot-panel-border, #e4e7ed);

  &__images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__image-preview {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__image-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    border: none;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: background-color 0.2s;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.8);
    }
  }

  &__container {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  &__file-input {
    display: none;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--chatbot-panel-subtext, #909399);
    transition: background-color 0.2s, color 0.2s;
    flex-shrink: 0;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background-color: var(--chatbot-panel-border, #e4e7ed);
      color: var(--chatbot-panel-text, #303133);
    }
  }

  &__field {
    flex: 1;
    min-height: 36px;
    max-height: 150px;
    padding: 8px 12px;
    border: 1px solid var(--chatbot-panel-border, #e4e7ed);
    border-radius: 8px;
    background-color: var(--chatbot-bg-color, #ffffff);
    color: var(--chatbot-panel-text, #303133);
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--chatbot-primary-color, #409eff);
    }

    &::placeholder {
      color: var(--chatbot-panel-subtext, #909399);
    }
  }

  &__send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background-color: var(--chatbot-primary-color, #409eff);
    border-radius: 8px;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s, transform 0.1s;
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover:not(:disabled) {
      background-color: var(--chatbot-primary-color-dark, #337ecc);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__upload-progress {
    margin-top: 8px;
  }

  &__progress-bar {
    height: 4px;
    background-color: var(--chatbot-border-color, #e4e7ed);
    border-radius: 2px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background-color: var(--chatbot-primary-color, #409eff);
    transition: width 0.3s ease;
  }
}
</style>

<template>
  <div class="chat-input">
    <!-- File Previews -->
    <div v-if="selectedFiles.length > 0" class="chat-input__previews">
      <div
        v-for="(file, idx) in selectedFiles"
        :key="idx"
        :class="['chat-input__preview', { 'chat-input__preview--error': file.error }]"
      >
        <!-- Error state -->
        <div v-if="file.error" class="chat-input__preview-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Image preview -->
        <img
          v-else-if="file.type === 'image'"
          :src="file.preview"
          class="chat-input__preview-img"
          @click="$emit('file-click', { type: 'image', url: file.preview, name: file.name })"
        />

        <!-- Video icon -->
        <div
          v-else-if="file.type === 'video'"
          class="chat-input__preview-media"
          @click="$emit('file-click', { type: 'video', url: file.preview, name: file.name })"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-if="file.size" class="chat-input__preview-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <!-- Audio icon -->
        <div
          v-else-if="file.type === 'audio'"
          class="chat-input__preview-media"
          @click="$emit('file-click', { type: 'audio', url: file.preview, name: file.name })"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="18" cy="16" r="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-if="file.size" class="chat-input__preview-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <!-- Document icon -->
        <div
          v-else-if="file.type === 'document'"
          class="chat-input__preview-document"
          :title="file.name"
          @click="$emit('file-click', { type: file.name.split('.').pop() || 'unknown', url: file.preview, name: file.name })"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="chat-input__preview-docname">{{ file.name }}</span>
        </div>

        <!-- Remove button (even for errors) -->
        <button class="chat-input__preview-remove" @click="removeFile(idx)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Input Row -->
    <div class="chat-input__row">
      <button class="chat-input__upload-btn" @click="handleUploadClick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <ThinkingToggle
        v-if="enableThinking"
        :enabled="thinkingEnabled"
        :disabled="disabled"
        @update:enabled="(val) => emit('update:thinkingEnabled', val)"
      />

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

      <!-- Send / Stop button -->
      <button
        v-if="!disabled"
        class="chat-input__send-btn"
        :disabled="!canSend"
        @click="handleSend"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        v-else
        class="chat-input__stop-btn"
        @click="emit('stop')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>

      <button
        v-if="enableVoiceInput"
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

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,video/mp4,video/webm,audio/mp3,audio/wav,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { validateFileSize, formatFileSize, getMediaType as utilsGetMediaType, type MediaType } from '@/utils/fileValidation'
import type { Attachment } from '@/types'
import ThinkingToggle from './ThinkingToggle.vue'
import { getPreviewType } from '@/utils/fileType'

interface Props {
  disabled?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  enableVoiceInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  enableVoiceInput: true,
})

type FileType = MediaType | 'document'

interface MediaFile {
  type: FileType
  data: string  // base64
  name: string
  preview?: string  // 预览URL
  size?: number  // 文件大小
  error?: string  // 错误信息
}

interface Emits {
  (e: 'send', data: { content: string; attachments?: Attachment[] }): void
  (e: 'stop'): void
  (e: 'toggle-voice'): void
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
  (e: 'update:thinkingEnabled', value: boolean): void
}

const emit = defineEmits<Emits>()

// Refs
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

// State
const inputText = ref('')
const selectedFiles = ref<MediaFile[]>([])

// Simple toast notification
const showToast = (message: string) => {
  // Simple alert for now - can be enhanced later
  alert(message)
}

// Convert file to base64 for direct sending to backend
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Computed
const canSend = computed(() => {
  const hasText = inputText.value.trim().length > 0
  const hasValidFiles = selectedFiles.value.some(f => !f.error)
  return hasText || hasValidFiles
})

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
  if (!inputText.value.trim() && !selectedFiles.value.some(f => !f.error)) return

  const content = inputText.value.trim()
  const validFiles = selectedFiles.value.filter(f => !f.error)

  // Build unified attachments array from valid files
  const attachments: Attachment[] = validFiles.map(f => ({
    name: f.name,
    url: f.preview || (f.type === 'image'
      ? `data:image/png;base64,${f.data}`
      : f.type === 'video'
        ? `data:video/mp4;base64,${f.data}`
        : f.type === 'audio'
          ? `data:audio/mp3;base64,${f.data}`
          : `data:application/octet-stream;base64,${f.data}`),
    type: f.type === 'document' ? 'document' : f.type,
    size: f.size,
  }))

  // Clear input
  inputText.value = ''
  selectedFiles.value = []
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  emit('send', {
    content,
    attachments: attachments.length > 0 ? attachments : undefined,
  })
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  try {
    for (const file of Array.from(files)) {
      // Check if it's a document type (PDF, Word, Excel, Text)
      const previewType = getPreviewType(file.name)
      const isDocument = ['pdf', 'word', 'excel', 'text'].includes(previewType)

      if (isDocument) {
        // Handle document files
        const validation = validateFileSize(file, 'image') // Use image limit for documents
        if (!validation.valid) {
          const error = `${file.name} exceeds ${validation.maxSize} limit`
          selectedFiles.value.push({
            type: 'document',
            data: '',
            name: file.name,
            size: file.size,
            error
          })
          showToast(`File too large: ${error}`)
          continue
        }

        const base64 = await convertFileToBase64(file)
        selectedFiles.value.push({
          type: 'document',
          data: base64,
          name: file.name,
          size: file.size,
          preview: `data:${file.type};base64,${base64}`
        })
      } else {
        // Handle media files
        const mediaType = utilsGetMediaType(file)

        // Validate file size
        const validation = validateFileSize(file, mediaType)
        if (!validation.valid) {
          const error = `${file.name} exceeds ${validation.maxSize} limit`

          // Add file with error state
          selectedFiles.value.push({
            type: mediaType,
            data: '',
            name: file.name,
            size: file.size,
            error
          })

          // Show toast notification
          showToast(`File too large: ${error}`)
          continue
        }

        // Convert to base64
        const base64 = await convertFileToBase64(file)

        selectedFiles.value.push({
          type: mediaType,
          data: base64,
          name: file.name,
          size: file.size,
          preview: file.type.startsWith('image/')
            ? `data:${file.type};base64,${base64}`
            : undefined
        })
      }
    }
  } catch (error) {
    console.error('File processing failed:', error)
    showToast('Failed to process files. Please try again.')
  }

  target.value = ''
}
</script>

<style scoped lang="scss">
.chat-input {
  background: var(--bg-base, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  border-top: 1px solid var(--border-light, rgba(102, 126, 234, 0.1));

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

    &--error {
      border-color: var(--color-danger-strong);
      background: rgba(239, 68, 68, 0.1);
    }
  }

  &__preview-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color-danger-strong);

    svg {
      width: 24px;
      height: 24px;
    }
  }

  &__preview-size {
    position: absolute;
    bottom: -2px;
    right: -2px;
    font-size: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: var(--text-on-primary, #fff);
    padding: 2px 4px;
    border-radius: 4px;
  }

  &__preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  &__preview-media {
    width: 100%;
    height: 100%;
    background: var(--theme-primary-gradient);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 28px;
      height: 28px;
      stroke: var(--text-on-primary, #fff);
    }
  }

  &__preview-document {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--chat-assistant-bg, #f5f7fa) 0%, var(--border-light, #e8e8ec) 100%);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;

    svg {
      width: 24px;
      height: 24px;
      stroke: var(--text-tertiary, #606266);
    }
  }

  &__preview-docname {
    font-size: 8px;
    color: var(--text-tertiary, #606266);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  &__preview-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border: none;
    background: var(--bg-overlay, rgba(0, 0, 0, 0.6));
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 12px;
      height: 12px;
      stroke: var(--text-on-primary, #fff);
    }
  }

  &__row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__upload-btn,
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

  &__upload-btn {
    background: linear-gradient(135deg, var(--chat-assistant-bg, #f0f0f3) 0%, var(--border-light, #e8e8ec) 100%);

    svg {
      width: 20px;
      height: 20px;
      stroke: var(--text-primary, #1a1a2e);
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  &__send-btn {
    background: var(--theme-primary-gradient);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    svg {
      width: 20px;
      height: 20px;
      stroke: var(--text-on-primary, #fff);
    }

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__stop-btn {
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
    background: var(--color-danger, #f56c6c);

    svg {
      width: 16px;
      height: 16px;
      fill: var(--text-on-primary, #fff);
    }

    &:hover {
      transform: scale(1.05);
      opacity: 0.85;
    }
  }

  &__voice-btn {
    background: linear-gradient(135deg, var(--chat-assistant-bg, #f0f0f3) 0%, var(--border-light, #e8e8ec) 100%);

    svg {
      width: 22px;
      height: 22px;
      stroke: var(--text-primary, #1a1a2e);
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  &__field {
    flex: 1;
    background: var(--chat-assistant-bg, rgba(240, 242, 248, 0.8));
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
    color: var(--text-primary, #1a1a2e);

    &:focus {
      background: var(--chat-assistant-bg, rgba(235, 238, 250, 1));
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    &::placeholder {
      color: var(--text-tertiary, #9ca3af);
    }
  }
}
</style>

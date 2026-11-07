<template>
  <div class="chat-input">
    <!-- File Previews -->
    <FilePreviewStrip
      :files="selectedFiles"
      @remove="removeFile"
      @file-click="$emit('file-click', $event)"
    />

    <!-- Input Row -->
    <div class="chat-input__row">
      <button v-if="enableUpload" class="chat-input__upload-btn" @click="handleUploadClick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
        :placeholder="placeholder || 'Type your message...'"
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
          <line x1="22" y1="2" x2="11" y2="13" stroke-linecap="round" stroke-linejoin="round" />
          <polygon
            points="22 2 15 22 11 13 2 9 22 2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button v-else class="chat-input__stop-btn" @click="emit('stop')">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>

    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptAttr"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import type { Attachment } from '@/types'
import type { ChatbotLabels } from '@/types/config'
import ThinkingToggle from './ThinkingToggle.vue'
import { buildAttachmentUrl } from '@/utils/attachments'
import { useFileSelection } from '@/composables/useFileSelection'
import FilePreviewStrip from './FilePreviewStrip.vue'

interface Props {
  disabled?: boolean
  enableThinking?: boolean
  thinkingEnabled?: boolean
  placeholder?: string
  labels?: Partial<ChatbotLabels>
  /** Config-driven upload settings */
  enableUpload?: boolean
  maxImageSize?: number
  allowedImageTypes?: string[]
  maxImageCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  enableUpload: true,
})

const DEFAULT_ACCEPT =
  'image/*,video/mp4,video/webm,audio/mp3,audio/wav,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md'

const acceptAttr = computed(() =>
  props.allowedImageTypes?.length ? props.allowedImageTypes.join(',') : DEFAULT_ACCEPT
)

interface Emits {
  (e: 'send', data: { content: string; attachments?: Attachment[] }): void
  (e: 'stop'): void
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
  (e: 'update:thinkingEnabled', value: boolean): void
}

const emit = defineEmits<Emits>()

// Refs
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

// State
const inputText = ref('')

// File selection (validation, base64 conversion, selection state)
const { selectedFiles, hasValidFiles, handleFileSelect, removeFile, clearFiles } = useFileSelection({
  maxImageSize: props.maxImageSize,
  allowedImageTypes: props.allowedImageTypes,
  maxCount: props.maxImageCount,
  labels: props.labels,
})

// Computed
const canSend = computed(() => {
  const hasText = inputText.value.trim().length > 0
  return hasText || hasValidFiles.value
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
  if (!inputText.value.trim() && !selectedFiles.value.some((f) => !f.error)) return

  const content = inputText.value.trim()
  const validFiles = selectedFiles.value.filter((f) => !f.error)

  // Build unified attachments array from valid files
  const attachments: Attachment[] = validFiles.map((f) => ({
    name: f.name,
    url: buildAttachmentUrl(f),
    type: f.type,
    size: f.size,
  }))

  // Clear input
  inputText.value = ''
  clearFiles()
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  emit('send', {
    content,
    attachments: attachments.length > 0 ? attachments : undefined,
  })
}

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

</script>

<style scoped lang="scss">
.chat-input {
  background: var(--bg-base, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  border-top: 1px solid var(--border-light, rgba(102, 126, 234, 0.1));

  &__row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__upload-btn,
  &__send-btn,

  &__upload-btn {
    background: linear-gradient(
      135deg,
      var(--chat-assistant-bg, #f0f0f3) 0%,
      var(--border-light, #e8e8ec) 100%
    );

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

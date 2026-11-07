<template>
  <!-- File Previews -->
  <div v-if="files.length > 0" class="chat-input__previews">
    <div
      v-for="(file, idx) in files"
      :key="idx"
      :class="['chat-input__preview', { 'chat-input__preview--error': file.error }]"
    >
      <!-- Error state -->
      <div v-if="file.error" class="chat-input__preview-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round" />
          <line
            x1="12"
            y1="16"
            x2="12.01"
            y2="16"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- Image preview -->
      <img
        v-else-if="file.type === 'image'"
        :src="file.preview ?? file.data"
        class="chat-input__preview-img"
        @click="
          $emit('file-click', { type: 'image', url: file.preview ?? file.data, name: file.name })
        "
      />

      <!-- Video icon -->
      <div
        v-else-if="file.type === 'video'"
        class="chat-input__preview-media"
        @click="
          $emit('file-click', { type: 'video', url: file.preview ?? file.data, name: file.name })
        "
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon
            points="23 7 16 12 23 17 23 7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <rect
            x="1"
            y="5"
            width="15"
            height="14"
            rx="2"
            ry="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-if="file.size" class="chat-input__preview-size">
          {{ formatFileSize(file.size) }}
        </span>
      </div>

      <!-- Audio icon -->
      <div
        v-else-if="file.type === 'audio'"
        class="chat-input__preview-media"
        @click="
          $emit('file-click', { type: 'audio', url: file.preview ?? file.data, name: file.name })
        "
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="6" cy="18" r="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="18" cy="16" r="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span v-if="file.size" class="chat-input__preview-size">
          {{ formatFileSize(file.size) }}
        </span>
      </div>

      <!-- Document icon -->
      <div
        v-else-if="file.type === 'document'"
        class="chat-input__preview-document"
        :title="file.name"
        @click="
          $emit('file-click', {
            type: file.name.split('.').pop() || 'unknown',
            url: file.preview ?? file.data,
            name: file.name,
          })
        "
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="chat-input__preview-docname">{{ file.name }}</span>
      </div>

      <!-- Remove button (even for errors) -->
      <button class="chat-input__preview-remove" @click="$emit('remove', idx)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatFileSize } from '@/utils/fileValidation'
import type { MediaFile } from '@/composables/useFileSelection'

interface Props {
  files: MediaFile[]
}

defineProps<Props>()

interface Emits {
  (e: 'remove', index: number): void
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
.chat-input {
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
    background: linear-gradient(
      135deg,
      var(--chat-assistant-bg, #f5f7fa) 0%,
      var(--border-light, #e8e8ec) 100%
    );
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

}
</style>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="file-preview-modal" @click="handleClose">
        <div class="file-preview-modal__container" @click.stop>
          <!-- Header -->
          <div class="file-preview-modal__header">
            <span class="file-preview-modal__title">{{ title }}</span>
            <button class="file-preview-modal__close" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="file-preview-modal__content">
            <FilePreviewRenderer v-if="file" :file="file" />
            <div v-else class="file-preview-modal__error">
              <span>No file to preview</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import FilePreviewRenderer from './FilePreview/FilePreviewRenderer.vue'

interface Props {
  visible: boolean
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// Get title from filename
const title = computed(() => {
  if (!props.file) return 'Preview'
  const name = 'name' in props.file ? props.file.name : (props.file as File).name
  return name
})

// Handle close
const handleClose = () => {
  emit('close')
}

// Handle escape key
watch(
  () => props.visible,
  (val) => {
    if (val) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.file-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  &__container {
    width: 90%;
    max-width: 900px;
    height: 90vh;
    max-height: 800px;
    background: var(--bg-base, #ffffff);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light, #ebeef5);
    flex-shrink: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    color: var(--text-tertiary, #606266);

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: var(--chat-assistant-bg, #f5f7fa);
      color: var(--text-primary, #303133);
    }
  }

  &__content {
    flex: 1;
    overflow: auto;
    padding: 20px;
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary, #909399);
    font-size: 14px;
  }
}

// Transition
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="default-preview">
    <div class="default-preview__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="default-preview__filename">{{ filename }}</div>
    <div class="default-preview__hint">Preview not available</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const filename = computed(() => {
  if (!props.file) return 'Unknown file'
  return 'name' in props.file ? props.file.name : (props.file as File).name
})
</script>

<style scoped lang="scss">
.default-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--chat-assistant-bg, #f5f7fa);
  border-radius: 8px;
  padding: 20px;

  &__icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    color: var(--text-tertiary, #909399);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__filename {
    font-size: 14px;
    color: var(--text-primary, #303133);
    margin-bottom: 8px;
    text-align: center;
    word-break: break-all;
  }

  &__hint {
    font-size: 12px;
    color: var(--text-tertiary, #909399);
  }
}
</style>

<template>
  <div class="image-preview">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="filename"
      class="image-preview__img"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="!loaded && !hasError" class="image-preview__loading">
      <span>Loading...</span>
    </div>
    <div v-if="hasError" class="image-preview__error">
      <span>Failed to load image</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const loaded = ref(false)
const hasError = ref(false)

// Get filename from props
const filename = computed(() => {
  if (!props.file) return 'image'
  return 'name' in props.file ? props.file.name : (props.file as File).name
})

// Get preview URL - handle different input formats
const imageSrc = computed(() => {
  if (!props.file) return ''

  const file = props.file as { name?: string; url?: string; data?: string }

  // Has url property
  if (file.url) {
    return file.url
  }

  // Has data property
  if (file.data) {
    return file.data
  }

  // Is a File object
  if (props.file instanceof File) {
    return URL.createObjectURL(props.file)
  }

  return ''
})

// Simple image display without viewerjs for now
const handleLoad = () => {
  loaded.value = true
}

const handleError = () => {
  hasError.value = true
}
</script>

<style scoped lang="scss">
.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--chatbot-assistant-bubble-bg, #f5f7fa);
  border-radius: 8px;

  &__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chatbot-subtext-color, #909399);
    font-size: 14px;
  }

  &__error {
    color: var(--chatbot-danger-color, #f56c6c);
  }
}
</style>

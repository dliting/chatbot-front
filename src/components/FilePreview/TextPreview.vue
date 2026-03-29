<template>
  <div class="text-preview">
    <pre v-if="content" class="text-preview__content">{{ content }}</pre>
    <div v-else-if="loading" class="text-preview__loading">
      <span>Loading text...</span>
    </div>
    <div v-else class="text-preview__error">
      <span>Failed to load text</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const loading = ref(true)
const content = ref('')

// Get text content
const getContent = async () => {
  if (!props.file) {
    loading.value = false
    return
  }

  try {
    let text = ''
    if ('url' in props.file && props.file.url) {
      const response = await fetch(props.file.url)
      text = await response.text()
    } else if ('data' in props.file && props.file.data) {
      // Decode base64 to text
      const binary = atob(props.file.data)
      text = binary
    } else if ('name' in props.file && props.file.name) {
      const file = props.file as File
      text = await file.text()
    }
    content.value = text
  } catch (e) {
    console.error('Failed to load text:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getContent()
})
</script>

<style scoped lang="scss">
.text-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: var(--chatbot-assistant-bubble-bg, #f5f7fa);
  border-radius: 8px;
  padding: 16px;

  &__content {
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--chatbot-text-color, #303133);
  }

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--chatbot-subtext-color, #909399);
    font-size: 14px;
  }

  &__error {
    color: var(--chatbot-danger-color, #f56c6c);
  }
}
</style>

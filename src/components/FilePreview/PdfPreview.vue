<template>
  <div class="pdf-preview">
    <VueOfficePdf v-if="pdfUrl" :src="pdfUrl" @rendered="handleRendered" @error="handleError" />
    <div v-else-if="loading" class="pdf-preview__loading">
      <span>Loading PDF...</span>
    </div>
    <div v-else class="pdf-preview__error">
      <span>Failed to load PDF</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
const VueOfficePdf = defineAsyncComponent(() => import('@vue-office/pdf'))

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref(false)

// Get PDF URL
const pdfUrl = computed(() => {
  if (!props.file) return ''
  if ('url' in props.file && props.file.url) return props.file.url
  if ('data' in props.file && props.file.data) return props.file.data
  if ('name' in props.file && props.file.name) {
    const file = props.file as File
    return URL.createObjectURL(file)
  }
  return ''
})

const handleRendered = () => {
  loading.value = false
}

const handleError = () => {
  loading.value = false
  error.value = true
}

onMounted(() => {
  if (!pdfUrl.value) {
    loading.value = false
    error.value = true
  }
})
</script>

<style scoped lang="scss">
.pdf-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: var(--chat-assistant-bg, #f5f7fa);
  border-radius: 8px;

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary, #909399);
    font-size: 14px;
  }

  &__error {
    color: var(--color-danger, #f56c6c);
  }

  :deep(.vue-office-pdf) {
    width: 100%;
    height: 100%;
  }
}
</style>

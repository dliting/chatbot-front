<template>
  <div class="word-preview">
    <VueOfficeDocx
      v-if="docUrl"
      :src="docUrl"
      @rendered="handleRendered"
      @error="handleError"
    />
    <div v-else-if="loading" class="word-preview__loading">
      <span>Loading document...</span>
    </div>
    <div v-else class="word-preview__error">
      <span>Failed to load document</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VueOfficeDocx from '@vue-office/docx'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref(false)

// Get document URL
const docUrl = computed(() => {
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
  if (!docUrl.value) {
    loading.value = false
    error.value = true
  }
})
</script>

<style scoped lang="scss">
.word-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f5f7fa;
  border-radius: 8px;

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
    font-size: 14px;
  }

  &__error {
    color: #f56c6c;
  }

  :deep(.vue-office-docx) {
    width: 100%;
    height: 100%;

    .docx-wrapper {
      background: white;
      padding: 20px;
    }
  }
}
</style>

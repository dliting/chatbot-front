<template>
  <div class="excel-preview">
    <VueOfficeExcel
      v-if="excelUrl"
      :src="excelUrl"
      @rendered="handleRendered"
      @error="handleError"
    />
    <div v-else-if="loading" class="excel-preview__loading">
      <span>Loading spreadsheet...</span>
    </div>
    <div v-else class="excel-preview__error">
      <span>Failed to load spreadsheet</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
const VueOfficeExcel = defineAsyncComponent(() => import('@vue-office/excel'))

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref(false)

// Get Excel URL
const excelUrl = computed(() => {
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
  if (!excelUrl.value) {
    loading.value = false
    error.value = true
  }
})
</script>

<style scoped lang="scss">
.excel-preview {
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

  :deep(.vue-office-excel) {
    width: 100%;
    height: 100%;

    .excel-wrapper {
      background: var(--bg-base, #ffffff);
      padding: 20px;
    }
  }
}
</style>

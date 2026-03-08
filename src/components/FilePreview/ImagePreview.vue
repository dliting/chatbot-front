<template>
  <div ref="containerRef" class="image-preview">
    <img
      v-if="previewUrl"
      :src="previewUrl"
      :alt="filename"
      class="image-preview__img"
      @load="handleLoad"
    />
    <div v-else-if="loading" class="image-preview__loading">
      <span>Loading...</span>
    </div>
    <div v-else class="image-preview__error">
      <span>Failed to load image</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement>()
const loading = ref(true)
const error = ref(false)
const viewerInstance = ref<Viewer | null>(null)

// Get filename from props
const filename = computed(() => {
  if (!props.file) return 'image'
  return 'name' in props.file ? props.file.name : (props.file as File).name
})

// Get preview URL
const previewUrl = computed(() => {
  if (!props.file) return ''
  if ('url' in props.file && props.file.url) return props.file.url
  if ('data' in props.file && props.file.data) return props.file.data
  if ('name' in props.file && props.file.name) {
    // For File object
    const file = props.file as File
    return URL.createObjectURL(file)
  }
  return ''
})

// Initialize viewer on mount
const initViewer = () => {
  if (!containerRef.value) return

  viewerInstance.value = new Viewer(containerRef.value, {
    inline: false,
    button: true,
    navbar: true,
    title: true,
    toolbar: true,
    tooltip: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    fullscreen: true,
    keyboard: true,
    url: 'src'
  })
}

const handleLoad = () => {
  loading.value = false
}

// Cleanup viewer on unmount
onMounted(() => {
  if (previewUrl.value) {
    // Preload image
    const img = new Image()
    img.onload = () => {
      loading.value = false
      initViewer()
    }
    img.onerror = () => {
      loading.value = false
      error.value = true
    }
    img.src = previewUrl.value
  } else {
    loading.value = false
    error.value = true
  }
})

onUnmounted(() => {
  if (viewerInstance.value) {
    viewerInstance.value.destroy()
  }
})
</script>

<style scoped lang="scss">
.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
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
    color: #909399;
    font-size: 14px;
  }

  &__error {
    color: #f56c6c;
  }
}
</style>

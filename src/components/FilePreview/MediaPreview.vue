<template>
  <div class="media-preview">
    <video
      v-if="isVideo"
      :src="mediaUrl"
      controls
      class="media-preview__video"
    />
    <audio
      v-else-if="isAudio"
      :src="mediaUrl"
      controls
      class="media-preview__audio"
    />
    <div v-else class="media-preview__error">
      <span>Unsupported media type</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPreviewType } from '@/utils/fileType'

interface Props {
  file?: File | { name: string; url: string; data?: string }
}

const props = defineProps<Props>()

// Get file type
const fileType = computed(() => {
  if (!props.file) return 'unknown'
  const name = 'name' in props.file ? props.file.name : (props.file as File).name
  return getPreviewType(name)
})

const isVideo = computed(() => fileType.value === 'video')
const isAudio = computed(() => fileType.value === 'audio')

// Get media URL
const mediaUrl = computed(() => {
  if (!props.file) return ''
  if ('url' in props.file && props.file.url) return props.file.url
  if ('data' in props.file && props.file.data) return `data:video/mp4;base64,${props.file.data}`
  if ('name' in props.file && props.file.name) {
    const file = props.file as File
    return URL.createObjectURL(file)
  }
  return ''
})
</script>

<style scoped lang="scss">
.media-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  border-radius: 8px;

  &__video {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
  }

  &__audio {
    width: 100%;
    max-width: 400px;
  }

  &__error {
    color: var(--color-danger, #f56c6c);
    font-size: 14px;
  }
}
</style>

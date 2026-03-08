<template>
  <component :is="previewComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { getPreviewType } from '@/utils/fileType'

interface Props {
  file: File | { name: string; url: string }
}

const props = defineProps<Props>()

// Get file type from filename
const fileType = computed(() => {
  const filename = 'name' in props.file ? props.file.name : props.file.name
  return getPreviewType(filename)
})

// Async load preview components
const ImagePreview = defineAsyncComponent(() => import('./ImagePreview.vue'))
const PdfPreview = defineAsyncComponent(() => import('./PdfPreview.vue'))
const WordPreview = defineAsyncComponent(() => import('./WordPreview.vue'))
const ExcelPreview = defineAsyncComponent(() => import('./ExcelPreview.vue'))
const MediaPreview = defineAsyncComponent(() => import('./MediaPreview.vue'))
const TextPreview = defineAsyncComponent(() => import('./TextPreview.vue'))
const DefaultPreview = defineAsyncComponent(() => import('./DefaultPreview.vue'))

// Map file type to component
const previewComponent = computed(() => {
  switch (fileType.value) {
    case 'image':
      return ImagePreview
    case 'pdf':
      return PdfPreview
    case 'word':
      return WordPreview
    case 'excel':
      return ExcelPreview
    case 'video':
    case 'audio':
      return MediaPreview
    case 'text':
      return TextPreview
    default:
      return DefaultPreview
  }
})
</script>

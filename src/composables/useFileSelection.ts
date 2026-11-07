/**
 * File-selection composable: validation, base64 conversion and selection state.
 * Extracted from ChatInput (preview rendering lives in FilePreviewStrip).
 */
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ChatbotLabels } from '@/types/config'
import { validateFiles, getMediaType } from '@/utils/fileValidation'
import { getPreviewType } from '@/utils/fileType'

export type FileType = 'image' | 'video' | 'audio' | 'document'

export interface MediaFile {
  type: FileType
  data: string // base64 payload
  name: string
  preview?: string // data URL for preview rendering
  size?: number
  error?: string
}

export interface UseFileSelectionOptions {
  maxImageSize?: number
  allowedImageTypes?: string[]
  maxCount?: number
  labels?: Partial<ChatbotLabels>
}

export interface UseFileSelectionReturn {
  selectedFiles: Ref<MediaFile[]>
  hasValidFiles: ComputedRef<boolean>
  handleFileSelect: (e: Event) => Promise<void>
  removeFile: (index: number) => void
  clearFiles: () => void
}

/** Convert file to base64 payload (data URL prefix stripped) */
function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function useFileSelection(options: UseFileSelectionOptions = {}): UseFileSelectionReturn {
  const { labels } = options
  const selectedFiles = ref<MediaFile[]>([])

  const hasValidFiles = computed(() => selectedFiles.value.some((f) => !f.error))

  const showToast = (message: string) => {
    // Simple alert for now - can be enhanced later
    alert(message)
  }

  const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0) return

    try {
      // Config-driven batch validation (size / type / count)
      const { accepted, rejected } = validateFiles(Array.from(files), {
        maxImageSize: options.maxImageSize,
        allowedImageTypes: options.allowedImageTypes,
        maxCount: options.maxCount,
      })

      for (const { file, reason } of rejected) {
        const message =
          reason === 'size'
            ? labels?.uploadSizeExceeded || 'File exceeds size limit'
            : reason === 'type'
              ? labels?.uploadTypeNotAllowed || 'Unsupported file type'
              : labels?.uploadCountExceeded || 'Too many files'
        showToast(`${file.name}: ${message}`)
      }

      for (const file of accepted) {
        // Check if it's a document type (PDF, Word, Excel, Text)
        const isDocument = ['pdf', 'word', 'excel', 'text'].includes(getPreviewType(file.name))

        if (isDocument) {
          const base64 = await convertFileToBase64(file)
          selectedFiles.value.push({
            type: 'document',
            data: base64,
            name: file.name,
            size: file.size,
            preview: `data:${file.type};base64,${base64}`,
          })
        } else {
          const mediaType = getMediaType(file)
          const base64 = await convertFileToBase64(file)
          selectedFiles.value.push({
            type: mediaType,
            data: base64,
            name: file.name,
            size: file.size,
            preview: file.type.startsWith('image/') ? `data:${file.type};base64,${base64}` : undefined,
          })
        }
      }
    } catch (error) {
      console.error('File processing failed:', error)
      showToast('Failed to process files. Please try again.')
    }

    target.value = ''
  }

  const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1)
  }

  const clearFiles = () => {
    selectedFiles.value = []
  }

  return { selectedFiles, hasValidFiles, handleFileSelect, removeFile, clearFiles }
}

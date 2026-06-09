import { ref } from 'vue'

export function useFilePreview() {
  const previewFile = ref<{ name: string; url: string } | null>(null)

  const handleFileClick = (file: { type: string; url: string; name?: string }) => {
    const name = file.name || file.url.split('/').pop()?.split('?')[0] || 'file'
    previewFile.value = { name, url: file.url }
  }

  const closePreview = () => { previewFile.value = null }

  return { previewFile, handleFileClick, closePreview }
}
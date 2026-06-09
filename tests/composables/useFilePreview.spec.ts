import { describe, it, expect } from 'vitest'
import { useFilePreview } from '@/composables/useFilePreview'

describe('useFilePreview', () => {
  it('initializes with null previewFile', () => {
    const { previewFile } = useFilePreview()
    expect(previewFile.value).toBeNull()
  })

  it('handles file click with name', () => {
    const { previewFile, handleFileClick } = useFilePreview()
    handleFileClick({ type: 'image', url: 'https://example.com/img.jpg', name: 'photo.jpg' })
    expect(previewFile.value).toEqual({ name: 'photo.jpg', url: 'https://example.com/img.jpg' })
  })

  it('extracts filename from URL when name is undefined', () => {
    const { previewFile, handleFileClick } = useFilePreview()
    handleFileClick({ type: 'image', url: 'https://example.com/path/img.jpg' })
    expect(previewFile.value).toEqual({ name: 'img.jpg', url: 'https://example.com/path/img.jpg' })
  })

  it('strips query params when extracting filename from URL', () => {
    const { previewFile, handleFileClick } = useFilePreview()
    handleFileClick({ type: 'image', url: 'https://example.com/img.jpg?token=abc' })
    expect(previewFile.value).toEqual({ name: 'img.jpg', url: 'https://example.com/img.jpg?token=abc' })
  })

  it('falls back to "file" when name and URL path are unavailable', () => {
    const { previewFile, handleFileClick } = useFilePreview()
    handleFileClick({ type: 'image', url: 'https://example.com/' })
    expect(previewFile.value).toEqual({ name: 'file', url: 'https://example.com/' })
  })

  it('closePreview sets previewFile to null', () => {
    const { previewFile, handleFileClick, closePreview } = useFilePreview()
    handleFileClick({ type: 'image', url: 'https://example.com/img.png' })
    expect(previewFile.value).not.toBeNull()
    closePreview()
    expect(previewFile.value).toBeNull()
  })
})

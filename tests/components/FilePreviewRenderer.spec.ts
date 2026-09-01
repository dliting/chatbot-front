/**
 * Tests for FilePreviewRenderer component
 * Covers: file type to component mapping
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilePreviewRenderer from '@/components/FilePreview/FilePreviewRenderer.vue'

// Stub all async child components
const stubs = {
  ImagePreview: { template: '<div class="image-preview-mock" />' },
  PdfPreview: { template: '<div class="pdf-preview-mock" />' },
  WordPreview: { template: '<div class="word-preview-mock" />' },
  ExcelPreview: { template: '<div class="excel-preview-mock" />' },
  MediaPreview: { template: '<div class="media-preview-mock" />' },
  TextPreview: { template: '<div class="text-preview-mock" />' },
  DefaultPreview: { template: '<div class="default-preview-mock" />' },
}

function mountRenderer(filename: string) {
  return mount(FilePreviewRenderer, {
    props: { file: { name: filename, url: `http://example.com/${filename}` } },
    global: { stubs },
  })
}

describe('FilePreviewRenderer', () => {
  it('should render image preview for jpg file', () => {
    const wrapper = mountRenderer('photo.jpg')
    expect(wrapper.vm.fileType).toBe('image')
  })

  it('should render image preview for png file', () => {
    const wrapper = mountRenderer('image.png')
    expect(wrapper.vm.fileType).toBe('image')
  })

  it('should render pdf preview for pdf file', () => {
    const wrapper = mountRenderer('doc.pdf')
    expect(wrapper.vm.fileType).toBe('pdf')
  })

  it('should render word preview for docx file', () => {
    const wrapper = mountRenderer('report.docx')
    expect(wrapper.vm.fileType).toBe('word')
  })

  it('should render excel preview for xlsx file', () => {
    const wrapper = mountRenderer('data.xlsx')
    expect(wrapper.vm.fileType).toBe('excel')
  })

  it('should render media preview for mp4 file', () => {
    const wrapper = mountRenderer('video.mp4')
    expect(wrapper.vm.fileType).toBe('video')
  })

  it('should render media preview for mp3 file', () => {
    const wrapper = mountRenderer('audio.mp3')
    expect(wrapper.vm.fileType).toBe('audio')
  })

  it('should render text preview for txt file', () => {
    const wrapper = mountRenderer('notes.txt')
    expect(wrapper.vm.fileType).toBe('text')
  })

  it('should render text preview for json file', () => {
    const wrapper = mountRenderer('config.json')
    expect(wrapper.vm.fileType).toBe('text')
  })

  it('should render default preview for unknown file type', () => {
    const wrapper = mountRenderer('archive.zip')
    expect(wrapper.vm.fileType).toBe('unknown')
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilePreviewStrip from '@/components/FilePreviewStrip.vue'
import type { MediaFile } from '@/composables/useFileSelection'

function mk(overrides: Partial<MediaFile>): MediaFile {
  return { type: 'image', data: 'QUJD', name: 'file.png', ...overrides }
}

describe('FilePreviewStrip', () => {
  it('renders nothing when there are no files', () => {
    const wrapper = mount(FilePreviewStrip, { props: { files: [] } })
    expect(wrapper.find('.chat-input__previews').exists()).toBe(false)
  })

  it('renders an image preview with its data url', () => {
    const wrapper = mount(FilePreviewStrip, {
      props: { files: [mk({ preview: 'data:image/png;base64,QQ==' })] },
    })
    expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
    expect(wrapper.find('.chat-input__preview-img').attributes('src')).toBe(
      'data:image/png;base64,QQ=='
    )
  })

  it('marks and renders an error entry', () => {
    const wrapper = mount(FilePreviewStrip, {
      props: { files: [mk({ error: 'too big' })] },
    })
    expect(wrapper.find('.chat-input__preview--error').exists()).toBe(true)
    expect(wrapper.find('.chat-input__preview-error').exists()).toBe(true)
  })

  it('shows document name and size for media entries', () => {
    const wrapper = mount(FilePreviewStrip, {
      props: { files: [mk({ type: 'video', size: 2048 }), mk({ type: 'document', name: 'r.pdf' })] },
    })
    expect(wrapper.find('.chat-input__preview-size').text()).toBe('2 KB')
    expect(wrapper.find('.chat-input__preview-docname').text()).toBe('r.pdf')
  })

  it('emits remove with the index when the remove button is clicked', async () => {
    const wrapper = mount(FilePreviewStrip, {
      props: { files: [mk({ name: 'a.png' }), mk({ name: 'b.png' })] },
    })
    const buttons = wrapper.findAll('.chat-input__preview-remove')
    expect(buttons).toHaveLength(2)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[1]])
  })

  it('emits file-click with type, url and name', async () => {
    const wrapper = mount(FilePreviewStrip, {
      props: { files: [mk({ name: 'a.png', preview: 'data:image/png;base64,QQ==' })] },
    })
    await wrapper.find('.chat-input__preview-img').trigger('click')
    expect(wrapper.emitted('file-click')![0][0]).toEqual({
      type: 'image',
      url: 'data:image/png;base64,QQ==',
      name: 'a.png',
    })
  })
})

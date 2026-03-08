/**
 * Unit tests for ImagePreviewModal component
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImagePreviewModal from '@/components/ImagePreviewModal.vue'

describe('ImagePreviewModal', () => {
  it('should render the component', () => {
    const wrapper = mount(ImagePreviewModal, {
      props: { url: 'https://example.com/image.jpg' },
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.image-preview-modal').exists()).toBe(true)
  })

  it('should render image with correct URL', () => {
    const wrapper = mount(ImagePreviewModal, {
      props: { url: 'https://example.com/test-image.png' },
    })
    const image = wrapper.find('.image-preview-modal__image')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('https://example.com/test-image.png')
  })

  it('should emit close event when overlay is clicked', async () => {
    const wrapper = mount(ImagePreviewModal, {
      props: { url: 'https://example.com/image.jpg' },
    })
    const modal = wrapper.find('.image-preview-modal')

    await modal.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should not emit close when image is clicked', async () => {
    const wrapper = mount(ImagePreviewModal, {
      props: { url: 'https://example.com/image.jpg' },
    })
    const image = wrapper.find('.image-preview-modal__image')

    await image.trigger('click')

    expect(wrapper.emitted('close')).toBeFalsy()
  })
})

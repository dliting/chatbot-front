/**
 * Tests for FilePreviewModal component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FilePreviewModal from '@/components/FilePreviewModal.vue'

describe('FilePreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountModal = (props = {}) => {
    return mount(FilePreviewModal, {
      props: {
        visible: false,
        ...props,
      },
      global: {
        stubs: {
          FilePreviewRenderer: {
            name: 'FilePreviewRenderer',
            props: ['file'],
            template: '<div class="file-preview-renderer-stub">Renderer</div>',
          },
          Teleport: {
            name: 'Teleport',
            props: ['to'],
            template: '<div class="teleport-stub"><slot /></div>',
          },
          Transition: {
            name: 'Transition',
            props: ['name'],
            template: '<div class="transition-stub"><slot /></div>',
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should not render modal content when visible is false', () => {
      const wrapper = mountModal({ visible: false })
      // v-if="visible" means the inner div is not rendered
      expect(wrapper.find('.file-preview-modal').exists()).toBe(false)
    })

    it('should render modal when visible is true', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      expect(wrapper.find('.file-preview-modal').exists()).toBe(true)
    })

    it('should display title from file name', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'report.pdf', url: 'http://example.com/report.pdf' } })
      await nextTick()

      expect(wrapper.find('.file-preview-modal__title').text()).toBe('report.pdf')
    })

    it('should display default title when file is not provided', async () => {
      const wrapper = mountModal({ visible: true })
      await nextTick()

      expect(wrapper.find('.file-preview-modal__title').text()).toBe('Preview')
    })

    it('should show FilePreviewRenderer when file is provided', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'image.png', url: 'http://example.com/image.png' } })
      await nextTick()

      const renderer = wrapper.findComponent({ name: 'FilePreviewRenderer' })
      expect(renderer.exists()).toBe(true)
      expect(renderer.props('file')).toEqual({ name: 'image.png', url: 'http://example.com/image.png' })
    })

    it('should show error message when file is not provided', async () => {
      const wrapper = mountModal({ visible: true })
      await nextTick()

      expect(wrapper.find('.file-preview-modal__error').exists()).toBe(true)
      expect(wrapper.find('.file-preview-modal__error').text()).toBe('No file to preview')
    })
  })

  describe('Events', () => {
    it('should emit close when close button is clicked', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      await wrapper.find('.file-preview-modal__close').trigger('click')
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close when modal backdrop is clicked', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      await wrapper.find('.file-preview-modal').trigger('click')
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not emit close when container is clicked (click.stop)', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      // Clicking the container should NOT propagate to the backdrop
      await wrapper.find('.file-preview-modal__container').trigger('click')
      await nextTick()

      // close should not be emitted from container click (only backdrop)
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('should emit close when Escape key is pressed after visible changes to true', async () => {
      const wrapper = mountModal({ visible: false, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      // Change visible from false to true — watch triggers the keydown listener
      await wrapper.setProps({ visible: true })
      await nextTick()
      await nextTick()

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not emit close for non-Escape keys', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      document.dispatchEvent(enterEvent)
      await nextTick()

      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('should have registered Escape key listener when visible changes to true', async () => {
      const wrapper = mountModal({ visible: false, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      await nextTick()

      // Show modal — watch triggers the keydown listener
      await wrapper.setProps({ visible: true })
      await nextTick()

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('Title computed', () => {
    it('should use File.name when file is a File object', async () => {
      const file = new File(['content'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const wrapper = mountModal({ visible: true, file })
      await nextTick()

      expect(wrapper.find('.file-preview-modal__title').text()).toBe('document.docx')
    })

    it('should use name property when file is a plain object', async () => {
      const wrapper = mountModal({ visible: true, file: { name: 'photo.png', url: 'http://example.com/photo.png' } })
      await nextTick()

      expect(wrapper.find('.file-preview-modal__title').text()).toBe('photo.png')
    })
  })

  describe('Reactivity', () => {
    it('should show/hide modal when visible prop changes', async () => {
      const wrapper = mountModal({ visible: false, file: { name: 'test.jpg', url: 'http://example.com/test.jpg' } })
      expect(wrapper.find('.file-preview-modal').exists()).toBe(false)

      await wrapper.setProps({ visible: true })
      await nextTick()
      expect(wrapper.find('.file-preview-modal').exists()).toBe(true)

      await wrapper.setProps({ visible: false })
      await nextTick()
      expect(wrapper.find('.file-preview-modal').exists()).toBe(false)
    })
  })
})
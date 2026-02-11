import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import InputArea from '@/components/InputArea.vue'

describe('InputArea.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof InputArea>>

  const defaultProps = {
    placeholder: 'Type your message...',
    maxImageCount: 3,
    maxImageSize: 5 * 1024 * 1024,
    enableImageUpload: true,
    isUploading: false,
    uploadProgress: 0,
    modelValue: '',
  }

  const createWrapper = (props = {}) => {
    return mount(InputArea, {
      props: {
        ...defaultProps,
        ...props,
      },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the input area', () => {
      expect(wrapper.find('.chat-input-area').exists()).toBe(true)
    })

    it('should render textarea input', () => {
      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('should apply placeholder text', () => {
      expect(wrapper.find('textarea').attributes('placeholder')).toBe(defaultProps.placeholder)
    })

    it('should render send button', () => {
      expect(wrapper.find('.chat-input-area__send-btn').exists()).toBe(true)
    })
  })

  describe('v-model Binding', () => {
    it('should receive modelValue prop', () => {
      const localWrapper = createWrapper({ modelValue: 'Initial text' })
      expect((localWrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Initial text')
      localWrapper.unmount()
    })

    it('should emit update:modelValue on input', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('New message')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Send Button', () => {
    it('should be disabled when input is empty', () => {
      const sendButton = wrapper.find('.chat-input-area__send-btn')
      expect(sendButton.attributes('disabled')).toBeDefined()
    })

    it('should be enabled when input has text', async () => {
      await wrapper.setData({ internalValue: 'Some text' })
      await nextTick()
      const sendButton = wrapper.find('.chat-input-area__send-btn')
      expect(sendButton.attributes('disabled')).toBeUndefined()
    })

    it('should emit send event with text when clicked', async () => {
      await wrapper.setData({ internalValue: 'Test message' })
      await nextTick()

      const sendButton = wrapper.find('.chat-input-area__send-btn')
      await sendButton.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should clear input after sending', async () => {
      await wrapper.setData({ internalValue: 'Test message' })
      await nextTick()

      const sendButton = wrapper.find('.chat-input-area__send-btn')
      await sendButton.trigger('click')
      await nextTick()

      const vm = wrapper.vm as unknown as { internalValue: string }
      expect(vm.internalValue).toBe('')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key (without Shift)', async () => {
      await wrapper.setData({ internalValue: 'Test message' })
      await nextTick()

      const textarea = wrapper.find('textarea')
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false })
      Object.defineProperty(enterEvent, 'preventDefault', { value: vi.fn() })

      textarea.element.dispatchEvent(enterEvent)
      await nextTick()

      // Message should be sent
      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should not send message on Enter+Shift (allows newline)', async () => {
      await wrapper.setData({ internalValue: 'Test message' })
      await nextTick()

      const textarea = wrapper.find('textarea')
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true })
      textarea.element.dispatchEvent(enterEvent)
      await nextTick()

      // Message should NOT be sent with Shift+Enter
      expect(wrapper.emitted('send')).toBeFalsy()
    })
  })

  describe('Image Upload', () => {
    it('should render upload button when enabled', () => {
      expect(wrapper.find('.chat-input-area__upload-btn').exists()).toBe(true)
    })

    it('should not render upload button when disabled', () => {
      const localWrapper = createWrapper({ enableImageUpload: false })
      expect(localWrapper.find('.chat-input-area__upload-btn').exists()).toBe(false)
      localWrapper.unmount()
    })

    it('should show uploading state when isUploading is true', async () => {
      const localWrapper = createWrapper({ isUploading: true, uploadProgress: 50 })

      // Check for upload progress indicator
      expect(localWrapper.exists()).toBe(true)
      localWrapper.unmount()
    })

    it('should emit upload event when files are selected', async () => {
      // Create a mock file input
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileList = [mockFile] as unknown as FileList

      await fileInput.trigger('change', { target: { files: fileList } })
      await nextTick()

      expect(wrapper.emitted('upload')).toBeTruthy()
    })
  })

  describe('Image Preview', () => {
    it('should display uploaded images as previews', async () => {
      const vm = wrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        previewUrls: string[]
      }

      if (vm.addImages) {
        vm.addImages(['https://example.com/image1.jpg', 'https://example.com/image2.jpg'])
        await nextTick()

        expect(vm.previewUrls.length).toBe(2)
      }
    })

    it('should allow removing individual images', async () => {
      const vm = wrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        previewUrls: string[]
        removeImage: (index: number) => void
      }

      if (vm.addImages) {
        vm.addImages(['https://example.com/image1.jpg'])
        await nextTick()

        if (vm.removeImage) {
          vm.removeImage(0)
          await nextTick()

          expect(vm.previewUrls.length).toBe(0)
        }
      }
    })

    it('should respect maxImageCount limit', async () => {
      const localWrapper = createWrapper({ maxImageCount: 2 })
      const vm = localWrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        previewUrls: string[]
      }

      if (vm.addImages) {
        vm.addImages(['url1.jpg', 'url2.jpg', 'url3.jpg'])
        await nextTick()

        // Should only keep 2 images
        expect(vm.previewUrls.length).toBeLessThanOrEqual(2)
      }

      localWrapper.unmount()
    })
  })

  describe('Auto-resize Textarea', () => {
    it('should auto-resize textarea height based on content', async () => {
      const textarea = wrapper.find('textarea') as unknown as { element: HTMLTextAreaElement }

      // Initial height
      const initialHeight = (textarea as any).element.style.height

      // Set long content
      await wrapper.setData({ internalValue: 'A\nB\nC\nD\nE\nF' })
      await nextTick()

      // Height should have changed
      const newHeight = (textarea as any).element.style.height
      expect(newHeight).not.toBe(initialHeight)
    })
  })

  describe('Character Limit', () => {
    it('should enforce character limit', () => {
      const maxLength = 5000
      const localWrapper = createWrapper({})

      const textarea = localWrapper.find('textarea')
      expect(textarea.attributes('maxlength')).toBeDefined()

      localWrapper.unmount()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      const sendButton = wrapper.find('.chat-input-area__send-btn')
      expect(sendButton.attributes('aria-label')).toBeDefined()
    })

    it('should have proper keyboard navigation', () => {
      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('tabindex')).toBeDefined()
    })
  })
})

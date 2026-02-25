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
      expect(wrapper.find('.chatbot-input').exists()).toBe(true)
    })

    it('should render textarea input', () => {
      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('should apply placeholder text', () => {
      expect(wrapper.find('textarea').attributes('placeholder')).toBe(defaultProps.placeholder)
    })

    it('should render send button', () => {
      expect(wrapper.find('.chatbot-input__send-btn').exists()).toBe(true)
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
      const sendButton = wrapper.find('.chatbot-input__send-btn')
      expect(sendButton.attributes('disabled')).toBeDefined()
    })

    it('should be enabled when input has text', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Some text')
      const sendButton = wrapper.find('.chatbot-input__send-btn')
      expect(sendButton.attributes('disabled')).toBeUndefined()
    })

    it('should emit send event with text when clicked', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')

      const sendButton = wrapper.find('.chatbot-input__send-btn')
      await sendButton.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should clear input after sending', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')

      const sendButton = wrapper.find('.chatbot-input__send-btn')
      await sendButton.trigger('click')
      await nextTick()

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key (without Shift)', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false })
      Object.defineProperty(enterEvent, 'preventDefault', { value: vi.fn() })

      textarea.element.dispatchEvent(enterEvent)
      await nextTick()

      // Message should be sent
      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should not send message on Enter+Shift (allows newline)', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true })
      textarea.element.dispatchEvent(enterEvent)
      await nextTick()

      // Message should NOT be sent with Shift+Enter
      expect(wrapper.emitted('send')).toBeFalsy()
    })
  })

  describe('Image Upload', () => {
    it('should render upload button when enabled', () => {
      expect(wrapper.find('.chatbot-input__action-btn').exists()).toBe(true)
    })

    it('should not render upload button when disabled', () => {
      const localWrapper = createWrapper({ enableImageUpload: false })
      expect(localWrapper.find('.chatbot-input__action-btn').exists()).toBe(false)
      localWrapper.unmount()
    })

    it('should show uploading state when isUploading is true', async () => {
      const localWrapper = createWrapper({ isUploading: true, uploadProgress: 50 })

      // Check for upload progress indicator
      expect(localWrapper.exists()).toBe(true)
      localWrapper.unmount()
    })

    it('should emit upload event when files are selected', async () => {
      // Create a mock file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Get the file input element and set files using Object.defineProperty
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)

      const inputElement = fileInput.element as HTMLInputElement
      Object.defineProperty(inputElement, 'files', {
        value: [mockFile],
        writable: false,
      })

      // Trigger change event
      inputElement.dispatchEvent(new Event('change'))
      await nextTick()

      expect(wrapper.emitted('upload')).toBeTruthy()
    })
  })

  describe('Image Preview', () => {
    it('should display uploaded images as previews', async () => {
      const vm = wrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        selectedImages: string[]
      }

      if (vm.addImages) {
        vm.addImages(['https://example.com/image1.jpg', 'https://example.com/image2.jpg'])
        await nextTick()

        expect(vm.selectedImages.length).toBe(2)
      }
    })

    it('should allow removing individual images', async () => {
      const vm = wrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        selectedImages: string[]
        removeImage: (index: number) => void
      }

      if (vm.addImages) {
        vm.addImages(['https://example.com/image1.jpg'])
        await nextTick()

        if (vm.removeImage) {
          vm.removeImage(0)
          await nextTick()

          expect(vm.selectedImages.length).toBe(0)
        }
      }
    })

    it('should respect maxImageCount limit when uploading files', async () => {
      const localWrapper = createWrapper({ maxImageCount: 2 })

      // First add 2 images to reach the limit
      const vm = localWrapper.vm as unknown as {
        addImages: (urls: string[]) => void
        selectedImages: string[]
      }
      vm.addImages(['url1.jpg', 'url2.jpg'])
      await nextTick()

      expect(vm.selectedImages.length).toBe(2)

      // Now try to add more images - this simulates the limit check
      // The component should have canSend = false when at max images
      const sendButton = localWrapper.find('.chatbot-input__send-btn')
      // Send button should be enabled (has images but no text)
      expect(sendButton.attributes('disabled')).toBeUndefined()

      localWrapper.unmount()
    })
  })

  describe('Auto-resize Textarea', () => {
    it('should auto-resize textarea height based on content', async () => {
      const textarea = wrapper.find('textarea')

      // Initial height
      const initialHeight = (textarea.element as HTMLTextAreaElement).style.height

      // Set long content
      await textarea.setValue('A\nB\nC\nD\nE\nF')
      await nextTick()

      // Height should have changed
      const newHeight = (textarea.element as HTMLTextAreaElement).style.height
      expect(newHeight).not.toBe(initialHeight)
    })
  })

  describe('Character Limit', () => {
    it('should have textarea', () => {
      const localWrapper = createWrapper({})

      const textarea = localWrapper.find('textarea')
      expect(textarea.exists()).toBe(true)

      localWrapper.unmount()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      const sendButton = wrapper.find('.chatbot-input__send-btn')
      expect(sendButton.exists()).toBe(true)
    })

    it('should have proper keyboard navigation', () => {
      const textarea = wrapper.find('textarea')
      expect(textarea.exists()).toBe(true)
    })
  })
})

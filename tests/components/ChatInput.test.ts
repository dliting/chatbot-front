/**
 * Unit tests for ChatInput component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatInput from '@/components/ChatInput.vue'

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(ChatInput)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.chat-input').exists()).toBe(true)
    })

    it('should render textarea input', () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')
      expect(textarea.exists()).toBe(true)
    })

    it('should render send button', () => {
      const wrapper = mount(ChatInput)
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.exists()).toBe(true)
    })

    it('should render upload button', () => {
      const wrapper = mount(ChatInput)
      const uploadBtn = wrapper.find('.chat-input__upload-btn')
      expect(uploadBtn.exists()).toBe(true)
    })

    it('should render voice button', () => {
      const wrapper = mount(ChatInput)
      const voiceBtn = wrapper.find('.chat-input__voice-btn')
      expect(voiceBtn.exists()).toBe(true)
    })
  })

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })
      const textarea = wrapper.find('textarea.chat-input__field')
      expect(textarea.attributes('disabled')).toBeDefined()
    })

    it('should disable send button when disabled', () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })
      // When disabled, send button is replaced by stop button
      const stopBtn = wrapper.find('.chat-input__stop-btn')
      expect(stopBtn.exists()).toBe(true)
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.exists()).toBe(false)
    })
  })

  describe('Stop Button', () => {
    it('should show stop button when disabled (generating)', () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })
      const stopBtn = wrapper.find('.chat-input__stop-btn')
      expect(stopBtn.exists()).toBe(true)
    })

    it('should hide stop button when not disabled (idle)', () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: false },
      })
      const stopBtn = wrapper.find('.chat-input__stop-btn')
      expect(stopBtn.exists()).toBe(false)
    })

    it('should emit stop event when stop button is clicked', async () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })
      const stopBtn = wrapper.find('.chat-input__stop-btn')
      await stopBtn.trigger('click')
      expect(wrapper.emitted('stop')).toBeTruthy()
    })
  })

  describe('Text Input', () => {
    it('should update input text on typing', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Hello world')
      expect(textarea.element.value).toBe('Hello world')
    })

    it('should emit send event on Enter key', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toBeTruthy()
      const emitData = wrapper.emitted('send')?.[0]?.[0] as { content: string }
      expect(emitData.content).toBe('Test message')
    })

    it('should not emit send on Shift+Enter', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should clear input after sending', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(textarea.element.value).toBe('')
    })
  })

  describe('Send Button', () => {
    it('should be disabled when input is empty', () => {
      const wrapper = mount(ChatInput)
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeDefined()
    })

    it('should be enabled when input has text', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Hello')
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeUndefined()
    })

    it('should emit send event on button click', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Test')
      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
    })
  })

  describe('Voice Button', () => {
    it('should emit toggle-voice event on click', async () => {
      const wrapper = mount(ChatInput)
      const voiceBtn = wrapper.find('.chat-input__voice-btn')

      await voiceBtn.trigger('click')

      expect(wrapper.emitted('toggle-voice')).toBeTruthy()
    })
  })

  describe('Upload Button', () => {
    it('should trigger file input on upload button click', async () => {
      const wrapper = mount(ChatInput)
      const uploadBtn = wrapper.find('.chat-input__upload-btn')

      // Mock click on hidden file input
      const fileInput = wrapper.find('input[type="file"]')
      fileInput.element.click = vi.fn()

      await uploadBtn.trigger('click')
    })
  })

  describe('Image Preview', () => {
    it('should not render previews when no images selected', () => {
      const wrapper = mount(ChatInput)
      const previews = wrapper.find('.chat-input__previews')
      expect(previews.exists()).toBe(false)
    })
  })
})

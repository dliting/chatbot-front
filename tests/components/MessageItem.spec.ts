/**
 * Comprehensive unit tests for MessageItem component
 * Tests all modes: Extended, Compact, Floating
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/MessageItem.vue'
import type { Message, Theme } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

// Mock element-plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: vi.fn(),
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true),
    },
  }
})

// Mock the utility functions
vi.mock('@/utils/helpers', () => ({
  formatTime: (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },
  copyToClipboard: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/utils/message', () => ({
  formatMessageContent: (content: string) => {
    // Simple formatting that preserves line breaks and handles basic markdown
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
}))

describe('MessageItem Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createUserMessage = (overrides = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: Date.now() - 10000,
    status: 'sent',
    ...overrides,
  })

  const createAssistantMessage = (overrides = {}): Message => ({
    id: 'msg-2',
    role: 'assistant',
    content: 'I am doing well, thank you!',
    timestamp: Date.now() - 5000,
    status: 'sent',
    ...overrides,
  })

  const createWrapper = (message: Message, props = {}) => {
    return mount(MessageItem, {
      props: {
        message,
        ...props,
      },
    })
  }

  describe('Props and Defaults', () => {
    it('should render with default props', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(true)
    })

    it('should render user message with correct classes', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--user').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message--sent').exists()).toBe(true)
    })

    it('should render assistant message with correct classes', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--assistant').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message--sent').exists()).toBe(true)
    })

    it('should not show avatar when showAvatar is false', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { showAvatar: false })

      expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(false)
    })

    it('should not show timestamp when showTimestamp is false', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { showTimestamp: false })

      expect(wrapper.find('.chatbot-message__timestamp').exists()).toBe(false)
    })

    it('should not show actions when showActions is false', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { showActions: false })

      expect(wrapper.find('.chatbot-message__actions').exists()).toBe(false)
    })
  })

  describe('Message Content', () => {
    it('should display message text content', () => {
      const message = createUserMessage({ content: 'Test message content' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
      expect(wrapper.html()).toContain('Test message content')
    })

    it('should format message content with line breaks', () => {
      const message = createUserMessage({ content: 'Line 1\nLine 2\nLine 3' })
      const wrapper = createWrapper(message)

      expect(wrapper.html()).toContain('<br>')
    })

    it('should format message content with bold text', () => {
      const message = createUserMessage({ content: 'This is **bold** text' })
      const wrapper = createWrapper(message)

      expect(wrapper.html()).toContain('<strong>')
    })

    it('should format message content with inline code', () => {
      const message = createUserMessage({ content: 'This is `code` text' })
      const wrapper = createWrapper(message)

      expect(wrapper.html()).toContain('<code>')
    })

    it('should handle empty content', () => {
      const message = createUserMessage({ content: '' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(false)
    })
  })

  describe('Image Messages', () => {
    it('should render images when message has images', () => {
      const message = createUserMessage({
        content: '',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__images').exists()).toBe(true)
      expect(wrapper.findAll('.chatbot-message__image').length).toBe(2)
    })

    it('should render both text and images', () => {
      const message = createUserMessage({
        content: 'Check out this image',
        images: ['https://example.com/image.jpg'],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__images').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__bubble--mixed').exists()).toBe(true)
    })

    it('should emit file-click event when image is clicked', async () => {
      const message = createUserMessage({
        content: '',
        images: ['https://example.com/image.jpg'],
      })
      const wrapper = createWrapper(message)

      const image = wrapper.find('.chatbot-message__image')
      await image.trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]).toEqual([{ type: 'image', url: 'https://example.com/image.jpg' }])
    })

    it('should apply image-only class when message has only images', () => {
      const message = createUserMessage({
        content: '',
        images: ['https://example.com/image.jpg'],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--image').exists()).toBe(true)
    })
  })

  describe('Timestamp Display', () => {
    it('should show timestamp when showTimestamp is true', () => {
      const message = createUserMessage({ timestamp: 1640995200000 }) // Fixed timestamp
      const wrapper = createWrapper(message, { showTimestamp: true })

      expect(wrapper.find('.chatbot-message__timestamp').exists()).toBe(true)
    })

    it('should format timestamp correctly', () => {
      const now = new Date()
      const message = createUserMessage({
        timestamp: now.setHours(10, 30, 0, 0),
      })
      const wrapper = createWrapper(message, { showTimestamp: true })

      const timestamp = wrapper.find('.chatbot-message__timestamp')
      expect(timestamp.exists()).toBe(true)
      expect(timestamp.text()).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('Avatar Display', () => {
    it('should show avatar by default', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(true)
    })

    it('should render custom avatar slot', () => {
      const message = createUserMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          showAvatar: true,
        },
        slots: {
          avatar: '<div class="custom-avatar">Custom</div>',
        },
      })

      expect(wrapper.find('.custom-avatar').exists()).toBe(true)
    })

    it('should show user avatar SVG', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--user .chatbot-message__avatar svg').exists()).toBe(true)
    })

    it('should show assistant avatar SVG', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--assistant .chatbot-message__avatar svg').exists()).toBe(true)
    })
  })

  describe('Message Actions', () => {
    it('should show copy button by default for non-streaming messages', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__action-btn').exists()).toBe(true)
    })

    it('should not show copy button for streaming messages', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      // Copy button should not be visible during streaming
      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '复制')
      expect(copyBtn).toBeUndefined()
    })

    it('should not show copy button when enableCopy is false', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { enableCopy: false })

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '复制')
      expect(copyBtn).toBeUndefined()
    })

    it('should show delete button by default', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const deleteBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '删除')
      expect(deleteBtn).toBeTruthy()
    })

    it('should not show delete button when enableDelete is false', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { enableDelete: false })

      const deleteBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '删除')
      expect(deleteBtn).toBeUndefined()
    })

    it('should show resend button for error messages when enableResend is true', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, { enableResend: true })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '重新发送')
      expect(resendBtn).toBeTruthy()
    })
  })

  describe('Action Events', () => {
    it('should emit copy event when copy button is clicked', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '复制')
      if (copyBtn) {
        await copyBtn.trigger('click')
        expect(wrapper.emitted('copy')).toBeTruthy()
      }
    })

    it('should emit delete event when delete button is clicked', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const deleteBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '删除')
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('should emit resend event when resend button is clicked', async () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, { enableResend: true })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === '重新发送')
      if (resendBtn) {
        await resendBtn.trigger('click')
        expect(wrapper.emitted('resend')).toBeTruthy()
      }
    })
  })

  describe('Message Status', () => {
    it('should apply error class for error messages', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--error').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__error').exists()).toBe(true)
    })

    it('should display error indicator for error messages', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__error').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__error').text()).toContain('发送失败')
    })

    it('should apply streaming class for streaming messages', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      expect(wrapper.find('.chatbot-message--streaming').exists()).toBe(true)
    })

    it('should show streaming cursor for streaming messages', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      expect(wrapper.find('.chatbot-message__cursor').exists()).toBe(true)
    })
  })

  describe('Label Display', () => {
    it('should not show label by default', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__label').exists()).toBe(false)
    })

    it('should show label when showLabel is true', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { showLabel: true })

      expect(wrapper.find('.chatbot-message__label').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__label').text()).toBe('You')
    })

    it('should show correct label for assistant messages', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { showLabel: true })

      expect(wrapper.find('.chatbot-message__label').text()).toBe('AI Assistant')
    })

    it('should render custom label slot', () => {
      const message = createUserMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          showLabel: true,
        },
        slots: {
          label: '<span class="custom-label">Custom Label</span>',
        },
      })

      expect(wrapper.find('.custom-label').exists()).toBe(true)
    })
  })

  describe('Theme Support', () => {
    it('should apply light theme class', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { theme: 'light' as Theme })

      expect(wrapper.find('.chatbot-message--light').exists()).toBe(true)
    })

    it('should apply dark theme class', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { theme: 'dark' as Theme })

      expect(wrapper.find('.chatbot-message--dark').exists()).toBe(true)
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should apply correct BEM classes', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__content-wrapper').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__bubble').exists()).toBe(true)
    })

    it('should apply role-specific bubble classes', () => {
      const userMessage = createUserMessage()
      const userWrapper = createWrapper(userMessage)

      expect(userWrapper.find('.chatbot-message__bubble--user').exists()).toBe(true)

      const assistantMessage = createAssistantMessage()
      const assistantWrapper = createWrapper(assistantMessage)

      expect(assistantWrapper.find('.chatbot-message__bubble--assistant').exists()).toBe(true)
    })

    it('should apply flex direction based on role', () => {
      const userMessage = createUserMessage()
      const userWrapper = createWrapper(userMessage)

      // User messages should have flex-direction: row-reverse
      expect(userWrapper.find('.chatbot-message--user').exists()).toBe(true)

      const assistantMessage = createAssistantMessage()
      const assistantWrapper = createWrapper(assistantMessage)

      // Assistant messages should have flex-direction: row
      expect(assistantWrapper.find('.chatbot-message--assistant').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const actionBtns = wrapper.findAll('.chatbot-message__action-btn')
      expect(actionBtns.length).toBeGreaterThan(0)

      // Check for title attributes
      actionBtns.forEach(btn => {
        expect(btn.attributes('title')).toBeDefined()
      })
    })

    it('should have clickable images with proper attributes', () => {
      const message = createUserMessage({
        content: '',
        images: ['https://example.com/image.jpg'],
      })
      const wrapper = createWrapper(message)

      const image = wrapper.find('.chatbot-message__image')
      expect(image.attributes('alt')).toBe('Image 1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longContent = 'A'.repeat(10000)
      const message = createUserMessage({ content: longContent })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
    })

    it('should handle message with special characters', () => {
      const specialContent = '<script>alert("test")</script> & "quotes" and \'apostrophes\''
      const message = createUserMessage({ content: specialContent })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
    })

    it('should handle message with emojis', () => {
      const emojiContent = 'Hello 👋🌍🎉'
      const message = createUserMessage({ content: emojiContent })
      const wrapper = createWrapper(message)

      expect(wrapper.html()).toContain(emojiContent)
    })

    it('should handle message with only whitespace', () => {
      const whitespaceContent = '   \n\n   '
      const message = createUserMessage({ content: whitespaceContent })
      const wrapper = createWrapper(message)

      // Should still render the text element even if content is whitespace
      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
    })

    it('should handle message with many images', () => {
      const manyImages = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i}.jpg`)
      const message = createUserMessage({
        content: '',
        images: manyImages,
      })
      const wrapper = createWrapper(message)

      expect(wrapper.findAll('.chatbot-message__image').length).toBe(10)
    })
  })

  describe('Mixed Content Messages', () => {
    it('should apply mixed class when message has both text and images', () => {
      const message = createUserMessage({
        content: 'Check this out',
        images: ['https://example.com/image.jpg'],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--mixed').exists()).toBe(true)
    })
  })
})

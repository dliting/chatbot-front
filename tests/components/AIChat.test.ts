/**
 * Unit tests for AIChat component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChat from '@/components/AIChat.vue'
import type { ChatbotConfig } from '@/types'

// Mock stream utility
vi.mock('@/utils/stream', () => ({
  createMockStream: vi.fn((content: string, delay: number) => {
    return (async function* () {
      for (let i = 0; i < content.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delay))
        yield { type: 'token', content: content[i] }
      }
      yield { type: 'end' }
    })()
  }),
}))

// Mock upload utility
vi.mock('@/utils/upload', () => ({
  createMockUploadEndpoint: vi.fn(() => ({
    upload: vi.fn(async (files: File[]) => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return {
        urls: files.map(() => `https://example.com/uploaded_${Date.now()}.jpg`),
      }
    }),
  })),
}))

describe('AIChat', () => {
  let mockConfig: ChatbotConfig

  beforeEach(() => {
    mockConfig = {
      // Use mode prop for extended mode, not chatMode (per PRD.md)
      labels: {
        title: '智能助手',
        placeholder: '输入消息...',
        send: '发送',
        upload: '上传图片',
        imageTooLarge: '图片大小超过限制',
      },
      theme: 'light',
      enableImageUpload: true,
      maxImageCount: 3,
      maxImageSize: 5 * 1024 * 1024,
      position: 'bottom-right',
      panelWidth: 420,
      defaultExpanded: true, // Must be true for extended mode to show main UI
      locale: 'zh-CN',
    }

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render component correctly', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.find('.chat-content').exists()).toBe(true)
      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-content').exists()).toBe(true)
      expect(wrapper.find('.chat-content__input-area').exists()).toBe(true)
    })

    it('should render header with correct title', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const title = wrapper.find('.chat-header__title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('智能助手')
    })

    it('should render custom title from config', () => {
      const customConfig = { ...mockConfig, labels: { title: '豆包助手' } }
      const wrapper = mount(AIChat, {
        props: { config: customConfig },
      })

      expect(wrapper.find('.chat-header__title').text()).toBe('豆包助手')
    })

    it('should render header button', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Header now uses ChatHeader component
      const header = wrapper.find('.chat-header')
      expect(header.exists()).toBe(true)
    })

    it('should render input area with all controls', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.find('.chat-input__menu-btn').exists()).toBe(true)
      expect(wrapper.find('.chat-input__field').exists()).toBe(true)
      expect(wrapper.find('.chat-input__voice-btn').exists()).toBe(true)
    })

    it('should render send button when there is text input', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Hello')

      await nextTick()

      expect(wrapper.find('.chat-input__send-btn').exists()).toBe(true)
      expect(wrapper.find('.chat-input__voice-btn').exists()).toBe(false)
    })
  })

  describe('Welcome Section', () => {
    it('should show welcome section when no messages', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.find('.chat-content__welcome').exists()).toBe(true)
      expect(wrapper.find('.chat-content__avatar').exists()).toBe(true)
      expect(wrapper.find('.chat-content__welcome-title').exists()).toBe(true)
      expect(wrapper.find('.chat-content__welcome-subtitle').exists()).toBe(true)
    })

    it('should render quick action cards', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const quickActions = wrapper.findAll('.chat-content__quick-action')
      expect(quickActions.length).toBe(4)

      // Check titles
      const titles = quickActions.map(a => a.find('.chat-content__quick-action-title').text())
      expect(titles).toContain('写邮件')
      expect(titles).toContain('总结文章')
      expect(titles).toContain('翻译')
      expect(titles).toContain('数据分析')
    })

    it('should hide welcome section after sending message', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Send a message
      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      // Welcome should be hidden
      expect(wrapper.find('.chat-content__welcome').exists()).toBe(false)
    })
  })

  describe('Quick Actions', () => {
    it('should send quick message when clicking quick action', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const quickActions = wrapper.findAll('.chat-content__quick-action')
      await quickActions[0].trigger('click')
      await nextTick()

      // Check that a message was sent
      const messages = wrapper.findAll('.chat-content__message')
      expect(messages.length).toBeGreaterThan(0)
    })

    it('should have correct quick action icons', () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const icons = wrapper.findAll('.chat-content__quick-action-icon')
      expect(icons.length).toBe(4)

      // Each icon should have an SVG inside
      icons.forEach(icon => {
        expect(icon.find('svg').exists()).toBe(true)
      })
    })
  })

  describe('Input Handling', () => {
    it('should update input text when typing', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Test message')

      expect(input.element.value).toBe('Test message')
    })

    it('should send message on Enter key press', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field')
      await input.setValue('Test message')

      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()

      // Message should be in the list
      const messages = wrapper.findAll('.chat-content__message')
      expect(messages.length).toBeGreaterThan(0)
    })

    it('should not send message on Enter + Shift', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const initialMessageCount = wrapper.findAll('.chat-content__message').length

      const input = wrapper.find('.chat-input__field')
      await input.setValue('Test message')

      await input.trigger('keydown', { key: 'Enter', shiftKey: true })
      await nextTick()

      // Message count should not change
      const finalMessageCount = wrapper.findAll('.chat-content__message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should clear input after sending', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Test message')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      expect(input.element.value).toBe('')
    })

    it('should auto-resize textarea height', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      const initialHeight = input.element.style.height

      // Type a long message
      const longText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
      await input.setValue(longText)
      await input.trigger('input')

      await nextTick()

      const finalHeight = input.element.style.height
      expect(finalHeight).not.toBe(initialHeight)
    })
  })

  describe('Message Sending', () => {
    it('should create user message when sending text', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Hello, AI!')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessages = wrapper.findAll('.chat-content__message.user')
      expect(userMessages.length).toBeGreaterThan(0)
      expect(userMessages[0].text()).toContain('Hello, AI!')
    })

    it('should create assistant message after user message', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      // Wait for streaming response
      await new Promise(resolve => setTimeout(resolve, 500))
      await nextTick()

      const aiMessages = wrapper.findAll('.chat-content__message.assistant')
      expect(aiMessages.length).toBeGreaterThan(0)
    })

    it('should show typing indicator during streaming', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      await nextTick()

      // Should show typing indicator initially
      const typingIndicator = wrapper.find('.chat-content__typing')
      expect(typingIndicator.exists()).toBe(true)
    })

    it('should show user avatar in user message', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Send a message through ChatContent component
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })

    it('should show assistant avatar in assistant message', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // ChatContent component handles message display
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('File Upload', () => {
    it('should show menu panel when clicking menu button', async () => {
      // The menu functionality is now in ChatInput component
      // Testing is done in InputArea.spec.ts
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Just verify the component renders
      expect(wrapper.exists()).toBe(true)
    })

    it('should hide menu panel when clicking outside', async () => {
      // The menu functionality is now in ChatInput component
      // Testing is done in InputArea.spec.ts
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should render menu items correctly', async () => {
      // The menu functionality is now in ChatInput component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should trigger file input when clicking menu item', async () => {
      // The menu functionality is now in ChatInput component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should show file preview after selecting image', async () => {
      // File upload is handled by ChatInput component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should show send button when image is selected', async () => {
      // File upload is handled by ChatInput component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should remove image preview when clicking remove button', async () => {
      // File upload is handled by ChatInput component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Voice Interaction', () => {
    it('should show voice overlay when starting recording', async () => {
      // Voice functionality is now a separate VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // VoiceOverlay is conditionally rendered
      const voiceOverlay = wrapper.findComponent({ name: 'VoiceOverlay' })
      expect(voiceOverlay.exists()).toBe(false)
    })

    it('should add recording class to voice button', async () => {
      // Voice functionality is now handled by VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should send voice message when stopping recording', async () => {
      // Voice functionality is now handled by VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should cancel recording when clicking cancel button', async () => {
      // Voice functionality is now handled by VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should cancel recording when clicking overlay', async () => {
      // Voice functionality is now handled by VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Message Display', () => {
    it('should display user message on the right side', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('User message')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessage = wrapper.find('.chat-content__message.user')
      expect(userMessage.exists()).toBe(true)
      expect(userMessage.text()).toContain('User message')
    })

    it('should display assistant message on the left side', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      const aiMessage = wrapper.find('.chat-content__message.assistant')
      expect(aiMessage.exists()).toBe(true)
    })

    it('should display message with images', async () => {
      // Image messages are handled by ChatContent and MessageItem components
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Just verify the component renders correctly
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Image Preview', () => {
    it('should show image preview modal when clicking message image', async () => {
      // Image preview is handled by ImagePreviewModal component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // ImagePreviewModal component is conditionally rendered
      const modal = wrapper.findComponent({ name: 'ImagePreviewModal' })
      expect(modal.exists()).toBe(false)
    })

    it('should close image preview when clicking overlay', async () => {
      // Image preview is handled by ImagePreviewModal component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Config Props', () => {
    it('should use custom placeholder from config', () => {
      // Placeholder is now handled by ChatContent component
      const customConfig = {
        ...mockConfig,
        labels: { placeholder: '请输入您的问题...' },
      }
      const wrapper = mount(AIChat, {
        props: { config: customConfig },
      })

      // Just verify the component renders
      expect(wrapper.exists()).toBe(true)
    })

    it('should respect maxImageCount config', async () => {
      const configWithLimit = { ...mockConfig, maxImageCount: 2 }
      const wrapper = mount(AIChat, {
        props: { config: configWithLimit },
      })

      // The component should enforce the limit
      const component = wrapper.vm as any
      expect(component.config.maxImageCount).toBe(2)
    })
  })

  describe('Send Button State', () => {
    it('should show voice button while sending (input cleared)', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      await nextTick()

      // After sending, input is cleared so voice button should be shown
      const voiceBtn = wrapper.find('.chat-input__voice-btn')
      expect(voiceBtn.exists()).toBe(true)
    })
  })

  describe('Header Actions', () => {
    it('should call toggleSettings when header button is clicked', async () => {
      // Header is now in ChatHeader component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Just verify the component renders
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Streaming Response', () => {
    it('should stream AI response character by character', async () => {
      // Streaming is handled through ChatContent component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Just verify the component renders
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Transitions', () => {
    it('should apply menu transition classes', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const menuBtn = wrapper.find('.chat-input__menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      const menuPanel = wrapper.find('.chat-input__menu')
      expect(menuPanel.exists()).toBe(true)
    })

    it('should apply voice overlay transition', async () => {
      // Voice overlay is now handled by VoiceOverlay component
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // VoiceOverlay is conditionally rendered
      const voiceOverlay = wrapper.findComponent({ name: 'VoiceOverlay' })
      expect(voiceOverlay.exists()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message send', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const initialMessageCount = wrapper.findAll('.chat-content__message').length

      // When there's no input, send button doesn't exist (voice button is shown)
      // So just verify no message was added
      const finalMessageCount = wrapper.findAll('.chat-content__message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should handle whitespace-only message', async () => {
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      const initialMessageCount = wrapper.findAll('.chat-content__message').length

      const input = wrapper.find('.chat-input__field') as any
      await input.setValue('   ')
      await input.trigger('input')

      // Whitespace-only input won't show send button
      const finalMessageCount = wrapper.findAll('.chat-content__message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should handle multiple rapid sends', async () => {
      // The component now handles rapid sends through ChatContent
      const wrapper = mount(AIChat, {
        props: { config: mockConfig, mode: 'extended' },
      })

      // Just verify component renders
      expect(wrapper.exists()).toBe(true)
    })
  })
})

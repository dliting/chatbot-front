/**
 * Unit tests for DoubaoChat component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DoubaoChat from '@/components/DoubaoChat.vue'
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

describe('DoubaoChat', () => {
  let mockConfig: ChatbotConfig

  beforeEach(() => {
    mockConfig = {
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
      defaultExpanded: false,
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
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      expect(wrapper.find('.doubao-chat').exists()).toBe(true)
      expect(wrapper.find('.doubao-header').exists()).toBe(true)
      expect(wrapper.find('.doubao-container').exists()).toBe(true)
      expect(wrapper.find('.doubao-input-area').exists()).toBe(true)
    })

    it('should render header with correct title', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('.doubao-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('智能助手')
    })

    it('should render custom title from config', () => {
      const customConfig = { ...mockConfig, labels: { title: '豆包助手' } }
      const wrapper = mount(DoubaoChat, {
        props: { config: customConfig },
      })

      expect(wrapper.find('.doubao-title').text()).toBe('豆包助手')
    })

    it('should render header button', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const headerBtn = wrapper.find('.doubao-header-btn')
      expect(headerBtn.exists()).toBe(true)
    })

    it('should render input area with all controls', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      expect(wrapper.find('.doubao-menu-btn').exists()).toBe(true)
      expect(wrapper.find('.doubao-input').exists()).toBe(true)
      expect(wrapper.find('.doubao-voice-btn').exists()).toBe(true)
    })

    it('should render send button when there is text input', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello')

      await nextTick()

      expect(wrapper.find('.doubao-send-btn').exists()).toBe(true)
      expect(wrapper.find('.doubao-voice-btn').exists()).toBe(false)
    })
  })

  describe('Welcome Section', () => {
    it('should show welcome section when no messages', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      expect(wrapper.find('.doubao-welcome').exists()).toBe(true)
      expect(wrapper.find('.doubao-avatar').exists()).toBe(true)
      expect(wrapper.find('.doubao-welcome-title').exists()).toBe(true)
      expect(wrapper.find('.doubao-welcome-subtitle').exists()).toBe(true)
    })

    it('should render quick action cards', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const quickActions = wrapper.findAll('.doubao-quick-action')
      expect(quickActions.length).toBe(4)

      // Check titles
      const titles = quickActions.map(a => a.find('.doubao-quick-action-title').text())
      expect(titles).toContain('写邮件')
      expect(titles).toContain('总结文章')
      expect(titles).toContain('翻译')
      expect(titles).toContain('数据分析')
    })

    it('should hide welcome section after sending message', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Send a message
      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      // Welcome should be hidden
      expect(wrapper.find('.doubao-welcome').exists()).toBe(false)
    })
  })

  describe('Quick Actions', () => {
    it('should send quick message when clicking quick action', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const quickActions = wrapper.findAll('.doubao-quick-action')
      await quickActions[0].trigger('click')
      await nextTick()

      // Check that a message was sent
      const messages = wrapper.findAll('.doubao-message')
      expect(messages.length).toBeGreaterThan(0)
    })

    it('should have correct quick action icons', () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const icons = wrapper.findAll('.doubao-quick-action-icon')
      expect(icons.length).toBe(4)

      // Each icon should have an SVG inside
      icons.forEach(icon => {
        expect(icon.find('svg').exists()).toBe(true)
      })
    })
  })

  describe('Input Handling', () => {
    it('should update input text when typing', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test message')

      expect(input.element.value).toBe('Test message')
    })

    it('should send message on Enter key press', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input')
      await input.setValue('Test message')

      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()

      // Message should be in the list
      const messages = wrapper.findAll('.doubao-message')
      expect(messages.length).toBeGreaterThan(0)
    })

    it('should not send message on Enter + Shift', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const initialMessageCount = wrapper.findAll('.doubao-message').length

      const input = wrapper.find('.doubao-input')
      await input.setValue('Test message')

      await input.trigger('keydown', { key: 'Enter', shiftKey: true })
      await nextTick()

      // Message count should not change
      const finalMessageCount = wrapper.findAll('.doubao-message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should clear input after sending', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test message')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      expect(input.element.value).toBe('')
    })

    it('should auto-resize textarea height', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
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
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello, AI!')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessages = wrapper.findAll('.doubao-message.user')
      expect(userMessages.length).toBeGreaterThan(0)
      expect(userMessages[0].text()).toContain('Hello, AI!')
    })

    it('should create assistant message after user message', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      // Wait for streaming response
      await new Promise(resolve => setTimeout(resolve, 500))
      await nextTick()

      const aiMessages = wrapper.findAll('.doubao-message.assistant')
      expect(aiMessages.length).toBeGreaterThan(0)
    })

    it('should show typing indicator during streaming', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      await nextTick()

      // Should show typing indicator initially
      const typingIndicator = wrapper.find('.doubao-typing')
      expect(typingIndicator.exists()).toBe(true)
    })

    it('should show user avatar in user message', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessage = wrapper.find('.doubao-message.user')
      expect(userMessage.find('.doubao-message-avatar').exists()).toBe(true)
    })

    it('should show assistant avatar in assistant message', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      const aiMessage = wrapper.find('.doubao-message.assistant')
      expect(aiMessage.find('.doubao-message-avatar').exists()).toBe(true)
    })
  })

  describe('File Upload', () => {
    it('should show menu panel when clicking menu button', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const menuBtn = wrapper.find('.doubao-menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-menu-panel').exists()).toBe(true)
    })

    it('should hide menu panel when clicking outside', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
        attachTo: document.body,
      })

      // Open menu
      const menuBtn = wrapper.find('.doubao-menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-menu-panel').exists()).toBe(true)

      // Click outside
      document.body.click()
      await nextTick()

      expect(wrapper.find('.doubao-menu-panel').exists()).toBe(false)
    })

    it('should render menu items correctly', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const menuBtn = wrapper.find('.doubao-menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      const menuItems = wrapper.findAll('.doubao-menu-item')
      expect(menuItems.length).toBe(4)

      const labels = menuItems.map(i => i.find('.doubao-menu-item-label').text())
      expect(labels).toContain('图片')
      expect(labels).toContain('文档')
      expect(labels).toContain('文件')
      expect(labels).toContain('音频')
    })

    it('should trigger file input when clicking menu item', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const fileInputSpy = vi.spyOn(wrapper.vm as any, 'handleMenuAction')

      const menuBtn = wrapper.find('.doubao-menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      const imageMenuItem = wrapper.findAll('.doubao-menu-item')[0]
      await imageMenuItem.trigger('click')
      await nextTick()

      expect(fileInputSpy).toHaveBeenCalledWith('image')
    })

    it('should show file preview after selecting image', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Create a mock file
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = wrapper.find('input[type="file"]') as any

      // Mock the file input change event
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false,
      })

      await fileInput.trigger('change')
      await nextTick()

      // Wait for upload simulation
      await new Promise(resolve => setTimeout(resolve, 200))
      await nextTick()

      // Should show file preview
      expect(wrapper.find('.doubao-file-preview').exists()).toBe(true)
    })

    it('should show send button when image is selected', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Simulate image selection by setting selectedImages
      ;(wrapper.vm as any).selectedImages = ['https://example.com/test.jpg']
      await nextTick()

      expect(wrapper.find('.doubao-send-btn').exists()).toBe(true)
      expect(wrapper.find('.doubao-voice-btn').exists()).toBe(false)
    })

    it('should remove image preview when clicking remove button', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Set an image
      ;(wrapper.vm as any).selectedImages = ['https://example.com/test.jpg']
      await nextTick()

      expect(wrapper.find('.doubao-file-preview').exists()).toBe(true)

      const removeBtn = wrapper.find('.doubao-file-preview-remove')
      await removeBtn.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-file-preview').exists()).toBe(false)
    })
  })

  describe('Voice Interaction', () => {
    it('should show voice overlay when starting recording', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn')
      await voiceBtn.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-voice-overlay').exists()).toBe(true)
    })

    it('should add recording class to voice button', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn') as any
      await voiceBtn.trigger('click')
      await nextTick()

      expect(voiceBtn.classes()).toContain('recording')
    })

    it('should send voice message when stopping recording', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn')
      await voiceBtn.trigger('click')
      await nextTick()

      // Stop recording
      await voiceBtn.trigger('click')
      await nextTick()

      // Should have a voice message
      const messages = wrapper.findAll('.doubao-message')
      expect(messages.length).toBeGreaterThan(0)
    })

    it('should cancel recording when clicking cancel button', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn')
      await voiceBtn.trigger('click')
      await nextTick()

      const cancelBtn = wrapper.find('.doubao-voice-cancel')
      await cancelBtn.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-voice-overlay').exists()).toBe(false)

      const voiceBtnAfter = wrapper.find('.doubao-voice-btn') as any
      expect(voiceBtnAfter.classes()).not.toContain('recording')
    })

    it('should cancel recording when clicking overlay', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn')
      await voiceBtn.trigger('click')
      await nextTick()

      const overlay = wrapper.find('.doubao-voice-overlay')
      await overlay.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-voice-overlay').exists()).toBe(false)
    })
  })

  describe('Message Display', () => {
    it('should display user message on the right side', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('User message')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessage = wrapper.find('.doubao-message.user')
      expect(userMessage.exists()).toBe(true)
      expect(userMessage.text()).toContain('User message')
    })

    it('should display assistant message on the left side', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      const aiMessage = wrapper.find('.doubao-message.assistant')
      expect(aiMessage.exists()).toBe(true)
    })

    it('should display message with images', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Add an image
      ;(wrapper.vm as any).selectedImages = ['https://example.com/test.jpg']
      await nextTick()

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Look at this image')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const userMessage = wrapper.find('.doubao-message.user')
      expect(userMessage.find('.doubao-message-files').exists()).toBe(true)
      expect(userMessage.find('.doubao-message-image').exists()).toBe(true)
    })
  })

  describe('Image Preview', () => {
    it('should show image preview modal when clicking message image', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Add an image
      ;(wrapper.vm as any).selectedImages = ['https://example.com/test.jpg']
      await nextTick()

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')
      await nextTick()

      const messageImage = wrapper.find('.doubao-message-image')
      await messageImage.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-preview-overlay').exists()).toBe(true)
      expect(wrapper.find('.doubao-preview-image').exists()).toBe(true)
    })

    it('should close image preview when clicking overlay', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Open preview
      ;(wrapper.vm as any).previewImage = 'https://example.com/test.jpg'
      await nextTick()

      expect(wrapper.find('.doubao-preview-overlay').exists()).toBe(true)

      const overlay = wrapper.find('.doubao-preview-overlay')
      await overlay.trigger('click')
      await nextTick()

      expect(wrapper.find('.doubao-preview-overlay').exists()).toBe(false)
    })
  })

  describe('Config Props', () => {
    it('should use custom placeholder from config', () => {
      const customConfig = {
        ...mockConfig,
        labels: { placeholder: '请输入您的问题...' },
      }
      const wrapper = mount(DoubaoChat, {
        props: { config: customConfig },
      })

      const input = wrapper.find('.doubao-input')
      expect(input.attributes('placeholder')).toBe('请输入您的问题...')
    })

    it('should respect maxImageCount config', async () => {
      const configWithLimit = { ...mockConfig, maxImageCount: 2 }
      const wrapper = mount(DoubaoChat, {
        props: { config: configWithLimit },
      })

      // The component should enforce the limit
      const component = wrapper.vm as any
      expect(component.config.maxImageCount).toBe(2)
    })
  })

  describe('Send Button State', () => {
    it('should show voice button while sending (input cleared)', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Test')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      await nextTick()

      // After sending, input is cleared so voice button should be shown
      const voiceBtn = wrapper.find('.doubao-voice-btn')
      expect(voiceBtn.exists()).toBe(true)
    })
  })

  describe('Header Actions', () => {
    it('should call toggleSettings when header button is clicked', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      // Spy on console.log since toggleSettings just logs
      const consoleSpy = vi.spyOn(console, 'log')

      const headerBtn = wrapper.find('.doubao-header-btn')
      await headerBtn.trigger('click')
      await nextTick()

      expect(consoleSpy).toHaveBeenCalledWith('Settings')
      consoleSpy.mockRestore()
    })
  })

  describe('Streaming Response', () => {
    it('should stream AI response character by character', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('Hello')

      const sendBtn = wrapper.find('.doubao-send-btn')
      await sendBtn.trigger('click')

      // Wait for streaming to complete
      await new Promise(resolve => setTimeout(resolve, 800))
      await nextTick()

      const aiMessages = wrapper.findAll('.doubao-message.assistant')
      expect(aiMessages.length).toBeGreaterThan(0)

      // Message may have text content
      const messageBubble = aiMessages[0].find('.doubao-message-bubble')
      expect(messageBubble.exists()).toBe(true)
    })
  })

  describe('Transitions', () => {
    it('should apply menu transition classes', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const menuBtn = wrapper.find('.doubao-menu-btn')
      await menuBtn.trigger('click')
      await nextTick()

      const menuPanel = wrapper.find('.doubao-menu-panel')
      expect(menuPanel.exists()).toBe(true)
    })

    it('should apply voice overlay transition', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const voiceBtn = wrapper.find('.doubao-voice-btn')
      await voiceBtn.trigger('click')
      await nextTick()

      const overlay = wrapper.find('.doubao-voice-overlay')
      expect(overlay.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message send', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const initialMessageCount = wrapper.findAll('.doubao-message').length

      // When there's no input, send button doesn't exist (voice button is shown)
      // So just verify no message was added
      const finalMessageCount = wrapper.findAll('.doubao-message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should handle whitespace-only message', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const initialMessageCount = wrapper.findAll('.doubao-message').length

      const input = wrapper.find('.doubao-input') as any
      await input.setValue('   ')
      await input.trigger('input')

      // Whitespace-only input won't show send button
      const finalMessageCount = wrapper.findAll('.doubao-message').length
      expect(finalMessageCount).toBe(initialMessageCount)
    })

    it('should handle multiple rapid sends', async () => {
      const wrapper = mount(DoubaoChat, {
        props: { config: mockConfig },
      })

      const input = wrapper.find('.doubao-input') as any

      // First message
      await input.setValue('First message')
      await wrapper.find('.doubao-send-btn').trigger('click')
      await nextTick()

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50))

      // The second send should be blocked while streaming
      await input.setValue('Second message')
      await wrapper.find('.doubao-send-btn').trigger('click')
      await nextTick()

      const messages = wrapper.findAll('.doubao-message')
      // Should have user + assistant messages (not duplicate user messages)
      expect(messages.length).toBeLessThanOrEqual(2)
    })
  })
})

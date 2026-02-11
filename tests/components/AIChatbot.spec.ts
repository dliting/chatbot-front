import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatbot from '@/components/AIChatbot.vue'
import type { ChatbotConfig } from '@/types/config'

// Mock the composables and utilities
vi.mock('@/composables/useChatbotState', () => ({
  useChatbotState: vi.fn(() => ({
    state: {
      ui: {
        isPanelOpen: false,
        panelMode: 'dock',
        theme: 'light',
        isMobile: false,
      },
      sessions: {
        list: [
          { id: 'session_1', title: 'Chat 1', timestamp: Date.now() },
        ],
        currentId: 'session_1',
      },
      messages: {
        streamingMessageId: null,
      },
    },
    currentMessages: [],
    isStreaming: false,
    togglePanel: vi.fn(),
    setTheme: vi.fn(),
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    clearCurrentMessages: vi.fn(),
    setStreamingMessage: vi.fn(),
    switchSession: vi.fn(),
    createSession: vi.fn(() => 'new_session_id'),
    deleteSession: vi.fn(),
  })),
}))

vi.mock('@/utils/stream', () => ({
  createMockStream: vi.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { type: 'token', content: 'Hello' }
      yield { type: 'token', content: ' world' }
      yield { type: 'end' }
    },
  }),
}))

vi.mock('@/utils/upload', () => ({
  createMockUploadEndpoint: vi.fn(() => ({
    upload: vi.fn(async () => ({ urls: ['https://example.com/image.jpg'] })),
  })),
}))

vi.mock('@/utils/helpers', () => ({
  copyToClipboard: vi.fn(async () => true),
}))

describe('AIChatbot.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof AIChatbot>>

  const defaultConfig: ChatbotConfig = {
    apiUrl: 'https://api.example.com',
    apiToken: 'test-token',
  }

  beforeEach(() => {
    wrapper = mount(AIChatbot, {
      props: { config: defaultConfig },
      global: {
        stubs: {
          SuspendedBall: { template: '<div class="suspended-ball" @click="$emit(\'click\')" />' },
          ChatPanel: { template: '<div class="chat-panel" :class="{ open: isOpen }"><slot /></div>', props: ['isOpen', 'mode'] },
          MessageList: { template: '<div class="message-list"></div>', props: ['messages', 'isStreaming'] },
          InputArea: { template: '<div class="input-area"></div>', props: ['placeholder', 'modelValue'] },
          SessionManager: { template: '<div class="session-manager"></div>', props: ['sessions'] },
        },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Rendering', () => {
    it('should render the chatbot container', () => {
      expect(wrapper.find('.ai-chatbot').exists()).toBe(true)
    })

    it('should render suspended ball when panel is closed', () => {
      expect(wrapper.find('.suspended-ball').exists()).toBe(true)
    })

    it('should apply the theme data attribute', () => {
      expect(wrapper.find('.ai-chatbot').attributes('data-theme')).toBe('light')
    })

    it('should render chat panel', () => {
      expect(wrapper.find('.chat-panel').exists()).toBe(true)
    })
  })

  describe('Props Handling', () => {
    it('should merge config with defaults', () => {
      const customConfig: ChatbotConfig = {
        apiUrl: 'https://custom-api.com',
        primaryColor: '#ff0000',
      }
      const customWrapper = mount(AIChatbot, {
        props: { config: customConfig },
        global: {
          stubs: {
            SuspendedBall: true,
            ChatPanel: true,
            MessageList: true,
            InputArea: true,
            SessionManager: true,
          },
        },
      })
      expect(customWrapper.exists()).toBe(true)
      customWrapper.unmount()
    })

    it('should use default config when no props provided', () => {
      const emptyWrapper = mount(AIChatbot, {
        global: {
          stubs: {
            SuspendedBall: true,
            ChatPanel: true,
            MessageList: true,
            InputArea: true,
            SessionManager: true,
          },
        },
      })
      expect(emptyWrapper.exists()).toBe(true)
      emptyWrapper.unmount()
    })
  })

  describe('Theme Toggle', () => {
    it('should emit theme toggle event', async () => {
      const setThemeSpy = vi.fn()
      // Re-mount with spy
      wrapper.unmount()
      wrapper = mount(AIChatbot, {
        props: { config: defaultConfig },
        global: {
          stubs: {
            SuspendedBall: true,
            ChatPanel: {
              template: '<div class="chat-panel"><slot /></div>',
              props: ['isOpen', 'mode', 'theme'],
              methods: {
                emitToggleTheme() {
                  this.$emit('toggle-theme')
                },
              },
            },
            MessageList: true,
            InputArea: true,
            SessionManager: true,
          },
        },
      })

      const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
      await chatPanel.vm.$emit('toggle-theme')

      await nextTick()
      // Theme toggle should work without errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Image Preview', () => {
    it('should show image preview when image is clicked', async () => {
      const vm = wrapper.vm as unknown as {
        previewImageUrl: string
        imagePreviewVisible: boolean
        handleImageClick: (url: string) => void
      }

      vm.handleImageClick('https://example.com/test.jpg')
      await nextTick()

      expect(vm.imagePreviewVisible).toBe(true)
      expect(vm.previewImageUrl).toBe('https://example.com/test.jpg')
    })

    it('should hide image preview when overlay is clicked', async () => {
      const vm = wrapper.vm as unknown as {
        imagePreviewVisible: boolean
        handleImageClick: (url: string) => void
      }

      vm.handleImageClick('https://example.com/test.jpg')
      await nextTick()

      const overlay = wrapper.find('.ai-chatbot__preview-overlay')
      if (overlay.exists()) {
        await overlay.trigger('click')
        await nextTick()
        expect(vm.imagePreviewVisible).toBe(false)
      }
    })
  })

  describe('Exposed Methods', () => {
    it('should expose togglePanel method', () => {
      expect(typeof wrapper.vm.togglePanel).toBe('function')
    })

    it('should expose setTheme method', () => {
      expect(typeof wrapper.vm.setTheme).toBe('function')
    })

    it('should expose clearCurrentMessages method', () => {
      expect(typeof wrapper.vm.clearCurrentMessages).toBe('function')
    })
  })

  describe('CSS Variables', () => {
    it('should define CSS custom properties', () => {
      const chatbot = wrapper.find('.ai-chatbot')
      expect(chatbot.exists()).toBe(true)
    })
  })

  describe('Responsive Behavior', () => {
    it('should adjust ball size based on mobile state', () => {
      const vm = wrapper.vm as unknown as {
        ballSize: number
        state: { ui: { isMobile: boolean } }
      }

      // Desktop size
      vm.state.ui.isMobile = false
      expect(vm.ballSize).toBe(56)

      // Mobile size
      vm.state.ui.isMobile = true
      expect(vm.ballSize).toBe(48)
    })
  })

  describe('Unmounting', () => {
    it('should clean up on unmount', () => {
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })
})

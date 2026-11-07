/**
 * Tests for AIChatbot mode-specific rendering behavior
 * Ensures each mode (extended, floating, sidebar) renders correctly
 * These tests specifically prevent regression of the sidebar mode
 * "历史对话" button missing bug.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatbot from '@/components/AIChatbot.vue'
import ChatPanel from '@/components/ChatPanel.vue'

// Mock useApiClient to avoid real API calls
vi.mock('@/composables/useApiClient', () => ({
  useApiClient: () => ({
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { type: 'token', content: 'test' }
      yield { type: 'end' }
    }),
    getSessionMessages: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({ sessionId: 'new-session' }),
  }),
}))

describe('AIChatbot Mode Rendering', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('ChatPanel wrapper vs direct rendering', () => {
    it('should render AIChatbot directly without ChatPanel for floating mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'floating', apiBaseUrl: '/api' } },
        global: { stubs: { SuspendedBall: true, DraggableWindow: true, ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true } },
      })

      // Floating mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should render AIChatbot directly without ChatPanel for extended mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true } },
      })

      // Extended mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should wrap content in ChatPanel for sidebar mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(true)
    })
  })

  describe('ChatPanel header visibility', () => {
    it('should hide ChatPanel header for sidebar mode (inner ChatHeader handles navigation)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      const chatPanel = wrapper.findComponent(ChatPanel)
      expect(chatPanel.exists()).toBe(true)
      // ChatPanel's own header should be hidden - inner ChatHeader provides navigation
      expect(chatPanel.props('showHeader')).toBe(false)
    })

  })

  describe('ChatHeader rendering for session navigation', () => {
    it('should render ChatHeader for extended mode (dual layout)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode renders ChatHeader (dual layout shows it alongside sidebar)
      const chatHeader = wrapper.findAll('[class*="chat-header"]').length
      expect(chatHeader).toBeGreaterThanOrEqual(1)
    })
  })

  describe('layout assignment', () => {
    it('should assign dual layout for extended mode', () => {
      // Verify by checking that both session sidebar and chat area would be needed
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode should have sidebar container
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(true)
    })

    it('should use single layout for sidebar mode (view-based switching)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should NOT have sidebar container (uses single layout)
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(false)
    })
  })
})

describe('AIChatbot clear-all integration', () => {
  it('clears messages, emits messages:cleared and calls onClearMessages after confirmation', async () => {
    const onClearMessages = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          enableClearAll: true,
          callbacks: { onClearMessages },
        },
      },
      global: {
        stubs: {
          Teleport: true,
          SuspendedBall: true,
          ChatContent: true,
          TopicListView: true,
          TopicSearch: true,
          TopicActionMenu: true,
          FilePreviewModal: true,
        },
      },
    })
    await nextTick()

    const clearBtn = wrapper.find('.chat-header__clear')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')

    const confirmBtn = wrapper.find('.confirm-dialog__btn--confirm')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')
    await nextTick()

    expect(wrapper.emitted('messages:cleared')).toHaveLength(1)
    expect(onClearMessages).toHaveBeenCalledTimes(1)
  })
})

describe('AIChatbot upload-limit raw passthrough (default fallbacks intact)', () => {
  it('leaves upload-limit fields undefined so ChatInput defaults apply', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const input = wrapper.findComponent({ name: 'ChatInput' })
    expect(input.props('allowedImageTypes')).toBeUndefined()
    expect(input.props('maxImageSize')).toBeUndefined()
    expect(input.props('maxImageCount')).toBeUndefined()
    expect(input.props('enableUpload')).toBe(true)
  })

  it('still forwards host-provided upload limits', async () => {
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          allowedImageTypes: ['image/png'],
          maxImageSize: 2048,
          maxImageCount: 2,
        },
      },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const input = wrapper.findComponent({ name: 'ChatInput' })
    expect(input.props('allowedImageTypes')).toEqual(['image/png'])
    expect(input.props('maxImageSize')).toBe(2048)
    expect(input.props('maxImageCount')).toBe(2)
  })
})

describe('AIChatbot clear-all callback error handling', () => {
  it('surfaces onClearMessages rejection as chatbot:error', async () => {
    const onClearMessages = vi.fn().mockRejectedValue(new Error('backend down'))
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          enableClearAll: true,
          callbacks: { onClearMessages },
        },
      },
      global: {
        stubs: {
          Teleport: true,
          SuspendedBall: true,
          ChatContent: true,
          TopicListView: true,
          TopicSearch: true,
          TopicActionMenu: true,
          FilePreviewModal: true,
        },
      },
    })
    await nextTick()

    await wrapper.find('.chat-header__clear').trigger('click')
    await wrapper.find('.confirm-dialog__btn--confirm').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()

    const errors = (wrapper.emitted('chatbot:error') ?? []).map(
      (e) => (e[0] as { error: { userMessage: string } }).error.userMessage
    )
    expect(errors).toContain('Failed to clear messages')
  })
})

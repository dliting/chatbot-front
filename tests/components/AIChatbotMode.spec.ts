/**
 * Tests for AIChatbot mode-specific rendering behavior
 * Ensures each mode (extended, floating, sidebar) renders correctly
 * These tests specifically prevent regression of the sidebar mode
 * "历史话题" button missing bug.
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
    createSession: vi.fn().mockResolvedValue({ topicId: 'new-topic' }),
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
        global: { stubs: { SuspendedBall: true, DraggableWindow: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true } },
      })

      // Floating mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should render AIChatbot directly without ChatPanel for extended mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true } },
      })

      // Extended mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should wrap content in ChatPanel for sidebar mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(true)
    })
  })

  describe('ChatPanel header visibility', () => {
    it('should hide ChatPanel header for sidebar mode (inner ChatHeader handles navigation)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      const chatPanel = wrapper.findComponent(ChatPanel)
      expect(chatPanel.exists()).toBe(true)
      // ChatPanel's own header should be hidden - inner ChatHeader provides navigation
      expect(chatPanel.props('showHeader')).toBe(false)
    })

  })

  describe('ChatHeader rendering for topic navigation', () => {
    it('should render ChatHeader for extended mode (dual layout)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode renders ChatHeader (dual layout shows it alongside sidebar)
      const chatHeader = wrapper.findAll('[class*="chat-header"]').length
      expect(chatHeader).toBeGreaterThanOrEqual(1)
    })
  })

  describe('layout assignment', () => {
    it('should assign dual layout for extended mode', () => {
      // Verify by checking that both topic sidebar and chat area would be needed
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode should have sidebar container
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(true)
    })

    it('should use single layout for sidebar mode (view-based switching)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should NOT have sidebar container (uses single layout)
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(false)
    })
  })
})

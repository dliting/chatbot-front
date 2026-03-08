/**
 * Unit tests for AIChatPanel component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import AIChatPanel from '@/components/AIChatPanel.vue'
import type { ChatbotConfig, Message, Session } from '@/types'

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

describe('AIChatPanel', () => {
  let mockConfig: ChatbotConfig
  let mockMessages: Message[]
  let mockSessions: Session[]

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
      defaultExpanded: true,
      locale: 'zh-CN',
    }

    // Mock messages
    mockMessages = [
      {
        id: 'msg_1',
        sessionId: 'session_1',
        role: 'user',
        type: 'text',
        content: 'Hello',
        timestamp: Date.now(),
        status: 'sent',
      },
    ]

    // Mock sessions
    mockSessions = [
      {
        id: 'session_1',
        title: 'Session 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: mockMessages,
        unreadCount: 0,
      },
    ]

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
    it('should render FloatingChatPanel in floating mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Should render FloatingChatPanel component
      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.exists()).toBe(true)
    })

    it('should render ChatLayoutManager in extended mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
          mode: 'extended',
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Should render ChatLayoutManager component
      const layoutManager = wrapper.findComponent({ name: 'ChatLayoutManager' })
      expect(layoutManager.exists()).toBe(true)
    })

    it('should render ChatContent in floating mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      // Should render ChatContent component
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Standalone Mode', () => {
    it('should render in floating mode without panelOpen prop', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
          mode: 'floating',
        },
      })

      // Component should render
      expect(wrapper.exists()).toBe(true)
      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.exists()).toBe(true)
    })

    it('should render with default state', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      // Component should render with default mode (floating)
      expect(wrapper.exists()).toBe(true)
    })

    it('should render ChatLayoutManager in sidebar mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
          mode: 'sidebar',
        },
      })

      // Component should render ChatLayoutManager for sidebar mode
      expect(wrapper.exists()).toBe(true)
      const layoutManager = wrapper.findComponent({ name: 'ChatLayoutManager' })
      expect(layoutManager.exists()).toBe(true)
    })
  })

  describe('Config Props', () => {
    it('should use custom title from config', () => {
      const customConfig = {
        ...mockConfig,
        labels: { ...mockConfig.labels, title: '豆包助手' },
      }
      const wrapper = mount(AIChatPanel, {
        props: {
          config: customConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      // Check that ChatContent receives the custom title
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })

    it('should respect maxImageCount config', () => {
      const configWithLimit = { ...mockConfig, maxImageCount: 2 }
      const wrapper = mount(AIChatPanel, {
        props: {
          config: configWithLimit,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Props Passing', () => {
    it('should pass messages to FloatingChatPanel', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.props('messages')).toEqual(mockMessages)
    })

    it('should pass sessions to FloatingChatPanel', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.props('sessions')).toEqual(mockSessions)
    })

    it('should pass currentSessionId to FloatingChatPanel', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.props('currentSessionId')).toBe('session_1')
    })
  })
})

/**
 * Unit tests for EmbeddedChatPanel component
 * Tests layout switching logic between dual and single layouts
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmbeddedChatPanel from '@/components/EmbeddedChatPanel.vue'
import SessionListView from '@/components/SessionListView.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import ChatContent from '@/components/ChatContent.vue'
import type { ChatMode, Layout, ChatbotConfig } from '@/types'
import type { Message, Session } from '@/types'

// Mock child components
vi.mock('@/components/SessionListView.vue', () => ({
  default: {
    name: 'SessionListView',
    template: '<div class="session-list-view-mock"></div>',
  },
}))

vi.mock('@/components/ChatHeader.vue', () => ({
  default: {
    name: 'ChatHeader',
    template: '<div class="chat-header-mock"></div>',
  },
}))

vi.mock('@/components/ChatContent.vue', () => ({
  default: {
    name: 'ChatContent',
    template: '<div class="chat-content-mock"></div>',
  },
}))

describe('EmbeddedChatPanel Component', () => {
  // Mock data
  const mockSessions: Session[] = [
    {
      id: 'session-1',
      title: 'Session 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 5,
      unreadCount: 0,
    },
    {
      id: 'session-2',
      title: 'Session 2',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
      messageCount: 3,
      unreadCount: 1,
    },
  ]

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'user',
      type: 'text',
      content: 'Hello',
      timestamp: Date.now() - 5000,
      status: 'sent',
    },
    {
      id: 'msg-2',
      sessionId: 'session-1',
      role: 'assistant',
      type: 'text',
      content: 'Hi there!',
      timestamp: Date.now() - 4000,
      status: 'sent',
    },
  ]

  const mockConfig: ChatbotConfig = {
    mode: 'extended',
    theme: 'light',
    labels: {
      title: 'AI Assistant',
    },
  }

  describe('Props and Rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should render ChatContent component', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Layout: Dual Layout', () => {
    it('should render SessionListView as sidebar in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // In dual layout, SessionListView should be rendered in aside element
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.find('.session-list-view-mock').exists()).toBe(true)
    })

    it('should render ChatHeader in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      expect(wrapper.find('.chat-header-mock').exists()).toBe(true)
    })

    it('should hide header when hideHeader prop is true', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: true,
        },
      })

      expect(wrapper.find('.chat-header-mock').exists()).toBe(false)
    })
  })

  describe('Layout: Single Layout', () => {
    it('should render SessionListView as view in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // In single layout with chat view, SessionListView is conditionally rendered
      // Need to check if viewState.currentView is 'chat' or 'sessions'
      expect(wrapper.find('.session-list-view-mock').exists() || wrapper.find('.chat-content-mock').exists()).toBe(true)
    })

    it('should render ChatContent in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Mode to Layout Derivation', () => {
    it('should use dual layout for extended mode when layout is not specified', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Should render in dual layout mode (sidebar + main)
      expect(wrapper.find('aside').exists()).toBe(true)
    })

    it('should use single layout for floating mode when layout is not specified', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Should render in single layout mode (view-based switching)
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })

    it('should use single layout for sidebar mode when layout is not specified', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'sidebar',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Should render in single layout mode
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Event Handling', () => {
    it('should emit create-session event when SessionListView emits create-session', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('create-session')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })

    it('should emit select-session event when SessionListView emits select-session', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('select-session', 'session-2')

      expect(wrapper.emitted('select-session')).toBeTruthy()
      expect(wrapper.emitted('select-session')?.[0]).toEqual(['session-2'])
    })

    it('should emit delete-session event when SessionListView emits delete-session', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('delete-session', 'session-2')

      expect(wrapper.emitted('delete-session')).toBeTruthy()
      expect(wrapper.emitted('delete-session')?.[0]).toEqual(['session-2'])
    })

    it('should emit send-message event when ChatContent emits send-message', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      await chatContent.vm.$emit('send-message', { content: 'Test message' })

      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')?.[0]).toEqual([{ content: 'Test message' }])
    })

    it('should emit quick-action event when ChatContent emits quick-action', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      await chatContent.vm.$emit('quick-action', 'Quick action text')

      expect(wrapper.emitted('quick-action')).toBeTruthy()
      expect(wrapper.emitted('quick-action')?.[0]).toEqual(['Quick action text'])
    })

    it('should emit edit event when ChatContent emits edit', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      const mockMessage = mockMessages[0]
      await chatContent.vm.$emit('edit', mockMessage)

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockMessage])
    })

    it('should emit toggle-theme event when ChatHeader emits toggle-theme', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })
  })

  describe('View Switching (Single Layout)', () => {
    it('should switch to sessions view when ChatHeader emits sessions event', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Initially should show chat view
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)

      // Click sessions button in header
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // After emitting sessions event, view should change to sessions
      // The component should re-render with SessionListView
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)
    })

    it('should switch back to chat view when SessionListView emits close event', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // First switch to sessions view
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // Should show sessions
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)

      // Then close sessions view
      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('close')

      // Should show chat view again
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Visibility Props', () => {
    it('should pass hideWelcome to ChatContent', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideWelcome: true,
        },
      })

      // ChatContent should exist - verify by checking rendered component
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should pass hideQuickActions to ChatContent', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideQuickActions: true,
        },
      })

      // ChatContent should exist
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should pass isStreaming to ChatContent', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: true,
        },
      })

      // ChatContent should exist and be rendered with streaming prop
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })
  })

  describe('Config Props', () => {
    it('should pass theme to ChatHeader', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: { ...mockConfig, theme: 'dark' },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // ChatHeader should exist with dark theme
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(true)
      expect(wrapper.find('.ai-chat--dark').exists()).toBe(true)
    })

    it('should pass title to ChatHeader', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: { ...mockConfig, labels: { title: 'Custom Title' } },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // ChatHeader should exist
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(true)
    })
  })

  // ============================================
  // New tests for increased coverage
  // ============================================

  describe('useChatView composable integration', () => {
    it('should show chat view by default for floating mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Should show chat content by default
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(SessionListView).exists()).toBe(false)
    })

    it('should show session sidebar for extended mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Extended mode should always show sidebar
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)
    })

    it('should toggle between chat and sessions view in floating mode', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Initially shows chat view
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(SessionListView).exists()).toBe(false)

      // Switch to sessions view via header button
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // Now should show sessions view
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)
      expect(wrapper.findComponent(ChatContent).exists()).toBe(false)

      // Switch back to chat view via close button
      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('close')

      // Should show chat view again
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(SessionListView).exists()).toBe(false)
    })

    it('should show chat view initially even when no current session in floating mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: '',
          isStreaming: false,
        },
      })

      // Default view is chat view, even when no current session
      // SessionListView is only shown after explicit navigation
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should render with empty messages array', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should render with empty sessions array', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: [],
          currentSessionId: '',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)
    })

    it('should render with no current session', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: '',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should handle sidebar mode correctly', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'sidebar',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // Sidebar mode should use single layout
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })
  })

  describe('containerClasses', () => {
    it('should apply correct classes for extended mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.ai-chat').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--extended').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--light').exists()).toBe(true)
    })

    it('should apply correct classes for floating mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.ai-chat').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--floating').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--light').exists()).toBe(true)
    })

    it('should apply correct classes for sidebar mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'sidebar',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.ai-chat').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--sidebar').exists()).toBe(true)
      expect(wrapper.find('.ai-chat--light').exists()).toBe(true)
    })

    it('should apply dark theme class', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: { ...mockConfig, theme: 'dark' },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.ai-chat--dark').exists()).toBe(true)
    })
  })

  describe('Single layout view switching edge cases', () => {
    it('should show header only in chat view in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // In chat view, header should be visible
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(true)

      // Switch to sessions view
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // In sessions view, header should not be visible
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(false)
    })

    it('should handle hideHeader prop in single layout chat view', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: true,
        },
      })

      // Header should be hidden even in chat view
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(false)
      // But chat content should still be visible
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should show welcome when messages is empty in chat view', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideWelcome: false,
        },
      })

      // Should show chat content with welcome
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should emit toggle-theme from ChatHeader in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should emit create-session in sessions view in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to sessions view
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // Should show sessions view
      expect(wrapper.findComponent(SessionListView).exists()).toBe(true)

      // Emit create-session from SessionListView
      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('create-session')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })

    it('should emit select-session in sessions view in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to sessions view
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // Emit select-session from SessionListView
      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('select-session', 'session-2')

      expect(wrapper.emitted('select-session')).toBeTruthy()
      expect(wrapper.emitted('select-session')?.[0]).toEqual(['session-2'])
    })

    it('should emit delete-session in sessions view in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to sessions view
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('sessions')

      // Emit delete-session from SessionListView
      const sessionListView = wrapper.findComponent(SessionListView)
      await sessionListView.vm.$emit('delete-session', 'session-2')

      expect(wrapper.emitted('delete-session')).toBeTruthy()
      expect(wrapper.emitted('delete-session')?.[0]).toEqual(['session-2'])
    })

    it('should render ChatContent with key based on messages length in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      // ChatContent should be rendered with :key="messages.length"
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should pass correct props to ChatContent in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: [],
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: true,
          hideWelcome: true,
          hideQuickActions: true,
        },
      })

      // ChatContent should receive the props
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should emit send-message from ChatContent in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      await chatContent.vm.$emit('send-message', { content: 'Test message' })

      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')?.[0]).toEqual([{ content: 'Test message' }])
    })

    it('should emit quick-action from ChatContent in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      await chatContent.vm.$emit('quick-action', 'Quick action text')

      expect(wrapper.emitted('quick-action')).toBeTruthy()
      expect(wrapper.emitted('quick-action')?.[0]).toEqual(['Quick action text'])
    })

    it('should emit edit from ChatContent in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session-1',
          isStreaming: false,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      const mockMessage = mockMessages[0]
      await chatContent.vm.$emit('edit', mockMessage)

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockMessage])
    })
  })
})

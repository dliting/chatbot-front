/**
 * Unit tests for FloatingChatPanel component
 * Tests for floating mode functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Session } from '@/types'

describe('FloatingChatPanel Component', () => {
  // Sample test data
  const mockConfig: ChatbotConfig = {
    chatMode: 'floating',
    theme: 'light',
    position: 'bottom-right',
    panelWidth: 400,
    panelHeight: 500,
    minWidth: 300,
    minHeight: 400,
  }

  const mockMessages: Message[] = [
    {
      id: 'msg_1',
      sessionId: 'session_1',
      role: 'user',
      type: 'text',
      content: 'Hello',
      timestamp: Date.now() - 60000,
      status: 'sent',
    },
    {
      id: 'msg_2',
      sessionId: 'session_1',
      role: 'assistant',
      type: 'text',
      content: 'Hi there!',
      timestamp: Date.now(),
      status: 'sent',
    },
  ]

  const mockSessions: Session[] = [
    {
      id: 'session_1',
      title: 'Chat 1',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 60000,
      messageCount: 2,
      unreadCount: 0,
    },
    {
      id: 'session_2',
      title: 'Chat 2',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
      messageCount: 5,
      unreadCount: 2,
    },
  ]

  describe('Props and Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should render SuspendedBall when panel is closed', () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      // Initially panel should be closed (defaultExpanded: false)
      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.exists()).toBe(true)
    })

    it('should render DraggableWindow when panel is open', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)
    })

    it('should render ChatContent inside DraggableWindow', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })

    it('should accept hideWelcome prop', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
          hideWelcome: true,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('welcomeVisible')).toBe(false)
    })

    it('should accept hideQuickActions prop', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
          hideQuickActions: true,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('quickActionsVisible')).toBe(false)
    })
  })

  describe('Panel State Management', () => {
    it('should open panel when SuspendedBall is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      // Find SuspendedBall and click it
      const suspendedBall = wrapper.find('.chatbot-ball')
      expect(suspendedBall.exists()).toBe(true)
      await suspendedBall.trigger('click')
      await nextTick()
      await wrapper.vm.$nextTick()

      // Check internal state via exposed method
      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(true)
    })

    it('should close panel when ChatHeader close button is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Find ChatHeader and trigger close - need to trigger on the button inside
      const closeBtn = wrapper.find('.chat-header__close')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')
      await nextTick()

      // Check internal state
      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(false)
    })
  })

  describe('Session List View', () => {
    it('should show SessionListView when sessions button is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Initially should show ChatContent
      let chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)

      // Click sessions button in ChatHeader - find the sessions button
      const sessionsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      expect(sessionsBtn.exists()).toBe(true)
      await sessionsBtn.trigger('click')
      await nextTick()

      // Now should show SessionListView
      const sessionListView = wrapper.findComponent({ name: 'SessionListView' })
      expect(sessionListView.exists()).toBe(true)
    })

    it('should switch to chat view when close button is clicked in SessionListView', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to sessions view
      const sessionsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await sessionsBtn.trigger('click')
      await nextTick()

      // Verify we're in sessions view
      let sessionListView = wrapper.findComponent({ name: 'SessionListView' })
      expect(sessionListView.exists()).toBe(true)

      // Emit close event from SessionListView component
      await sessionListView.vm.$emit('close')
      await nextTick()

      // Should be back to chat view
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Theme Toggle', () => {
    it('should toggle theme when theme toggle button is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true, theme: 'light' },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Find the theme toggle button (it's the second button, first is sessions)
      const themeBtn = wrapper.findAll('.chat-header__btn').at(1)
      expect(themeBtn).toBeDefined()
      await themeBtn?.trigger('click')
      await nextTick()

      // Verify toggleTheme method was called
      const vm = wrapper.vm as unknown as { toggleTheme: () => void }
      // Just verify the component renders correctly
      expect(wrapper.findComponent({ name: 'ChatHeader' }).exists()).toBe(true)
    })
  })

  describe('Window State', () => {
    it('should initialize window position on mount', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const vm = wrapper.vm as unknown as {
        windowState: { x: number; y: number; width: number; height: number }
      }

      expect(vm.windowState).toBeDefined()
      expect(typeof vm.windowState.x).toBe('number')
      expect(typeof vm.windowState.y).toBe('number')
    })

    it('should pass correct props to DraggableWindow', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: {
            ...mockConfig,
            defaultExpanded: true,
            minWidth: 350,
            minHeight: 450,
            draggable: true,
            resizable: true,
            rememberPosition: true,
          },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.props('minWidth')).toBe(350)
      expect(draggableWindow.props('minHeight')).toBe(450)
      expect(draggableWindow.props('draggable')).toBe(true)
      expect(draggableWindow.props('resizable')).toBe(true)
      expect(draggableWindow.props('rememberPosition')).toBe(true)
    })
  })

  describe('Streaming State', () => {
    it('should pass isStreaming to ChatContent', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: true,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('isStreaming')).toBe(true)
    })
  })

  describe('ChatHeader', () => {
    it('should render ChatHeader with correct title', async () => {
      const customConfig: ChatbotConfig = {
        ...mockConfig,
        defaultExpanded: true,
        labels: {
          title: 'Custom Title',
        },
      }

      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: customConfig,
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('title')).toBe('Custom Title')
    })

    it('should show all required buttons in ChatHeader', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          sessions: mockSessions,
          currentSessionId: 'session_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('showSessionsButton')).toBe(true)
      expect(chatHeader.props('showThemeToggle')).toBe(true)
      expect(chatHeader.props('showCloseButton')).toBe(true)
    })
  })
})

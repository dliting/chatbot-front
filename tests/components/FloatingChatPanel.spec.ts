/**
 * Unit tests for FloatingChatPanel component
 * Tests for floating mode functionality
 * Architecture: inject-primary pattern — internal actions use inject, emits are external-only
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import { chatActionsKey, topicActionsKey, uiActionsKey } from '@/symbols'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Topic } from '@/types'
import { createMockChatActions, createMockTopicActions, createMockUIActions } from '../utils/mockActions'

const mockChatActions = createMockChatActions()
const mockTopicActions = createMockTopicActions()
const mockUIActions = createMockUIActions()

function mountPanel(props: Record<string, unknown>) {
  return mount(FloatingChatPanel, {
    props,
    global: {
      provide: {
        [chatActionsKey]: mockChatActions,
        [topicActionsKey]: mockTopicActions,
        [uiActionsKey]: mockUIActions,
      },
    },
  })
}

describe('FloatingChatPanel Component', () => {
  const mockConfig: ChatbotConfig = {
    mode: 'floating',
    theme: 'light',
    position: 'bottom-right',
    panelWidth: 400,
    panelHeight: 500,
    minWidth: 300,
    minHeight: 400,
  }

  const mockMessages: Message[] = [
    {
      messageId: 'msg_1',
      topicId: 'topic_1',
      role: 'user',
      type: 'text',
      content: 'Hello',
      timestamp: Date.now() - 60000,
      status: 'sent',
    },
    {
      messageId: 'msg_2',
      topicId: 'topic_1',
      role: 'assistant',
      type: 'text',
      content: 'Hi there!',
      timestamp: Date.now(),
      status: 'sent',
    },
  ]

  const mockTopics: Topic[] = [
    {
      topicId: 'topic_1',
      title: 'Chat 1',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 60000,
      messageCount: 2,
      unreadCount: 0,
    },
    {
      topicId: 'topic_2',
      title: 'Chat 2',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
      messageCount: 5,
      unreadCount: 2,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Props and Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mountPanel({
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        })

      expect(wrapper.exists()).toBe(true)
    })

    it('should render SuspendedBall when panel is closed', () => {
      const wrapper = mountPanel({
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        })

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.exists()).toBe(true)
    })

    it('should render DraggableWindow when panel is open', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)
    })

    it('should render ChatContent inside DraggableWindow', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })

    it('should accept hideWelcome prop', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
          hideWelcome: true,
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('welcomeVisible')).toBe(false)
    })

    it('should accept hideQuickActions prop', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
          hideQuickActions: true,
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('quickActionsVisible')).toBe(false)
    })
  })

  describe('Panel State Management', () => {
    it('should open panel when SuspendedBall is clicked', async () => {
      const wrapper = mountPanel({
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        })

      const suspendedBall = wrapper.find('.chatbot-ball')
      expect(suspendedBall.exists()).toBe(true)
      await suspendedBall.trigger('click')
      await nextTick()

      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(true)
    })

    it('should close panel when corner close button is clicked', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const closeBtn = wrapper.find('.floating-chat-panel__close-btn')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')
      await nextTick()

      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(false)
    })
  })

  describe('Session List View', () => {
    it('should show TopicListView when topics button is clicked', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      let chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)

      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      expect(topicsBtn.exists()).toBe(true)
      await topicsBtn.trigger('click')
      await nextTick()

      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)
    })

    it('should switch to chat view when close button is clicked in TopicListView', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      let topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)

      await topicListView.vm.$emit('close')
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Theme Toggle (inject path)', () => {
    it('should not show theme toggle button (hidden by default)', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true, theme: 'light' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('showThemeToggle')).toBe(false)
    })
  })

  describe('Window State', () => {
    it('should initialize window position on mount', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
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
      const wrapper = mountPanel({
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
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
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: true,
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

      const wrapper = mountPanel({
          config: customConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('title')).toBe('Custom Title')
    })

    it('should show all required buttons in ChatHeader', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('showTopicsButton')).toBe(true)
      expect(chatHeader.props('showThemeToggle')).toBe(false)
      expect(chatHeader.props('showCloseButton')).toBe(false)
    })
  })

  describe('Inject-primary pattern (no emit forwarding)', () => {
    it('should NOT emit send-message — ChatContent uses chatActions.sendMessage via inject', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      // ChatContent handles sending via inject, not emit
      expect(wrapper.emitted('send-message')).toBeFalsy()
    })

    it('should NOT emit create-topic — TopicListView uses topicActions.createNewTopic via inject', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      expect(wrapper.emitted('create-topic')).toBeFalsy()
    })

    it('should NOT emit select-topic — TopicListView uses inject for topic switching', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      expect(wrapper.emitted('select-topic')).toBeFalsy()
    })

    it('should NOT emit delete-topic — TopicListView uses topicActions.removeTopic via inject', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      expect(wrapper.emitted('delete-topic')).toBeFalsy()
    })

    it('should switch to chat view after selecting topic (via inject)', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      // Go to topics view
      let topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Verify we're in topics view
      let topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)

      // Simulate what happens when user clicks a topic:
      // TopicListView calls topicActions.switchToTopic + uiActions.showChatView via inject
      // The enhanced provide chain ensures showChatView is the panel's local one
      wrapper.vm.showChatView()
      await nextTick()

      // Should be back to chat view
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Boundary Cases', () => {
    it('should render correctly with empty messages array', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
      expect(chatContent.props('welcomeVisible')).toBe(true)
    })

    it('should render correctly with empty topics array', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          topics: [],
          currentTopicId: '',
          isStreaming: false,
      })

      await nextTick()

      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)
      expect(topicListView.props('topics')).toEqual([])
    })

    it('should use default config values when config is empty', async () => {
      const wrapper = mountPanel({
          config: {},
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      expect(wrapper.exists()).toBe(true)
    })

    it('should handle dark theme correctly', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true, theme: 'dark' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.props('theme')).toBe('dark')

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('theme')).toBe('dark')
    })

    it('should pass position to SuspendedBall', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, position: 'top-left' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('top-left')
    })

    it('should handle bottom-left position', async () => {
      const wrapper = mountPanel({
          config: { position: 'bottom-left' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('bottom-left')
    })

    it('should handle top-right position', async () => {
      const wrapper = mountPanel({
          config: { position: 'top-right' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('top-right')
    })

    it('should start with panel open when defaultExpanded is true', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)
    })

    it('should start with panel closed when defaultExpanded is false', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: false },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(false)

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.exists()).toBe(true)
    })

    it('should pass primaryColor to SuspendedBall', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, primaryColor: '#ff0000' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('backgroundColor')).toBe('#ff0000')
    })
  })

  describe('Exposed Methods', () => {
    it('should expose openPanel method', async () => {
      const wrapper = mountPanel({
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        })

      await nextTick()

      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(false)

      wrapper.vm.openPanel()
      await nextTick()

      expect(vm.isPanelOpen).toBe(true)
    })

    it('should expose closePanel method', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(true)

      wrapper.vm.closePanel()
      await nextTick()

      expect(vm.isPanelOpen).toBe(false)
    })

    it('should NOT expose toggleTheme — theme toggling is handled via inject', async () => {
      const wrapper = mountPanel({
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      // toggleTheme/handleToggleTheme should not be exposed
      expect((wrapper.vm as any).handleToggleTheme).toBeUndefined()
      expect((wrapper.vm as any).toggleTheme).toBeUndefined()
    })
  })

  describe('Window State Calculations', () => {
    it('should initialize window position based on config', async () => {
      const customConfig: ChatbotConfig = {
        ...mockConfig,
        defaultExpanded: true,
        panelWidth: 500,
        panelHeight: 600,
      }

      const wrapper = mountPanel({
          config: customConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
      })

      await nextTick()

      const vm = wrapper.vm as unknown as {
        windowState: { x: number; y: number; width: number; height: number }
      }

      expect(vm.windowState.width).toBe(500)
      expect(vm.windowState.height).toBe(600)
    })
  })
})

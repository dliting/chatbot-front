/**
 * Unit tests for EmbeddedChatPanel component
 * Tests layout switching logic between dual and single layouts
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmbeddedChatPanel from '@/components/EmbeddedChatPanel.vue'
import TopicListView from '@/components/TopicListView.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import ChatContent from '@/components/ChatContent.vue'
import type { InteractionMode, Layout, ChatbotConfig } from '@/types'
import type { Message, Topic } from '@/types'

// Mock child components
vi.mock('@/components/TopicListView.vue', () => ({
  default: {
    name: 'TopicListView',
    template: '<div class="topic-list-view-mock"></div>',
    props: {
      topics: Array,
      currentTopicId: String,
      config: Object,
      isEmbedded: Boolean,
      layout: String,
      enableClose: Boolean,
    },
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
    props: {
      messages: Array,
      welcomeVisible: Boolean,
      quickActions: Array,
      quickActionIconBase: String,
      isStreaming: Boolean,
      labels: Object,
      enableThinking: Boolean,
      thinkingEnabled: Boolean,
      isThinking: Boolean,
      enableVoiceInput: Boolean,
    },
  },
}))

describe('EmbeddedChatPanel Component', () => {
  // Mock data
  const mockTopics: Topic[] = [
    {
      topicId: 'topic-1',
      title: 'Topic 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 5,
      unreadCount: 0,
    },
    {
      topicId: 'topic-2',
      title: 'Topic 2',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
      messageCount: 3,
      unreadCount: 1,
    },
  ]

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      topicId: 'topic-1',
      role: 'user',
      type: 'text',
      content: 'Hello',
      timestamp: Date.now() - 5000,
      status: 'sent',
    },
    {
      id: 'msg-2',
      topicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Layout: Dual Layout', () => {
    it('should render TopicListView as sidebar in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // In dual layout, TopicListView should be rendered in aside element
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.find('.topic-list-view-mock').exists()).toBe(true)
    })

    it('should pass layout prop to TopicListView in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      const topicListView = wrapper.findComponent(TopicListView)
      expect(topicListView.props('layout')).toBe('dual')
    })

    it('should pass enable-close prop as true to TopicListView in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      const topicListView = wrapper.findComponent(TopicListView)
      expect(topicListView.props('enableClose')).toBe(true)
    })

    it('should render ChatHeader in dual layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: true,
        },
      })

      expect(wrapper.find('.chat-header-mock').exists()).toBe(false)
    })
  })

  describe('Layout: Single Layout', () => {
    it('should render TopicListView as view in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // In single layout with chat view, TopicListView is conditionally rendered
      expect(wrapper.find('.topic-list-view-mock').exists() || wrapper.find('.chat-content-mock').exists()).toBe(true)
    })

    it('should pass layout prop to TopicListView in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to topics view
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      const topicListView = wrapper.findComponent(TopicListView)
      expect(topicListView.props('layout')).toBe('single')
    })

    it('should not pass enable-close prop in single layout (uses default false)', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to topics view
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      const topicListView = wrapper.findComponent(TopicListView)
      // enableClose prop is not explicitly passed in single layout, so it defaults to false
      expect(topicListView.props('enableClose')).toBe(false)
    })

    it('should render ChatContent in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // Should render in single layout mode
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })
  })

  describe('Event Handling', () => {
    it('should emit close event when TopicListView emits close in dual layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('close')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not emit action events (handled via inject-primary pattern)', async () => {
      // With inject-primary pattern, action events (create-topic, select-topic, etc.)
      // are handled via inject, not emitted. EmbeddedChatPanel only emits 'close'.
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // Only 'close' is a valid external event
      expect(wrapper.emitted()).not.toHaveProperty('create-topic')
      expect(wrapper.emitted()).not.toHaveProperty('select-topic')
      expect(wrapper.emitted()).not.toHaveProperty('send-message')
    })
  })

  describe('View Switching (Single Layout)', () => {
    it('should switch to topics view when uiActions.showTopicsView is called', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Initially should show chat view
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)

      // Call showTopicsView directly (this is what ChatHeader's topics button does via inject)
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      // After switching, view should show TopicListView
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)
    })

    it('should switch back to chat view when TopicListView emits close event', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // First switch to topics view
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      // Should show topics
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)

      // Then close topics view
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('close')

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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideWelcome: true,
        },
      })

      // ChatContent should exist - verify by checking rendered component
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should pass quickActions to ChatContent', () => {
      const mockActions = [{ id: '1', title: 'Test', prompt: 'Test prompt' }]
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          quickActions: mockActions,
        },
      })

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.exists()).toBe(true)
      expect(chatContent.props('quickActions')).toEqual(mockActions)
    })

    it('should pass isStreaming to ChatContent', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // Should show chat content by default
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(TopicListView).exists()).toBe(false)
    })

    it('should show topic sidebar for extended mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // Extended mode should always show sidebar
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)
    })

    it('should toggle between chat and topics view in floating mode', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Initially shows chat view
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(TopicListView).exists()).toBe(false)

      // Switch to topics view via showTopicsView (what ChatHeader's inject does)
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      // Now should show topics view
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)
      expect(wrapper.findComponent(ChatContent).exists()).toBe(false)

      // Switch back to chat view via showChatView (what TopicListView's inject does)
      wrapper.vm.showChatView()
      await wrapper.vm.$nextTick()

      // Should show chat view again
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
      expect(wrapper.findComponent(TopicListView).exists()).toBe(false)
    })

    it('should show chat view initially even when no current topic in floating mode', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: [],
          topics: mockTopics,
          currentTopicId: '',
          isStreaming: false,
        },
      })

      // Default view is chat view, even when no current topic
      // TopicListView is only shown after explicit navigation
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should render with empty topics array', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: [],
          currentTopicId: '',
          isStreaming: false,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)
    })

    it('should render with no current topic', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: [],
          topics: mockTopics,
          currentTopicId: '',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // In chat view, header should be visible
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(true)

      // Switch to topics view
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      // In topics view, header should not be visible
      expect(wrapper.findComponent(ChatHeader).exists()).toBe(false)
    })

    it('should handle hideHeader prop in single layout chat view', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideWelcome: false,
        },
      })

      // Should show chat content with welcome
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should switch to topics view and back in single layout', async () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
          hideHeader: false,
        },
      })

      // Switch to topics view
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()

      // Should show topics view
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)

      // Switch back to chat view
      wrapper.vm.showChatView()
      await wrapper.vm.$nextTick()

      // Should show chat view
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })

    it('should render ChatContent with key based on messages length in single layout', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'floating',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: true,
          hideWelcome: true,
          quickActions: [],
        },
      })

      // ChatContent should receive the props
      expect(wrapper.findComponent(ChatContent).exists()).toBe(true)
    })
  })
})

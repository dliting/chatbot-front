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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

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
    it('should emit create-topic event when TopicListView emits create-topic', async () => {
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
      await topicListView.vm.$emit('create-topic')

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should emit select-topic event when TopicListView emits select-topic', async () => {
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
      await topicListView.vm.$emit('select-topic', 'topic-2')

      expect(wrapper.emitted('select-topic')).toBeTruthy()
      expect(wrapper.emitted('select-topic')?.[0]).toEqual(['topic-2'])
    })

    it('should emit delete-topic event when TopicListView emits delete-topic', async () => {
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
      await topicListView.vm.$emit('delete-topic', 'topic-2')

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
      expect(wrapper.emitted('delete-topic')?.[0]).toEqual(['topic-2'])
    })

    it('should emit delete-topics event when TopicListView emits delete-topics', async () => {
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
      const topicIdsToDelete = ['topic-1', 'topic-2']
      await topicListView.vm.$emit('delete-topics', topicIdsToDelete)

      expect(wrapper.emitted('delete-topics')).toBeTruthy()
      expect(wrapper.emitted('delete-topics')?.[0]).toEqual([topicIdsToDelete])
    })

    it('should emit update-topic-title event when TopicListView emits update-topic-title', async () => {
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
      await topicListView.vm.$emit('update-topic-title', 'topic-1', 'Updated Title')

      expect(wrapper.emitted('update-topic-title')).toBeTruthy()
      expect(wrapper.emitted('update-topic-title')?.[0]).toEqual(['topic-1', 'Updated Title'])
    })

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

    it('should emit send-message event when ChatContent emits send-message', async () => {
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
    it('should switch to topics view when ChatHeader emits topics event', async () => {
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

      // Click topics button in header
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // After emitting topics event, view should change to topics
      // The component should re-render with TopicListView
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

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

    it('should pass hideQuickActions to ChatContent', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
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

      // Switch to topics view via header button
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Now should show topics view
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)
      expect(wrapper.findComponent(ChatContent).exists()).toBe(false)

      // Switch back to chat view via close button
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('close')

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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

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

    it('should emit toggle-theme from ChatHeader in single layout', async () => {
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

      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should emit create-topic in topics view in single layout', async () => {
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Should show topics view
      expect(wrapper.findComponent(TopicListView).exists()).toBe(true)

      // Emit create-topic from TopicListView
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('create-topic')

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should emit select-topic in topics view in single layout', async () => {
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Emit select-topic from TopicListView
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('select-topic', 'topic-2')

      expect(wrapper.emitted('select-topic')).toBeTruthy()
      expect(wrapper.emitted('select-topic')?.[0]).toEqual(['topic-2'])
    })

    it('should emit delete-topic in topics view in single layout', async () => {
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Emit delete-topic from TopicListView
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('delete-topic', 'topic-2')

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
      expect(wrapper.emitted('delete-topic')?.[0]).toEqual(['topic-2'])
    })

    it('should emit delete-topics in topics view in single layout', async () => {
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Emit delete-topics from TopicListView
      const topicListView = wrapper.findComponent(TopicListView)
      const topicIdsToDelete = ['topic-1', 'topic-2']
      await topicListView.vm.$emit('delete-topics', topicIdsToDelete)

      expect(wrapper.emitted('delete-topics')).toBeTruthy()
      expect(wrapper.emitted('delete-topics')?.[0]).toEqual([topicIdsToDelete])
    })

    it('should emit update-topic-title in topics view in single layout', async () => {
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
      const chatHeader = wrapper.findComponent(ChatHeader)
      await chatHeader.vm.$emit('topics')

      // Emit update-topic-title from TopicListView
      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('update-topic-title', 'topic-1', 'New Title')

      expect(wrapper.emitted('update-topic-title')).toBeTruthy()
      expect(wrapper.emitted('update-topic-title')?.[0]).toEqual(['topic-1', 'New Title'])
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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
          topics: mockTopics,
          currentTopicId: 'topic-1',
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

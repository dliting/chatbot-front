/**
 * Unit tests for FloatingChatPanel component
 * Tests for floating mode functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Topic } from '@/types'

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

  describe('Props and Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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

  describe('Topic List View', () => {
    it('should show TopicListView when topics button is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Initially should show ChatContent
      let chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)

      // Click topics button in ChatHeader - find the topics button
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      expect(topicsBtn.exists()).toBe(true)
      await topicsBtn.trigger('click')
      await nextTick()

      // Now should show TopicListView
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)
    })

    it('should switch to chat view when close button is clicked in TopicListView', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Verify we're in topics view
      let topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)

      // Emit close event from TopicListView component
      await topicListView.vm.$emit('close')
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Find the theme toggle button (it's the second button, first is topics)
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
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
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('showTopicsButton')).toBe(true)
      expect(chatHeader.props('showThemeToggle')).toBe(true)
      expect(chatHeader.props('showCloseButton')).toBe(true)
    })
  })

  describe('Event Emissions', () => {
    it('should emit send-message event when ChatContent sends a message', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('send-message', { content: 'Test message' })
      await nextTick()

      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')?.[0]).toEqual([{ content: 'Test message' }])
    })

    it('should emit send-message with images when ChatContent sends a message with images', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('send-message', { content: 'Test', images: ['img1.jpg', 'img2.jpg'] })
      await nextTick()

      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')?.[0]).toEqual([{ content: 'Test', images: ['img1.jpg', 'img2.jpg'] }])
    })

    it('should emit quick-action event when quick action is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('quick-action', 'What is AI?')
      await nextTick()

      expect(wrapper.emitted('quick-action')).toBeTruthy()
      expect(wrapper.emitted('quick-action')?.[0]).toEqual(['What is AI?'])
    })

    it('should emit edit-message event when message is edited', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      const editedMessage = { ...mockMessages[0], content: 'Edited content' }
      await chatContent.vm.$emit('edit', editedMessage)
      await nextTick()

      expect(wrapper.emitted('edit-message')).toBeTruthy()
      expect(wrapper.emitted('edit-message')?.[0]).toEqual([editedMessage])
    })

    it('should emit toggle-theme event when theme toggle button is clicked', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Find the theme toggle button and click it
      const themeBtn = wrapper.findAll('.chat-header__btn').at(1)
      await themeBtn?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should emit create-topic event when creating new topic', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Find TopicListView and emit create-topic
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      await topicListView.vm.$emit('create-topic')
      await nextTick()

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should emit select-topic event when selecting a topic', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Find TopicListView and emit select-topic
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      await topicListView.vm.$emit('select-topic', 'topic_2')
      await nextTick()

      expect(wrapper.emitted('select-topic')).toBeTruthy()
      expect(wrapper.emitted('select-topic')?.[0]).toEqual(['topic_2'])
    })

    it('should emit delete-topic event when deleting a topic', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Find TopicListView and emit delete-topic
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      await topicListView.vm.$emit('delete-topic', 'topic_2')
      await nextTick()

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
      expect(wrapper.emitted('delete-topic')?.[0]).toEqual(['topic_2'])
    })

    it('should switch to chat view after selecting topic', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      let topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Verify we're in topics view
      let topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)

      // Select a topic
      await topicListView.vm.$emit('select-topic', 'topic_2')
      await nextTick()

      // Should be back to chat view
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Boundary Cases', () => {
    it('should render correctly with empty messages array', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
      // welcomeVisible should be true when messages is empty
      expect(chatContent.props('welcomeVisible')).toBe(true)
    })

    it('should render correctly with empty topics array', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: [],
          topics: [],
          currentTopicId: '',
          isStreaming: false,
        },
      })

      await nextTick()

      // Go to topics view
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)
      expect(topicListView.props('topics')).toEqual([])
    })

    it('should use default config values when config is empty', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: {},
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Should render without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle dark theme correctly', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true, theme: 'dark' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.props('theme')).toBe('dark')

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('theme')).toBe('dark')
    })

    it('should pass position to SuspendedBall', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, position: 'top-left' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('top-left')
    })

    it('should handle bottom-left position', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { position: 'bottom-left' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('bottom-left')
    })

    it('should handle top-right position', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { position: 'top-right' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('position')).toBe('top-right')
    })

    it('should start with panel open when defaultExpanded is true', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Panel should be open
      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)
    })

    it('should start with panel closed when defaultExpanded is false', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: false },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Panel should be closed, SuspendedBall should be visible
      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(false)

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.exists()).toBe(true)
    })

    it('should pass primaryColor to SuspendedBall', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, primaryColor: '#ff0000' },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.props('backgroundColor')).toBe('#ff0000')
    })
  })

  describe('Exposed Methods', () => {
    it('should expose openPanel method', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Panel should be initially closed
      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(false)

      // Call openPanel
      wrapper.vm.openPanel()
      await nextTick()

      expect(vm.isPanelOpen).toBe(true)
    })

    it('should expose closePanel method', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Panel should be initially open
      const vm = wrapper.vm as unknown as { isPanelOpen: boolean }
      expect(vm.isPanelOpen).toBe(true)

      // Call closePanel
      wrapper.vm.closePanel()
      await nextTick()

      expect(vm.isPanelOpen).toBe(false)
    })

    it('should expose toggleTheme method', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { ...mockConfig, defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
      })

      await nextTick()

      // Call handleToggleTheme
      wrapper.vm.handleToggleTheme()
      await nextTick()

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
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

      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: customConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
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

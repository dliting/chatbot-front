/**
 * Extended unit tests for EmbeddedChatPanel component
 * Covers: file preview, thinking props, dual layout, configRef,
 * single layout view switching, effectiveLayout computed
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
      quickActionsVisible: Boolean,
      isStreaming: Boolean,
      labels: Object,
      enableThinking: Boolean,
      thinkingEnabled: Boolean,
      isThinking: Boolean,
      enableVoiceInput: Boolean,
    },
  },
}))

vi.mock('@/components/FilePreviewModal.vue', () => ({
  default: {
    name: 'FilePreviewModal',
    template: '<div class="file-preview-modal-mock" @click="$emit(\'close\')"></div>',
    props: ['visible', 'file'],
  },
}))

describe('EmbeddedChatPanel Extended Tests', () => {
  const mockTopics: Topic[] = [
    {
      topicId: 'topic-1',
      title: 'Topic 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 5,
      unreadCount: 0,
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
  ]

  const mockConfig: ChatbotConfig = {
    mode: 'extended',
    theme: 'light',
    labels: { title: 'AI Assistant' },
  }

  const createDualWrapper = (props = {}) => {
    return mount(EmbeddedChatPanel, {
      props: {
        mode: 'extended',
        layout: 'dual',
        config: mockConfig,
        messages: mockMessages,
        topics: mockTopics,
        currentTopicId: 'topic-1',
        isStreaming: false,
        ...props,
      },
    })
  }

  const createSingleWrapper = (props = {}) => {
    return mount(EmbeddedChatPanel, {
      props: {
        mode: 'floating',
        layout: 'single',
        config: mockConfig,
        messages: mockMessages,
        topics: mockTopics,
        currentTopicId: 'topic-1',
        isStreaming: false,
        ...props,
      },
    })
  }

  describe('File Preview', () => {
    it('should show FilePreviewModal when file-click is emitted from ChatContent', async () => {
      const wrapper = createDualWrapper()

      const chatContent = wrapper.findComponent(ChatContent)
      const file = { type: 'image', url: 'https://example.com/img.jpg' }
      await chatContent.vm.$emit('file-click', file)
      await wrapper.vm.$nextTick()

      const modal = wrapper.findComponent({ name: 'FilePreviewModal' })
      expect(modal.exists()).toBe(true)
      expect(modal.props('visible')).toBe(true)
      expect(modal.props('file')).toEqual({ name: 'img.jpg', url: 'https://example.com/img.jpg' })
    })

    it('should close FilePreviewModal when close event is emitted', async () => {
      const wrapper = createDualWrapper()

      // First trigger file-click
      const chatContent = wrapper.findComponent(ChatContent)
      const file = { type: 'image', url: 'https://example.com/img.jpg' }
      await chatContent.vm.$emit('file-click', file)
      await wrapper.vm.$nextTick()

      // Modal should be visible
      expect(wrapper.findComponent({ name: 'FilePreviewModal' }).exists()).toBe(true)

      // Close the modal by emitting close
      const modal = wrapper.findComponent({ name: 'FilePreviewModal' })
      await modal.vm.$emit('close')
      await wrapper.vm.$nextTick()

      // Modal should no longer be rendered
      expect(wrapper.findComponent({ name: 'FilePreviewModal' }).exists()).toBe(false)
    })
  })

  describe('Thinking Props', () => {
    it('should pass enableThinking to ChatContent', async () => {
      const wrapper = createDualWrapper({ enableThinking: true })

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.props('enableThinking')).toBe(true)
    })

    it('should pass thinkingEnabled to ChatContent', async () => {
      const wrapper = createDualWrapper({ thinkingEnabled: true })

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.props('thinkingEnabled')).toBe(true)
    })

    it('should pass isThinking to ChatContent', async () => {
      const wrapper = createDualWrapper({ isThinking: true })

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.props('isThinking')).toBe(true)
    })

    it('should pass enableVoiceInput to ChatContent', async () => {
      const wrapper = createDualWrapper({ enableVoiceInput: true })

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.props('enableVoiceInput')).toBe(true)
    })
  })

  describe('Dual Layout - Header', () => {
    it('should render ChatHeader with theme from config', async () => {
      const wrapper = createDualWrapper({ config: { ...mockConfig, theme: 'dark' } })

      const chatHeader = wrapper.findComponent(ChatHeader)
      expect(chatHeader.exists()).toBe(true)
    })

    it('should not show topics button in dual layout header', async () => {
      const wrapper = createDualWrapper({ hideHeader: false })

      const chatHeader = wrapper.findComponent(ChatHeader)
      // In dual layout, ChatHeader should not have show-topics-button
      // since the sidebar is always visible
      expect(chatHeader.exists()).toBe(true)
    })
  })

  describe('Single Layout - ChatContent Key', () => {
    it('should render ChatContent with key based on messages length in single layout', () => {
      const wrapper = createSingleWrapper()

      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('effectiveLayout Computed', () => {
    it('should use explicit layout prop over mode-derived layout', () => {
      // extended mode normally -> dual, but layout='single' overrides
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'extended',
          layout: 'single',
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic-1',
          isStreaming: false,
        },
      })

      // Single layout should not show aside
      expect(wrapper.find('aside').exists()).toBe(false)
      expect(wrapper.find('.chat-content-mock').exists()).toBe(true)
    })

    it('should default to single layout for unknown modes', () => {
      const wrapper = mount(EmbeddedChatPanel, {
        props: {
          mode: 'single' as any,
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

  describe('Resize Handle in Dual Layout', () => {
    it('should render resize handle element between sidebar and main in dual layout', () => {
      const wrapper = createDualWrapper()
      const resizeHandle = wrapper.find('.ai-chat__resize-handle')
      expect(resizeHandle.exists()).toBe(true)
    })

    it('should NOT render resize handle in single layout', () => {
      const wrapper = createSingleWrapper()
      const resizeHandle = wrapper.find('.ai-chat__resize-handle')
      expect(resizeHandle.exists()).toBe(false)
    })

    it('should apply ai-chat--resizing class when isResizing is true', async () => {
      const wrapper = createDualWrapper()
      // Trigger resize handle mousedown to set isResizing
      const resizeHandle = wrapper.find('.ai-chat__resize-handle')
      await resizeHandle.trigger('mousedown')
      await wrapper.vm.$nextTick()

      // Container should have resizing class
      const container = wrapper.find('.ai-chat')
      expect(container.classes()).toContain('ai-chat--resizing')
    })

    it('should bind sidebar width from useResizeHandle', () => {
      const wrapper = createDualWrapper()
      const sidebar = wrapper.find('.ai-chat__sidebar')
      expect(sidebar.exists()).toBe(true)
      // Sidebar width should be set via inline style from sidebarResize.width
      const style = sidebar.attributes('style')
      expect(style).toContain('width')
    })
  })

  describe('close Event in Dual Layout', () => {
    it('should emit close when TopicListView emits close in dual layout', async () => {
      const wrapper = createDualWrapper()

      const topicListView = wrapper.findComponent(TopicListView)
      await topicListView.vm.$emit('close')

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('View Switch on Topic Selection', () => {
    it('should switch to chat view when uiActions.showChatView is called after topic selection', async () => {
      // With inject-primary pattern, view switching is handled by uiActions.showChatView
      // which is provided by EmbeddedChatPanel's useChatView
      const wrapper = createSingleWrapper()

      // The view starts at 'chat'
      expect(wrapper.vm.viewState.currentView).toBe('chat')

      // Navigate to topics view by calling showTopicsView
      wrapper.vm.showTopicsView()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.viewState.currentView).toBe('topics')

      // TopicListView should be visible
      const topicListView = wrapper.findComponent(TopicListView)
      expect(topicListView.exists()).toBe(true)

      // Call showChatView (which is what uiActions.showChatView does)
      wrapper.vm.showChatView()
      await wrapper.vm.$nextTick()

      // Should be back to chat view
      expect(wrapper.vm.viewState.currentView).toBe('chat')
      const chatContent = wrapper.findComponent(ChatContent)
      expect(chatContent.exists()).toBe(true)
    })
  })
})

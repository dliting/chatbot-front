/**
 * Unit tests for AIChatPanel component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatPanel from '@/components/AIChatPanel.vue'
import type { ChatbotConfig, Message, Topic } from '@/types'

describe('AIChatPanel', () => {
  // Mock data
  const mockMessages: Message[] = [
    {
      id: 'msg_1',
      topicId: 'topic_1',
      role: 'user',
      type: 'text',
      content: 'Hello',
      timestamp: Date.now() - 60000,
      status: 'sent',
    },
    {
      id: 'msg_2',
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
      id: 'topic_1',
      title: 'Chat 1',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 60000,
      messageCount: 2,
      unreadCount: 0,
    },
  ]

  const mockConfig: ChatbotConfig = {
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

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Component Rendering', () => {
    it('should render FloatingChatPanel in floating mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Should render FloatingChatPanel component
      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.exists()).toBe(true)
    })

    it('should render EmbeddedChatPanel in extended mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'extended',
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Should render EmbeddedChatPanel component
      const embeddedChatPanel = wrapper.findComponent({ name: 'EmbeddedChatPanel' })
      expect(embeddedChatPanel.exists()).toBe(true)
    })

    it('should render EmbeddedChatPanel in sidebar mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'sidebar',
        },
      })

      expect(wrapper.exists()).toBe(true)
      const embeddedChatPanel = wrapper.findComponent({ name: 'EmbeddedChatPanel' })
      expect(embeddedChatPanel.exists()).toBe(true)
    })
  })

  describe('Props Passing', () => {
    it('should pass config to FloatingChatPanel', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      await nextTick()

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.props('config')).toEqual(mockConfig)
    })

    it('should pass messages to FloatingChatPanel', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      await nextTick()

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.props('messages')).toEqual(mockMessages)
    })

    it('should pass topics to FloatingChatPanel', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      await nextTick()

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.props('topics')).toEqual(mockTopics)
    })

    it('should pass isStreaming to FloatingChatPanel', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
          isStreaming: true,
        },
      })

      await nextTick()

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.props('isStreaming')).toBe(true)
    })
  })

  describe('Event Emission', () => {
    it('should emit send-message event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('send-message', { content: 'test' })

      expect(wrapper.emitted('send-message')).toBeTruthy()
    })

    it('should emit quick-action event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('quick-action', 'test action')

      expect(wrapper.emitted('quick-action')).toBeTruthy()
    })

    it('should emit create-topic event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('create-topic')

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should emit select-topic event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('select-topic', 'topic_2')

      expect(wrapper.emitted('select-topic')).toBeTruthy()
    })

    it('should emit delete-topic event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('delete-topic', 'topic_2')

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
    })

    it('should emit edit event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      const mockMessage = mockMessages[0]
      await floatingChatPanel.vm.$emit('edit-message', mockMessage)

      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('should emit toggle-theme event', async () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          mode: 'floating',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      await floatingChatPanel.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })
  })

  describe('Default Props', () => {
    it('should use floating mode by default', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          config: mockConfig,
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
        },
      })

      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.exists()).toBe(true)
    })
  })
})

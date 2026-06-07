/**
 * Extended unit tests for FloatingChatPanel component
 * Covers message operations, file preview, thinking toggle,
 * stop-generating event, config defaults, edit message event
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import { chatActionsKey, topicActionsKey, uiActionsKey } from '@/symbols'
import type { ChatbotConfig } from '@/types/config'
import type { Message, Topic } from '@/types'
import { createMockChatActions, createMockTopicActions, createMockUIActions } from '../utils/mockActions'

// Stub action handlers for injected dependencies
const mockChatActions = createMockChatActions()
const mockTopicActions = createMockTopicActions()
const mockUIActions = createMockUIActions()

const commonStubs = {
  DraggableWindow: {
    name: 'DraggableWindow',
    props: ['width', 'height', 'minWidth', 'minHeight', 'draggable', 'resizable', 'theme', 'rememberPosition', 'rounded', 'zIndex', 'modelValue'],
    template: '<div class="draggable-window-stub"><slot name="header" /><slot /></div>',
  },
  SuspendedBall: {
    name: 'SuspendedBall',
    props: ['position', 'size', 'backgroundColor', 'badge'],
    template: '<div class="suspended-ball-stub" @click="$emit(\'click\')" />',
  },
  FilePreviewModal: {
    name: 'FilePreviewModal',
    props: ['visible', 'file'],
    template: '<div class="file-preview-modal-stub" v-if="visible" @click="$emit(\'close\')" />',
  },
}

describe('FloatingChatPanel Extended Tests', () => {
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

  const mountOpenPanel = (props = {}) => {
    return mount(FloatingChatPanel, {
      props: {
        config: { ...mockConfig, defaultExpanded: true },
        messages: mockMessages,
        topics: mockTopics,
        currentTopicId: 'topic_1',
        isStreaming: false,
        ...props,
      },
      global: {
        provide: {
          [chatActionsKey as symbol]: mockChatActions,
          [topicActionsKey as symbol]: mockTopicActions,
          [uiActionsKey as symbol]: mockUIActions,
        },
        stubs: commonStubs,
      },
    })
  }

  describe('Message Operation Events', () => {
    it('should emit copy-message when ChatContent emits copy', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('copy', mockMessages[0])
      await nextTick()

      expect(wrapper.emitted('copy-message')).toBeTruthy()
      expect(wrapper.emitted('copy-message')?.[0]).toEqual([mockMessages[0]])
    })

    it('should emit refresh-message when ChatContent emits refresh', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('refresh', mockMessages[1])
      await nextTick()

      expect(wrapper.emitted('refresh-message')).toBeTruthy()
      expect(wrapper.emitted('refresh-message')?.[0]).toEqual([mockMessages[1]])
    })

    it('should emit delete-message when ChatContent emits delete', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('delete', mockMessages[0])
      await nextTick()

      expect(wrapper.emitted('delete-message')).toBeTruthy()
      expect(wrapper.emitted('delete-message')?.[0]).toEqual([mockMessages[0]])
    })
  })

  describe('Thinking and Streaming Events', () => {
    it('should emit thinking-toggle when ChatContent emits thinking-toggle', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('thinking-toggle', true)
      await nextTick()

      expect(wrapper.emitted('thinking-toggle')).toBeTruthy()
      expect(wrapper.emitted('thinking-toggle')?.[0]).toEqual([true])
    })

    it('should emit stop-generating when ChatContent emits stop-generating', async () => {
      const wrapper = mountOpenPanel({
        isStreaming: true,
      })
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      await chatContent.vm.$emit('stop-generating')
      await nextTick()

      expect(wrapper.emitted('stop-generating')).toBeTruthy()
    })

    it('should pass enableThinking prop to ChatContent', async () => {
      const wrapper = mountOpenPanel({ enableThinking: true })
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('enableThinking')).toBe(true)
    })

    it('should pass thinkingEnabled prop to ChatContent', async () => {
      const wrapper = mountOpenPanel({ thinkingEnabled: true })
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('thinkingEnabled')).toBe(true)
    })

    it('should pass isThinking prop to ChatContent', async () => {
      const wrapper = mountOpenPanel({ isThinking: true })
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('isThinking')).toBe(true)
    })

    it('should pass enableVoiceInput prop to ChatContent', async () => {
      const wrapper = mountOpenPanel({ enableVoiceInput: true })
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.props('enableVoiceInput')).toBe(true)
    })
  })

  describe('File Preview', () => {
    it('should set previewFile when ChatContent emits file-click', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      const file = { type: 'image', url: 'https://example.com/img.jpg' }
      await chatContent.vm.$emit('file-click', file)
      await nextTick()

      // Verify FilePreviewModal stub is rendered with visible=true
      const modal = wrapper.findComponent({ name: 'FilePreviewModal' })
      expect(modal.exists()).toBe(true)
      expect(modal.props('visible')).toBe(true)
    })

    it('should clear previewFile when FilePreviewModal emits close', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      const file = { type: 'image', url: 'https://example.com/img.jpg' }
      await chatContent.vm.$emit('file-click', file)
      await nextTick()

      // Modal should be visible
      const modal = wrapper.findComponent({ name: 'FilePreviewModal' })
      expect(modal.props('visible')).toBe(true)

      // Close the modal
      await modal.vm.$emit('close')
      await nextTick()

      // Modal should no longer be visible (v-if hides it)
      expect(wrapper.find('.file-preview-modal-stub').exists()).toBe(false)
    })
  })

  describe('Topic Operations', () => {
    it('should emit update-topic-title when TopicListView emits update-topic-title', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      // Switch to topics view via ChatHeader's topics button
      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      await chatHeader.vm.$emit('topics')
      await nextTick()

      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      await topicListView.vm.$emit('update-topic-title', 'topic_1', 'New Title')
      await nextTick()

      expect(wrapper.emitted('update-topic-title')).toBeTruthy()
      expect(wrapper.emitted('update-topic-title')?.[0]).toEqual(['topic_1', 'New Title'])
    })

    it('should switch to chat view after selecting a topic', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      // Switch to topics view
      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      await chatHeader.vm.$emit('topics')
      await nextTick()

      // Select a topic — should emit select-topic and show chat view
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      await topicListView.vm.$emit('select-topic', 'topic_2')
      await nextTick()

      // ChatContent should now be rendered (back in chat view)
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)

      // select-topic event should be emitted
      expect(wrapper.emitted('select-topic')).toBeTruthy()
      expect(wrapper.emitted('select-topic')?.[0]).toEqual(['topic_2'])
    })
  })

  describe('Config Defaults', () => {
    it('should render DraggableWindow when panel is open', async () => {
      const wrapper = mount(FloatingChatPanel, {
        props: {
          config: { defaultExpanded: true },
          messages: mockMessages,
          topics: mockTopics,
          currentTopicId: 'topic_1',
          isStreaming: false,
        },
        global: {
          provide: {
            [chatActionsKey as symbol]: mockChatActions,
            [topicActionsKey as symbol]: mockTopicActions,
            [uiActionsKey as symbol]: mockUIActions,
          },
          stubs: commonStubs,
        },
      })
      await nextTick()

      const draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)
    })

    it('should pass default title to ChatHeader', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatHeader = wrapper.findComponent({ name: 'ChatHeader' })
      expect(chatHeader.props('title')).toBeTruthy()
    })
  })

  describe('Edit Message Event', () => {
    it('should emit edit-message when ChatContent emits edit', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      const message = mockMessages[0]
      await chatContent.vm.$emit('edit', message)
      await nextTick()

      expect(wrapper.emitted('edit-message')).toBeTruthy()
      expect(wrapper.emitted('edit-message')?.[0]).toEqual([message])
    })
  })
})
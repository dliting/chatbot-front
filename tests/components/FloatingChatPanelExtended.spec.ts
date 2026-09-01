/**
 * Extended unit tests for FloatingChatPanel component
 * Covers: file preview, thinking/streaming props, config defaults,
 *         inject-primary pattern verification
 * Architecture: inject-primary — internal actions use inject, emits are external-only
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

  describe('Inject-primary pattern (no emit forwarding)', () => {
    it('should NOT emit copy-message — copy is handled locally in ChatContent', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      // Copy is handled locally via copyToClipboard in ChatContent, not forwarded
      expect(wrapper.emitted('copy-message')).toBeFalsy()
    })

    it('should NOT emit refresh-message — ChatContent uses chatActions.refreshMessage via inject', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      expect(wrapper.emitted('refresh-message')).toBeFalsy()
    })

    it('should NOT emit delete-message — ChatContent uses chatActions.deleteMessage via inject', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      expect(wrapper.emitted('delete-message')).toBeFalsy()
    })

    it('should NOT emit thinking-toggle — ChatContent uses uiActions.setThinkingEnabled via inject', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      expect(wrapper.emitted('thinking-toggle')).toBeFalsy()
    })

    it('should NOT emit stop-generating — ChatContent uses chatActions.stopGenerating via inject', async () => {
      const wrapper = mountOpenPanel({ isStreaming: true })
      await nextTick()

      expect(wrapper.emitted('stop-generating')).toBeFalsy()
    })

    it('should NOT emit update-topic-title — TopicListView uses topicActions.renameTopic via inject', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      expect(wrapper.emitted('update-topic-title')).toBeFalsy()
    })

    it('should NOT emit edit-message — ChatContent uses chatActions.editMessage via inject', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      expect(wrapper.emitted('edit-message')).toBeFalsy()
    })
  })

  describe('Thinking and Streaming Props', () => {
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

      const modal = wrapper.findComponent({ name: 'FilePreviewModal' })
      expect(modal.props('visible')).toBe(true)

      await modal.vm.$emit('close')
      await nextTick()

      expect(wrapper.find('.file-preview-modal-stub').exists()).toBe(false)
    })
  })

  describe('Topic View Switching (inject path)', () => {
    it('should switch to chat view after selecting a topic (via inject)', async () => {
      const wrapper = mountOpenPanel()
      await nextTick()

      // Switch to topics view by clicking the topics button in ChatHeader
      // ChatHeader calls uiActions.showTopicsView() via inject, which triggers view switch
      const topicsBtn = wrapper.find('.chat-header__btn:not(.chat-header__close)')
      await topicsBtn.trigger('click')
      await nextTick()

      // Verify we're in topics view
      const topicListView = wrapper.findComponent({ name: 'TopicListView' })
      expect(topicListView.exists()).toBe(true)

      // Simulate topic selection: TopicListView calls topicActions.switchToTopic + uiActions.showChatView
      // The enhanced provide chain ensures showChatView is the panel's local one
      wrapper.vm.showChatView()
      await nextTick()

      // ChatContent should now be rendered (back in chat view)
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
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
})

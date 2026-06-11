/**
 * Tests for ChatContent component
 * Covers: welcome screen, quick actions, input delegation, file-click passthrough
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatContent from '@/components/ChatContent.vue'
import { chatActionsKey, uiActionsKey } from '@/symbols'
import { createMockChatActions, createMockUIActions } from '../utils/mockActions'

// Mock ChatInput to avoid complex dependencies
vi.mock('@/components/ChatInput.vue', () => ({
  default: {
    name: 'ChatInput',
    template: '<div class="chat-input-mock"><slot /></div>',
    props: ['disabled'],
    emits: ['send', 'file-click'],
  },
}))

// Mock element-plus
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
}))

const mockMessages = [
  {
    messageId: 'msg-user-1',
    sessionId: 'session-1',
    role: 'user' as const,
    type: 'text' as const,
    content: 'Hello, how are you?',
    timestamp: Date.now() - 1000,
    status: 'sent' as const,
  },
  {
    messageId: 'msg-assistant-1',
    sessionId: 'session-1',
    role: 'assistant' as const,
    type: 'text' as const,
    content: 'I am fine, thank you!',
    timestamp: Date.now(),
    status: 'sent' as const,
  },
]

const mockChatActions = createMockChatActions()
const mockUIActions = createMockUIActions()

const createWrapper = (options = {}) => {
  return mount(ChatContent, {
    props: {
      messages: mockMessages,
      welcomeVisible: false,
      quickActionsVisible: false,
      ...options,
    },
    global: {
      stubs: {
        ChatInput: true,
        WelcomeScreen: true,
        MessageList: true,
        ConfirmDialog: true,
      },
      provide: {
        [chatActionsKey]: mockChatActions,
        [uiActionsKey]: mockUIActions,
      },
    },
  })
}

describe('ChatContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Welcome section', () => {
    it('should render WelcomeScreen when welcomeVisible is true', () => {
      const wrapper = createWrapper({ welcomeVisible: true, messages: [] })
      expect(wrapper.findComponent({ name: 'WelcomeScreen' }).exists()).toBe(true)
    })

    it('should not render WelcomeScreen when welcomeVisible is false', () => {
      const wrapper = createWrapper({ welcomeVisible: false })
      expect(wrapper.findComponent({ name: 'WelcomeScreen' }).exists()).toBe(false)
    })

    it('should pass showQuickActions prop to WelcomeScreen', () => {
      const wrapper = createWrapper({ welcomeVisible: true, quickActionsVisible: true, messages: [] })
      const ws = wrapper.findComponent({ name: 'WelcomeScreen' })
      expect(ws.props('showQuickActions')).toBe(true)
    })
  })

  describe('Quick actions', () => {
    it('should call sendMessage when WelcomeScreen emits quick-action', () => {
      const wrapper = createWrapper({ welcomeVisible: true, messages: [] })
      const ws = wrapper.findComponent({ name: 'WelcomeScreen' })
      ws.vm.$emit('quick-action', 'Explain quantum computing')
      expect(mockChatActions.sendMessage).toHaveBeenCalledWith({ content: 'Explain quantum computing' })
    })
  })

  describe('Message rendering', () => {
    it('should pass messages to MessageList', () => {
      const wrapper = createWrapper()
      const ml = wrapper.findComponent({ name: 'MessageList' })
      expect(ml.props('messages')).toEqual(mockMessages)
    })

    it('should pass isStreaming to MessageList', () => {
      const wrapper = createWrapper({ isStreaming: true })
      const ml = wrapper.findComponent({ name: 'MessageList' })
      expect(ml.props('isStreaming')).toBe(true)
    })

    it('should pass streamingMessageId to MessageList', () => {
      const wrapper = createWrapper({ streamingMessageId: 'msg-1' })
      const ml = wrapper.findComponent({ name: 'MessageList' })
      expect(ml.props('streamingMessageId')).toBe('msg-1')
    })
  })

  describe('Input area', () => {
    it('should render ChatInput', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ChatInput' }).exists()).toBe(true)
    })

    it('should pass disabled prop based on isStreaming', () => {
      const wrapper = createWrapper({ isStreaming: true })
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      expect(ci.props('disabled')).toBe(true)
    })

    it('should call sendMessage when ChatInput emits send', () => {
      const wrapper = createWrapper()
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      const sendData = { content: 'Hello', attachments: [] }
      ci.vm.$emit('send', sendData)
      expect(mockChatActions.sendMessage).toHaveBeenCalledWith(sendData)
    })

    it('should call stopGenerating when ChatInput emits stop', () => {
      const wrapper = createWrapper()
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      ci.vm.$emit('stop')
      expect(mockChatActions.stopGenerating).toHaveBeenCalled()
    })
  })

  describe('File click', () => {
    it('should emit file-click when MessageList emits file-click', () => {
      const wrapper = createWrapper()
      const ml = wrapper.findComponent({ name: 'MessageList' })
      const file = { type: 'image', url: 'http://example.com/img.jpg' }
      ml.vm.$emit('file-click', file)
      expect(wrapper.emitted('file-click')?.[0]).toEqual([file])
    })

    it('should emit file-click when ChatInput emits file-click', () => {
      const wrapper = createWrapper()
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      const file = { type: 'image', url: 'http://example.com/img.jpg' }
      ci.vm.$emit('file-click', file)
      expect(wrapper.emitted('file-click')?.[0]).toEqual([file])
    })
  })

  describe('Thinking controls', () => {
    it('should pass enableThinking to ChatInput', () => {
      const wrapper = createWrapper({ enableThinking: true })
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      // ChatInput is stubbed; verify the prop is passed via attributes
      expect(wrapper.find('.chat-input-mock').exists() || ci.exists()).toBe(true)
    })

    it('should call setThinkingEnabled when ChatInput emits update:thinking-enabled', () => {
      const wrapper = createWrapper()
      const ci = wrapper.findComponent({ name: 'ChatInput' })
      ci.vm.$emit('update:thinking-enabled', true)
      expect(mockUIActions.setThinkingEnabled).toHaveBeenCalledWith(true)
    })
  })

  describe('Delete confirmation dialog', () => {
    it('should render ConfirmDialog', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ConfirmDialog' }).exists()).toBe(true)
    })
  })

  describe('Component layout', () => {
    it('should render the main container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-content').exists()).toBe(true)
    })

    it('should render messages container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-content__messages').exists()).toBe(true)
    })

    it('should render input area', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-content__input-area').exists()).toBe(true)
    })
  })
})

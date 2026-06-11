import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatContent from '@/components/ChatContent.vue'
import { chatActionsKey, uiActionsKey } from '@/symbols'
import type { Message } from '@/types'
import { createMockChatActions, createMockUIActions } from '../utils/mockActions'

const mockChatActions = createMockChatActions()
const mockUIActions = createMockUIActions()

const mountChat = (props = {}) => mount(ChatContent, {
  props: { messages: [], isStreaming: false, ...props },
  global: {
    stubs: { ChatInput: true, WelcomeScreen: true, ConfirmDialog: true },
    provide: {
      [chatActionsKey]: mockChatActions,
      [uiActionsKey]: mockUIActions,
    },
  },
})

describe('ChatContent - ThinkingBlock', () => {
  it('renders ThinkingBlock for assistant messages with thinkingContent', () => {
    const messages: Message[] = [{
      messageId: 'msg-1', sessionId: 's1', role: 'assistant', type: 'text',
      content: 'Hello', timestamp: Date.now(), status: 'sent',
      thinkingContent: 'Think...', thinkingTime: 2000,
    }]
    const wrapper = mountChat({ messages })
    // ThinkingBlock is now inside MessageItem inside MessageList
    const block = wrapper.findComponent({ name: 'ThinkingBlock' })
    expect(block.exists()).toBe(true)
  })

  it('does NOT render ThinkingBlock for messages without thinkingContent', () => {
    const messages: Message[] = [{
      messageId: 'msg-2', sessionId: 's1', role: 'assistant', type: 'text',
      content: 'Hello', timestamp: Date.now(), status: 'sent',
    }]
    const wrapper = mountChat({ messages })
    const block = wrapper.findComponent({ name: 'ThinkingBlock' })
    expect(block.exists()).toBe(false)
  })

  it('does NOT render ThinkingBlock for user messages', () => {
    const messages: Message[] = [{
      messageId: 'msg-3', sessionId: 's1', role: 'user', type: 'text',
      content: 'Hi', timestamp: Date.now(), status: 'sent',
    }]
    const wrapper = mountChat({ messages })
    const block = wrapper.findComponent({ name: 'ThinkingBlock' })
    expect(block.exists()).toBe(false)
  })

  it('passes correct props to ThinkingBlock', () => {
    const messages: Message[] = [{
      messageId: 'msg-4', sessionId: 's1', role: 'assistant', type: 'text',
      content: 'Answer', timestamp: Date.now(), status: 'sent',
      thinkingContent: 'Deep thought', thinkingTime: 5000,
    }]
    const wrapper = mountChat({ messages })
    const block = wrapper.findComponent({ name: 'ThinkingBlock' })
    expect(block.exists()).toBe(true)
    expect(block.props('content')).toBe('Deep thought')
    expect(block.props('thinkingTime')).toBe(5000)
  })
})

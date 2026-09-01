import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/MessageItem.vue'
import ThinkingBlock from '@/components/ThinkingBlock.vue'
import { chatActionsKey } from '@/symbols'

describe('MessageItem Double Click Edit', () => {
  const mockChatActions = {
    sendMessage: vi.fn(),
    refreshMessage: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    stopGenerating: vi.fn(),
    isGenerating: { value: false },
    isThinkingActive: { value: false },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (message: any, props = {}) => {
    return mount(MessageItem, {
      props: {
        message,
        ...props,
      },
      global: {
        provide: {
          [chatActionsKey]: mockChatActions,
        },
        stubs: {
          ThinkingBlock: true,
        },
      },
    })
  }

  it('should call chatActions.editMessage on double click for user message', async () => {
    const message = {
      id: '1',
      sessionId: 's1',
      role: 'user',
      type: 'text',
      content: 'Test message',
      timestamp: Date.now(),
      status: 'sent'
    }

    const wrapper = createWrapper(message)

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(mockChatActions.editMessage).toHaveBeenCalledWith(message)
  })

  it('should NOT call chatActions.editMessage for assistant message', async () => {
    const message = {
      id: '1',
      sessionId: 's1',
      role: 'assistant',
      type: 'text',
      content: 'AI response',
      timestamp: Date.now(),
      status: 'sent'
    }

    const wrapper = createWrapper(message)

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(mockChatActions.editMessage).not.toHaveBeenCalled()
  })

  it('should NOT call chatActions.editMessage for streaming message', async () => {
    const message = {
      id: '1',
      sessionId: 's1',
      role: 'user',
      type: 'text',
      content: 'Test message',
      timestamp: Date.now(),
      status: 'sending'
    }

    const wrapper = createWrapper(message, { isStreaming: true })

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(mockChatActions.editMessage).not.toHaveBeenCalled()
  })
})

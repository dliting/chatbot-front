import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/MessageItem.vue'

describe('MessageItem Double Click Edit', () => {
  it('should emit edit event on double click for user message', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: '1',
          sessionId: 's1',
          role: 'user',
          type: 'text',
          content: 'Test message',
          timestamp: Date.now(),
          status: 'sent'
        }
      }
    })

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('should NOT emit edit for assistant message', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: '1',
          sessionId: 's1',
          role: 'assistant',
          type: 'text',
          content: 'AI response',
          timestamp: Date.now(),
          status: 'sent'
        }
      }
    })

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(wrapper.emitted('edit')).toBeFalsy()
  })

  it('should NOT emit edit for streaming message', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: '1',
          sessionId: 's1',
          role: 'user',
          type: 'text',
          content: 'Test message',
          timestamp: Date.now(),
          status: 'sending'
        },
        isStreaming: true
      }
    })

    await wrapper.find('.chatbot-message__bubble').trigger('dblclick')

    expect(wrapper.emitted('edit')).toBeFalsy()
  })
})

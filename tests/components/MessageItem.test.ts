/**
 * Unit tests for MessageItem component
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/MessageItem.vue'
import type { Message } from '@/types'

describe('MessageItem', () => {
  const mockUserMessage: Message = {
    id: 'msg_1',
    sessionId: 'session_1',
    role: 'user',
    type: 'text',
    content: 'Hello, how are you?',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockAssistantMessage: Message = {
    id: 'msg_2',
    sessionId: 'session_1',
    role: 'assistant',
    type: 'text',
    content: 'I am doing well, thank you!',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockImageMessage: Message = {
    id: 'msg_3',
    sessionId: 'session_1',
    role: 'user',
    type: 'image',
    content: '',
    images: ['https://example.com/image.jpg'],
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockErrorMessage: Message = {
    id: 'msg_4',
    sessionId: 'session_1',
    role: 'user',
    type: 'text',
    content: 'Failed message',
    timestamp: Date.now(),
    status: 'error',
  }

  it('should render user message correctly', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockUserMessage,
        showAvatar: true,
        showActions: true,
      },
    })

    expect(wrapper.find('.chatbot-message--user').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello, how are you?')
  })

  it('should render assistant message correctly', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockAssistantMessage,
        showAvatar: true,
        showActions: true,
      },
    })

    expect(wrapper.find('.chatbot-message--assistant').exists()).toBe(true)
    expect(wrapper.text()).toContain('I am doing well, thank you!')
  })

  it('should render error message with error indicator', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockErrorMessage,
        showAvatar: true,
        showActions: true,
      },
    })

    expect(wrapper.find('.chatbot-message--error').exists()).toBe(true)
    expect(wrapper.find('.chatbot-message__error').exists()).toBe(true)
  })

  it('should render image message', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockImageMessage,
        showAvatar: true,
      },
    })

    expect(wrapper.find('.chatbot-message__image').exists()).toBe(true)
    expect(wrapper.find('.chatbot-message__image').attributes('src')).toBe('https://example.com/image.jpg')
  })

  it('should show avatar when enabled', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockUserMessage,
        showAvatar: true,
      },
    })

    expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(true)
  })

  it('should not show avatar when disabled', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockUserMessage,
        showAvatar: false,
      },
    })

    expect(wrapper.find('.chatbot-message__avatar').exists()).toBe(false)
  })

  it('should show actions when enabled', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockAssistantMessage,
        showActions: true,
        enableCopy: true,
        enableDelete: true,
      },
    })

    // Actions are shown on hover, but the buttons should be in DOM
    expect(wrapper.find('.chatbot-message__actions').exists()).toBe(true)
  })

  it('should emit copy event', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockAssistantMessage,
        showActions: true,
        enableCopy: true,
      },
    })

    await wrapper.find('.chatbot-message__action-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('copy')).toBeTruthy()
  })

  it('should emit delete event', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockUserMessage,
        showActions: true,
        enableDelete: true,
      },
    })

    // Find delete button (last action button)
    const buttons = wrapper.findAll('.chatbot-message__action-btn')
    const deleteBtn = buttons[buttons.length - 1]

    await deleteBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should show streaming cursor when streaming', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockAssistantMessage,
        isStreaming: true,
      },
    })

    expect(wrapper.find('.chatbot-message--streaming').exists()).toBe(true)
    expect(wrapper.find('.chatbot-message__cursor').exists()).toBe(true)
  })

  it('should emit file-click event when image is clicked', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockImageMessage,
      },
    })

    await wrapper.find('.chatbot-message__image').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('file-click')).toBeTruthy()
    expect(wrapper.emitted('file-click')?.[0]).toEqual([{ type: 'image', url: 'https://example.com/image.jpg' }])
  })

  it('should apply theme class', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockUserMessage,
        theme: 'dark',
      },
    })

    expect(wrapper.find('.chatbot-message--dark').exists()).toBe(true)
  })

  it('should not show copy button for error messages', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockErrorMessage,
        showActions: true,
        enableCopy: true,
      },
    })

    // Error messages show resend button instead of copy
    expect(wrapper.find('.chatbot-message__action-btn--danger').exists()).toBe(true)
  })

  it('should show resend button for error messages', () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: mockErrorMessage,
        showActions: true,
        enableResend: true,
      },
    })

    const dangerousBtns = wrapper.findAll('.chatbot-message__action-btn--danger')
    expect(dangerousBtns.length).toBeGreaterThan(0)
  })

  it('should render multiple images', () => {
    const multiImageMessage: Message = {
      ...mockImageMessage,
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ],
    }

    const wrapper = mount(MessageItem, {
      props: {
        message: multiImageMessage,
      },
    })

    const images = wrapper.findAll('.chatbot-message__image')
    expect(images.length).toBe(2)
  })
})

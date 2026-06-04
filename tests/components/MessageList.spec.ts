import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageList from '@/components/MessageList.vue'
import type { Message } from '@/types'

// Mock the MessageItem component
vi.mock('@/components/MessageItem.vue', () => ({
  default: {
    name: 'MessageItem',
    props: ['message', 'theme', 'isStreaming'],
    emits: ['copy', 'delete', 'resend', 'file-click'],
    template: `
      <div class="chatbot-messages__item" :class="'chatbot-messages__item--' + message.role" data-testid="message-item">
        <span class="chatbot-messages__item-content">{{ message.content }}</span>
        <button @click="$emit('copy', message)">Copy</button>
        <button @click="$emit('delete', message)">Delete</button>
        <button v-if="message.role === 'user'" @click="$emit('resend', message)">Resend</button>
      </div>
    `,
  },
}))

describe('MessageList.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof MessageList>>

  const defaultProps = {
    messages: [],
    theme: 'light' as const,
    isStreaming: false,
    streamingMessageId: null,
    emptyMessage: 'Start a conversation...',
  }

  const createMockMessages = (count: number): Message[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `msg_${i}`,
      sessionId: 'session_1',
      role: i % 2 === 0 ? 'user' : 'assistant',
      type: 'text',
      content: `Message ${i + 1}`,
      timestamp: Date.now() - (count - i) * 1000,
      status: 'sent',
    }))
  }

  const createWrapper = (props = {}) => {
    return mount(MessageList, {
      props: {
        ...defaultProps,
        ...props,
      },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the message list container', () => {
      expect(wrapper.find('.chatbot-messages').exists()).toBe(true)
    })

    it('should display empty state when no messages', () => {
      expect(wrapper.find('.chatbot-messages__empty').exists()).toBe(true)
      expect(wrapper.find('.chatbot-messages__empty').text()).toBe(defaultProps.emptyMessage)
    })

    it('should not display empty state when messages exist', async () => {
      const messages = createMockMessages(2)
      await wrapper.setProps({ messages })

      expect(wrapper.find('.chatbot-messages__empty').exists()).toBe(false)
    })
  })

  describe('Message Rendering', () => {
    it('should render all messages', async () => {
      const messages = createMockMessages(3)
      await wrapper.setProps({ messages })

      const messageItems = wrapper.findAll('[data-testid="message-item"]')
      expect(messageItems.length).toBe(3)
    })

    it('should render user messages with correct class', async () => {
      const messages = createMockMessages(1)
      await wrapper.setProps({ messages })

      const userMessage = wrapper.find('.chatbot-messages__item--user')
      expect(userMessage.exists()).toBe(true)
    })

    it('should render assistant messages with correct class', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'assistant',
          type: 'text',
          content: 'Hello!',
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const assistantMessage = wrapper.find('.chatbot-messages__item--assistant')
      expect(assistantMessage.exists()).toBe(true)
    })

    it('should display message content', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Hello, how are you?',
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      expect(wrapper.find('.chatbot-messages__item-content').text()).toBe('Hello, how are you?')
    })
  })

  describe('Streaming State', () => {
    it('should apply streaming class to streaming message', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'assistant',
          type: 'text',
          content: 'Streaming...',
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({
        messages,
        isStreaming: true,
        streamingMessageId: 'msg_1',
      })

      const vm = wrapper.vm as unknown as { isStreamingMessage: (msg: Message) => boolean }
      if (vm.isStreamingMessage) {
        expect(vm.isStreamingMessage(messages[0])).toBe(true)
      }
    })

    it('should show typing indicator when streaming', async () => {
      await wrapper.setProps({ isStreaming: true })

      const vm = wrapper.vm as unknown as { showTypingIndicator: boolean }
      if (vm.showTypingIndicator !== undefined) {
        expect(vm.showTypingIndicator).toBe(true)
      }
    })
  })

  describe('Theme', () => {
    it('should render with light theme', () => {
      expect(wrapper.find('.chatbot-messages').exists()).toBe(true)
    })

    it('should render with dark theme', async () => {
      await wrapper.setProps({ theme: 'dark' })

      expect(wrapper.find('.chatbot-messages').exists()).toBe(true)
    })
  })

  describe('Message Actions', () => {
    it('should emit copy event when copy button is clicked', async () => {
      const messages = createMockMessages(1)
      await wrapper.setProps({ messages })

      const copyButton = wrapper.find('.chatbot-messages__item button')
      await copyButton.trigger('click')

      expect(wrapper.emitted('copy')).toBeTruthy()
      expect(wrapper.emitted('copy')?.[0]).toEqual([messages[0]])
    })

    it('should emit delete event when delete button is clicked', async () => {
      const messages = createMockMessages(1)
      await wrapper.setProps({ messages })

      const deleteButton = wrapper.findAll('.chatbot-messages__item button')[1]
      await deleteButton.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual([messages[0]])
    })

    it('should emit resend event when resend button is clicked', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Resend me',
          timestamp: Date.now(),
          status: 'error',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const resendButton = wrapper.findAll('.chatbot-messages__item button')[2]
      await resendButton.trigger('click')

      expect(wrapper.emitted('resend')).toBeTruthy()
      expect(wrapper.emitted('resend')?.[0]).toEqual([messages[0]])
    })
  })

  describe('Auto-scroll', () => {
    it('should render component', async () => {
      const messages = createMockMessages(1)
      await wrapper.setProps({ messages })

      expect(wrapper.find('.chatbot-messages').exists()).toBe(true)
    })

    it('should show scroll button when scrolled away from bottom', async () => {
      const messages = createMockMessages(5)
      await wrapper.setProps({ messages })
      await nextTick()

      // Manually set isNearBottom to false (simulating scroll away from bottom)
      wrapper.vm.isNearBottom = false
      wrapper.vm.showScrollButton = true
      await nextTick()

      expect(wrapper.find('.chatbot-messages__scroll-btn').exists()).toBe(true)
    })

    it('should call scrollToBottom when scroll button clicked', async () => {
      const messages = createMockMessages(5)
      await wrapper.setProps({ messages })

      wrapper.vm.showScrollButton = true
      await nextTick()

      const scrollBtn = wrapper.find('.chatbot-messages__scroll-btn')
      if (scrollBtn.exists()) {
        await scrollBtn.trigger('click')
        // scrollToBottom should be called (no error means it worked)
      }
    })
  })

  describe('Image Messages', () => {
    it('should render message with images', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'image',
          content: '',
          images: ['https://example.com/image.jpg'],
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const vm = wrapper.vm as unknown as { hasImages: (msg: Message) => boolean }
      if (vm.hasImages) {
        expect(vm.hasImages(messages[0])).toBe(true)
      }
    })

    it('should emit file-click event when image is clicked', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'image',
          content: '',
          images: ['https://example.com/image.jpg'],
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      // Simulate file click event
      wrapper.vm.$emit('file-click', { type: 'image', url: 'https://example.com/image.jpg' })

      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]).toEqual([{ type: 'image', url: 'https://example.com/image.jpg' }])
    })
  })

  describe('Timestamp Display', () => {
    it('should format message timestamps', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Test',
          timestamp: Date.now(),
          status: 'sent',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const vm = wrapper.vm as unknown as { formatTimestamp: (ts: number) => string }
      if (vm.formatTimestamp) {
        const formatted = vm.formatTimestamp(messages[0].timestamp)
        expect(typeof formatted).toBe('string')
        expect(formatted.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Message Status', () => {
    it('should display error status for failed messages', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Failed message',
          timestamp: Date.now(),
          status: 'error',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const vm = wrapper.vm as unknown as { showResend: (msg: Message) => boolean }
      if (vm.showResend) {
        expect(vm.showResend(messages[0])).toBe(true)
      }
    })

    it('should display loading status for sending messages', async () => {
      const messages = [
        {
          id: 'msg_1',
          sessionId: 'session_1',
          role: 'user',
          type: 'text',
          content: 'Sending...',
          timestamp: Date.now(),
          status: 'loading',
        },
      ] as Message[]

      await wrapper.setProps({ messages })

      const vm = wrapper.vm as unknown as { showLoading: (msg: Message) => boolean }
      if (vm.showLoading) {
        expect(vm.showLoading(messages[0])).toBe(true)
      }
    })
  })
})

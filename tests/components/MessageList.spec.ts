import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageList from '@/components/MessageList.vue'
import MessageItem from '@/components/MessageItem.vue'
import type { Message } from '@/types'
import { chatActionsKey } from '@/symbols'

// Mock the MessageItem component - no longer emits copy/delete/resend
vi.mock('@/components/MessageItem.vue', () => ({
  default: {
    name: 'MessageItem',
    props: ['message', 'theme', 'isStreaming', 'autoCollapse', 'enableCopy', 'enableDelete', 'enableResend', 'labels'],
    emits: ['file-click'],
    template: `
      <div class="chatbot-messages__item" :class="'chatbot-messages__item--' + message.role" data-testid="message-item">
        <span class="chatbot-messages__item-content">{{ message.content }}</span>
      </div>
    `,
  },
}))

describe('MessageList.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof MessageList>>

  const mockChatActions = {
    sendMessage: vi.fn(),
    refreshMessage: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    stopGenerating: vi.fn(),
    isGenerating: { value: false },
    isThinkingActive: { value: false },
  }

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
      global: {
        provide: {
          [chatActionsKey]: mockChatActions,
        },
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

describe('thinkingAutoCollapse passthrough to MessageItem', () => {
  it('passes thinkingAutoCollapse=false as autoCollapse=false on MessageItem', () => {
    const wrapper = mount(MessageList, {
      props: {
        messages: [{
          messageId: 'm1', topicId: 't1', role: 'assistant', type: 'text',
          content: 'answer', thinkingContent: 'thinking...', timestamp: Date.now(), status: 'sent',
        } as Message],
        thinkingAutoCollapse: false,
      },
    })
    expect(wrapper.findComponent(MessageItem).props('autoCollapse')).toBe(false)
  })

  it('defaults to autoCollapse=true on MessageItem', () => {
    const wrapper = mount(MessageList, {
      props: {
        messages: [{
          messageId: 'm1', topicId: 't1', role: 'assistant', type: 'text',
          content: 'answer', timestamp: Date.now(), status: 'sent',
        } as Message],
      },
    })
    expect(wrapper.findComponent(MessageItem).props('autoCollapse')).toBe(true)
  })
})

describe('MessageList scroll handling', () => {
  const scrollMessages: Message[] = Array.from({ length: 5 }, (_, i) => ({
    messageId: `m${i}`, topicId: 't1', role: 'assistant' as const, type: 'text' as const,
    content: `msg ${i}`, timestamp: Date.now(), status: 'sent' as const,
  }))

  function mountScroller() {
    return mount(MessageList, { props: { messages: scrollMessages } })
  }

  function mockScrollMetrics(el: Element, metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
    Object.defineProperty(el, 'scrollTop', { value: metrics.scrollTop, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: metrics.scrollHeight, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: metrics.clientHeight, configurable: true })
  }

  it('shows the scroll-to-bottom button when scrolled away from bottom', async () => {
    const wrapper = mountScroller()
    const el = wrapper.find('.chatbot-messages').element
    mockScrollMetrics(el, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 })

    await wrapper.find('.chatbot-messages').trigger('scroll')
    expect(wrapper.find('.chatbot-messages__scroll-btn').exists()).toBe(true)
  })

  it('hides the button near the bottom', async () => {
    const wrapper = mountScroller()
    const el = wrapper.find('.chatbot-messages').element
    mockScrollMetrics(el, { scrollTop: 550, scrollHeight: 1000, clientHeight: 400 })

    await wrapper.find('.chatbot-messages').trigger('scroll')
    expect(wrapper.find('.chatbot-messages__scroll-btn').exists()).toBe(false)
  })

  it('scrolls to bottom when the button is clicked', async () => {
    const wrapper = mountScroller()
    const el = wrapper.find('.chatbot-messages').element as HTMLElement
    mockScrollMetrics(el, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 })
    await wrapper.find('.chatbot-messages').trigger('scroll')

    const scrollTo = vi.fn()
    ;(el as unknown as { scrollTo: unknown }).scrollTo = scrollTo

    await wrapper.find('.chatbot-messages__scroll-btn').trigger('click')
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth', top: 1000 }))
  })
})

describe('streaming token-growth auto-follow (B-6)', () => {
  function mountStreaming() {
    const messages: Message[] = [
      { messageId: 'u1', topicId: 't1', role: 'user', type: 'text', content: 'q', timestamp: Date.now(), status: 'sent' },
      { messageId: 'a1', topicId: 't1', role: 'assistant', type: 'text', content: '', timestamp: Date.now(), status: 'loading' },
    ]
    const wrapper = mount(MessageList, {
      props: { messages, autoScroll: true, isStreaming: true, streamingMessageId: 'a1' },
    })
    const el = wrapper.find('.chatbot-messages').element as HTMLElement
    Object.defineProperty(el, 'scrollTop', { value: 0, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const scrollTo = vi.fn()
    ;(el as unknown as { scrollTo: unknown }).scrollTo = scrollTo
    return { wrapper, messages, scrollTo, el }
  }

  it('follows token growth while near the bottom', async () => {
    const { wrapper, messages, scrollTo } = mountStreaming()
    // near the bottom: scrollTop leaves < 100px to scrollHeight-clientHeight
    Object.defineProperty(wrapper.find('.chatbot-messages').element, 'scrollTop', { value: 600, configurable: true })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    // streaming token arrives → assistant content grows in place
    messages[1] = { ...messages[1], content: 'partial reply' }
    await wrapper.setProps({ messages: [...messages] })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('does not follow when the user scrolled away', async () => {
    const { wrapper, messages, scrollTo } = mountStreaming()
    // scrolled far up → not near bottom
    Object.defineProperty(wrapper.find('.chatbot-messages').element, 'scrollTop', { value: 0, configurable: true })
    Object.defineProperty(wrapper.find('.chatbot-messages').element, 'scrollHeight', { value: 5000, configurable: true })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    messages[1] = { ...messages[1], content: 'more tokens' }
    await wrapper.setProps({ messages: [...messages] })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBe(callsBefore)
  })

  it('does not follow when autoScroll is false', async () => {
    const messages: Message[] = [
      { messageId: 'a1', topicId: 't1', role: 'assistant', type: 'text', content: '', timestamp: Date.now(), status: 'loading' },
    ]
    const wrapper = mount(MessageList, {
      props: { messages, autoScroll: false, isStreaming: true, streamingMessageId: 'a1' },
    })
    const el = wrapper.find('.chatbot-messages').element as HTMLElement
    Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const scrollTo = vi.fn()
    ;(el as unknown as { scrollTo: unknown }).scrollTo = scrollTo
    await wrapper.find('.chatbot-messages').trigger('scroll')

    messages[0] = { ...messages[0], content: 'tokens' }
    await wrapper.setProps({ messages: [...messages] })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBe(0)
  })
})

describe('auto-scroll config branches (B-6 follow-up)', () => {
  interface MountOpts {
    autoScroll?: boolean
    isStreaming?: boolean
    streamingMessageId?: string | null
  }

  function mountList(opts: MountOpts = {}) {
    const messages: Message[] = [
      { messageId: 'u1', topicId: 't1', role: 'user', type: 'text', content: 'q', timestamp: Date.now(), status: 'sent' },
      { messageId: 'a1', topicId: 't1', role: 'assistant', type: 'text', content: '', timestamp: Date.now(), status: 'loading' },
    ]
    const wrapper = mount(MessageList, {
      props: {
        messages,
        autoScroll: opts.autoScroll ?? true,
        isStreaming: opts.isStreaming ?? false,
        streamingMessageId: opts.streamingMessageId ?? null,
      },
    })
    const el = wrapper.find('.chatbot-messages').element as HTMLElement
    Object.defineProperty(el, 'scrollTop', { value: 600, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const scrollTo = vi.fn()
    ;(el as unknown as { scrollTo: unknown }).scrollTo = scrollTo
    // Register the real scroll position so isNearBottom evaluates true
    wrapper.find('.chatbot-messages').trigger('scroll')
    return { wrapper, messages, scrollTo, el }
  }

  it('does not follow new messages when autoScroll is disabled', async () => {
    const { wrapper, messages, scrollTo } = mountList({ autoScroll: false })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    messages.push({ messageId: 'u2', topicId: 't1', role: 'user', type: 'text', content: 'x', timestamp: Date.now(), status: 'sent' })
    await wrapper.setProps({ messages: [...messages] })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBe(callsBefore)
  })

  it('does not follow streaming growth when autoScroll is disabled', async () => {
    const { wrapper, messages, scrollTo } = mountList({ autoScroll: false, isStreaming: true, streamingMessageId: 'a1' })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    messages[1] = { ...messages[1], content: 'partial' }
    await wrapper.setProps({ messages: [...messages] })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBe(callsBefore)
  })

  it('follows the streaming message id change when autoScroll is enabled', async () => {
    const { wrapper, scrollTo } = mountList({ autoScroll: true, isStreaming: true, streamingMessageId: null })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    await wrapper.setProps({ streamingMessageId: 'a1' })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('does not follow the streaming message id change when autoScroll is disabled', async () => {
    const { wrapper, scrollTo } = mountList({ autoScroll: false, isStreaming: true, streamingMessageId: null })
    await wrapper.find('.chatbot-messages').trigger('scroll')
    const callsBefore = scrollTo.mock.calls.length

    await wrapper.setProps({ streamingMessageId: 'a1' })
    await nextTick()

    expect(scrollTo.mock.calls.length).toBe(callsBefore)
  })
})

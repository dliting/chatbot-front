/**
 * Unit tests for MessageItem feedback (👍/👎) buttons
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/MessageItem.vue'
import type { Message } from '@/types'
import { chatActionsKey } from '@/symbols'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: vi.fn(),
    ElMessageBox: { confirm: vi.fn().mockResolvedValue(true) },
  }
})

vi.mock('@/utils/markdown', () => ({
  formatMarkdownContent: (content: string) => content,
}))

const mockChatActions = {
  sendMessage: vi.fn(),
  refreshMessage: vi.fn(),
  deleteMessage: vi.fn(),
  editMessage: vi.fn(),
  submitMessageFeedback: vi.fn(),
  stopGenerating: vi.fn(),
  isGenerating: { value: false },
  isThinkingActive: { value: false },
}

const createMessage = (overrides: Partial<Message> = {}): Message => ({
  messageId: 'msg-1',
  topicId: 'topic-1',
  role: 'assistant',
  type: 'text',
  content: 'AI answer',
  timestamp: Date.now(),
  status: 'sent',
  ...overrides,
})

const createWrapper = (message: Message, props: Record<string, unknown> = {}) =>
  mount(MessageItem, {
    props: { message, ...props },
    global: {
      provide: { [chatActionsKey]: mockChatActions },
      stubs: { ThinkingBlock: true },
    },
  })

describe('MessageItem feedback buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders up/down buttons for assistant sent messages when enabled', () => {
    const wrapper = createWrapper(createMessage(), { enableFeedback: true })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(true)
    expect(wrapper.find('.chatbot-message__action-btn--feedback-down').exists()).toBe(true)
  })

  it('does not render feedback buttons by default (opt-in feature)', () => {
    const wrapper = createWrapper(createMessage())
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(false)
    expect(wrapper.find('.chatbot-message__action-btn--feedback-down').exists()).toBe(false)
  })

  it('does not render feedback buttons on user messages', () => {
    const wrapper = createWrapper(createMessage({ role: 'user' }), { enableFeedback: true })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(false)
    expect(wrapper.find('.chatbot-message__action-btn--feedback-down').exists()).toBe(false)
  })

  it.each(['sending', 'loading', 'error'] as const)(
    'does not render feedback buttons for status "%s"',
    (status) => {
      const wrapper = createWrapper(createMessage({ status }), { enableFeedback: true })
      expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(false)
    }
  )

  it('renders buttons for stopped messages (partial answers are rateable)', () => {
    const wrapper = createWrapper(createMessage({ status: 'stopped' }), { enableFeedback: true })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(true)
  })

  it('clicking 👍 submits "up" through chat actions', async () => {
    const message = createMessage()
    const wrapper = createWrapper(message, { enableFeedback: true })
    await wrapper.find('.chatbot-message__action-btn--feedback-up').trigger('click')

    expect(mockChatActions.submitMessageFeedback).toHaveBeenCalledWith(message, 'up')
  })

  it('clicking 👎 submits "down" through chat actions', async () => {
    const message = createMessage()
    const wrapper = createWrapper(message, { enableFeedback: true })
    await wrapper.find('.chatbot-message__action-btn--feedback-down').trigger('click')

    expect(mockChatActions.submitMessageFeedback).toHaveBeenCalledWith(message, 'down')
  })

  it('reflects the stored feedback in aria-pressed (single source: message.feedback)', () => {
    const wrapper = createWrapper(createMessage({ feedback: 'up' }), { enableFeedback: true })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.chatbot-message__action-btn--feedback-down').attributes('aria-pressed')).toBe('false')
  })

  it('shows "none" aria-pressed when no feedback stored', () => {
    const wrapper = createWrapper(createMessage(), { enableFeedback: true })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('.chatbot-message__action-btn--feedback-down').attributes('aria-pressed')).toBe('false')
  })

  it('uses localized labels as title/aria-label', () => {
    const wrapper = createWrapper(createMessage(), {
      enableFeedback: true,
      labels: { feedbackUp: '有帮助', feedbackDown: '无帮助' },
    })
    expect(wrapper.find('[title="有帮助"]').exists()).toBe(true)
    expect(wrapper.find('[title="无帮助"]').exists()).toBe(true)
  })
})

describe('MessageItem feedback interactions (state branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clicking the active 👍 submits "none" (deselect)', async () => {
    const message = createMessage({ feedback: 'up' })
    const wrapper = createWrapper(message, { enableFeedback: true })
    await wrapper.find('.chatbot-message__action-btn--feedback-up').trigger('click')

    expect(mockChatActions.submitMessageFeedback).toHaveBeenCalledWith(message, 'none')
  })

  it('clicking the active 👎 submits "none" (deselect)', async () => {
    const message = createMessage({ feedback: 'down' })
    const wrapper = createWrapper(message, { enableFeedback: true })
    await wrapper.find('.chatbot-message__action-btn--feedback-down').trigger('click')

    expect(mockChatActions.submitMessageFeedback).toHaveBeenCalledWith(message, 'none')
  })

  it('renders safely without an injected chatActions provider', () => {
    const wrapper = mount(MessageItem, {
      props: { message: createMessage(), enableFeedback: true },
      global: { stubs: { ThinkingBlock: true } },
    })
    expect(wrapper.find('.chatbot-message__action-btn--feedback-up').exists()).toBe(true)
    expect(wrapper.classes()).toContain('chatbot-message')
  })
})

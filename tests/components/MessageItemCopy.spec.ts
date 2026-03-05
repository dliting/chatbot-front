/**
 * Unit tests for MessageItem copy feedback feature
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageItem from '@/components/MessageItem.vue'
import type { Message } from '@/types'

// Mock the utility functions
vi.mock('@/utils/helpers', () => ({
  formatTime: (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },
  copyToClipboard: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/utils/message', () => ({
  formatMessageContent: (content: string) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
}))

// Import the mocked function
import { copyToClipboard } from '@/utils/helpers'

describe('MessageItem Copy Feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const createMessage = (overrides = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'Test message',
    timestamp: Date.now() - 10000,
    status: 'sent',
    ...overrides,
  })

  it('should call copyToClipboard when copy button is clicked', async () => {
    const message = createMessage({ content: 'Test message' })
    const wrapper = mount(MessageItem, {
      props: {
        message,
        enableCopy: true,
      },
    })

    // Find and click the copy button
    const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
    await copyBtn.trigger('click')

    // Check if copyToClipboard was called with correct content
    expect(copyToClipboard).toHaveBeenCalledWith('Test message')
  })

  it('should display copy feedback tooltip when copy succeeds', async () => {
    vi.useFakeTimers()

    const message = createMessage({ content: 'Test message for feedback' })
    const wrapper = mount(MessageItem, {
      props: {
        message,
        enableCopy: true,
      },
    })

    // Click copy button
    const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
    await copyBtn.trigger('click')
    await nextTick()

    // After copy, feedback should be visible
    expect(wrapper.find('.chatbot-message__copy-feedback').exists()).toBe(true)
    expect(wrapper.find('.chatbot-message__copy-feedback').text()).toContain('Copied')

    // Advance timer to hide feedback after 2000ms
    vi.advanceTimersByTime(2000)
    await nextTick()

    // Feedback should be hidden after timeout
    expect(wrapper.find('.chatbot-message__copy-feedback').exists()).toBe(false)

    vi.useRealTimers()
  })

  it('should hide copy feedback when clicking copy button again before timeout', async () => {
    vi.useFakeTimers()

    const message = createMessage({ content: 'Test message' })
    const wrapper = mount(MessageItem, {
      props: {
        message,
        enableCopy: true,
      },
    })

    // First click
    const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
    await copyBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('.chatbot-message__copy-feedback').exists()).toBe(true)

    // Advance partial time (less than 2000ms)
    vi.advanceTimersByTime(1000)

    // Click again
    await copyBtn.trigger('click')
    await nextTick()

    // Feedback should still be visible (timer reset)
    expect(wrapper.find('.chatbot-message__copy-feedback').exists()).toBe(true)

    // Advance remaining time
    vi.advanceTimersByTime(2000)
    await nextTick()

    // Now feedback should be hidden
    expect(wrapper.find('.chatbot-message__copy-feedback').exists()).toBe(false)

    vi.useRealTimers()
  })

  it('should not show copy feedback when enableCopy is false', async () => {
    const message = createMessage({ content: 'Test message' })
    const wrapper = mount(MessageItem, {
      props: {
        message,
        enableCopy: false,
      },
    })

    // Copy button should not exist
    const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
    expect(copyBtn.exists()).toBe(false)
  })

  it('should not show copy feedback for streaming messages', async () => {
    const message = createMessage({ content: 'Streaming message' })
    const wrapper = mount(MessageItem, {
      props: {
        message,
        enableCopy: true,
        isStreaming: true,
      },
    })

    // Copy button should not exist for streaming messages
    const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
    expect(copyBtn.exists()).toBe(false)
  })
})

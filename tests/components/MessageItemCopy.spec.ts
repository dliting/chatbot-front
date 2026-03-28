/**
 * Unit tests for MessageItem copy and delete functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageItem from '@/components/MessageItem.vue'
import type { Message } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

// Mock element-plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: vi.fn(),
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true),
    },
  }
})

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

describe('MessageItem Copy and Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMessage = (overrides = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'Test message',
    timestamp: Date.now() - 10000,
    status: 'sent',
    ...overrides,
  })

  describe('Copy Functionality', () => {
    it('should call copyToClipboard when copy button is clicked', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableCopy: true,
        },
      })

      // Find and click the copy button by Chinese title
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="复制"]')
      await copyBtn.trigger('click')
      await nextTick()

      // Check if copyToClipboard was called with correct content
      expect(copyToClipboard).toHaveBeenCalledWith('Test message')
    })

    it('should emit copy event after successful copy', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableCopy: true,
        },
      })

      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="复制"]')
      await copyBtn.trigger('click')
      await nextTick()

      expect(wrapper.emitted('copy')).toBeTruthy()
    })

    it('should not show copy button when enableCopy is false', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableCopy: false,
        },
      })

      // Copy button should not exist
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="复制"]')
      expect(copyBtn.exists()).toBe(false)
    })

    it('should not show copy button for streaming messages', async () => {
      const message = createMessage({ content: 'Streaming message' })
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableCopy: true,
          isStreaming: true,
        },
      })

      // Copy button should not exist for streaming messages
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="复制"]')
      expect(copyBtn.exists()).toBe(false)
    })

    it('should add copied class to button after successful copy', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableCopy: true,
        },
      })

      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="复制"]')
      await copyBtn.trigger('click')
      await nextTick()

      // After copy, button should have copied class
      expect(wrapper.find('.chatbot-message__action-btn--copied').exists()).toBe(true)
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const message = createMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableDelete: true,
        },
      })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="删除"]')
      await deleteBtn.trigger('click')
      await nextTick()

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要删除这条消息吗？',
        '删除消息',
        expect.objectContaining({
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
      )
    })

    it('should emit delete event when user confirms deletion', async () => {
      const message = createMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableDelete: true,
        },
      })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="删除"]')
      await deleteBtn.trigger('click')
      await nextTick()

      // User confirmed, so delete event should be emitted
      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('should not emit delete event when user cancels', async () => {
      // Mock cancel behavior - need to reset and re-mock
      ;(ElMessageBox.confirm as any).mockReset()
      ;(ElMessageBox.confirm as any).mockRejectedValueOnce(new Error('cancelled'))

      const message = createMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableDelete: true,
        },
      })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="删除"]')
      await deleteBtn.trigger('click')
      await nextTick()

      // User cancelled, so delete event should not be emitted
      expect(wrapper.emitted('delete')).toBeFalsy()

      // Reset mock for other tests
      ;(ElMessageBox.confirm as any).mockResolvedValue(true)
    })

    it('should not show delete button when enableDelete is false', async () => {
      const message = createMessage()
      const wrapper = mount(MessageItem, {
        props: {
          message,
          enableDelete: false,
        },
      })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="删除"]')
      expect(deleteBtn.exists()).toBe(false)
    })
  })
})

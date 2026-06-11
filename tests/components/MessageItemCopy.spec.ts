import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageItem from '@/components/MessageItem.vue'
import ThinkingBlock from '@/components/ThinkingBlock.vue'
import type { Message } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { chatActionsKey } from '@/symbols'

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
  getAttachmentsByType: (message: any, type: string) => {
    return (message.attachments || []).filter((a: any) => a.type === type)
  },
}))

// Import the mocked function
import { copyToClipboard } from '@/utils/helpers'

describe('MessageItem Copy and Delete', () => {
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

  const createWrapper = (message: Message, props = {}) => {
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

  describe('Copy Functionality', () => {
    it('should call copyToClipboard when copy button is clicked', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = createWrapper(message, { enableCopy: true })

      // Find and click the copy button by title
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
      await copyBtn.trigger('click')
      await nextTick()

      // Check if copyToClipboard was called with correct content
      expect(copyToClipboard).toHaveBeenCalledWith('Test message')
    })

    it('should show success message after successful copy (no emit)', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = createWrapper(message, { enableCopy: true })

      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
      await copyBtn.trigger('click')
      await flushPromises()

      // Copy is handled internally via copyToClipboard, no emit
      expect(wrapper.emitted('copy')).toBeFalsy()
      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      )
    })

    it('should not show copy button when enableCopy is false', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = createWrapper(message, { enableCopy: false })

      // Copy button should not exist
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
      expect(copyBtn.exists()).toBe(false)
    })

    it('should not show copy button for streaming messages', async () => {
      const message = createMessage({ content: 'Streaming message' })
      const wrapper = createWrapper(message, { enableCopy: true, isStreaming: true })

      // Copy button should not exist for streaming messages
      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
      expect(copyBtn.exists()).toBe(false)
    })

    it('should add copied class to button after successful copy', async () => {
      const message = createMessage({ content: 'Test message' })
      const wrapper = createWrapper(message, { enableCopy: true })

      const copyBtn = wrapper.find('.chatbot-message__action-btn[title="Copy"]')
      await copyBtn.trigger('click')
      await flushPromises()

      // After copy, button should have copied class
      expect(wrapper.find('.chatbot-message__action-btn--copied').exists()).toBe(true)
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const message = createMessage()
      const wrapper = createWrapper(message, { enableDelete: true })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="Delete"]')
      await deleteBtn.trigger('click')
      await nextTick()

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this message?',
        'Delete Message',
        expect.objectContaining({
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning'
        })
      )
    })

    it('should call chatActions.deleteMessage when user confirms deletion', async () => {
      const message = createMessage()
      const wrapper = createWrapper(message, { enableDelete: true })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="Delete"]')
      await deleteBtn.trigger('click')
      await flushPromises()

      // User confirmed, so chatActions.deleteMessage should be called
      expect(mockChatActions.deleteMessage).toHaveBeenCalledWith(message)
    })

    it('should not call chatActions.deleteMessage when user cancels', async () => {
      // Mock cancel behavior - need to reset and re-mock
      ;(ElMessageBox.confirm as any).mockReset()
      ;(ElMessageBox.confirm as any).mockRejectedValueOnce(new Error('cancelled'))

      const message = createMessage()
      const wrapper = createWrapper(message, { enableDelete: true })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="Delete"]')
      await deleteBtn.trigger('click')
      await flushPromises()

      // User cancelled, so chatActions.deleteMessage should not be called
      expect(mockChatActions.deleteMessage).not.toHaveBeenCalled()

      // Reset mock for other tests
      ;(ElMessageBox.confirm as any).mockResolvedValue(true)
    })

    it('should not show delete button when enableDelete is false', async () => {
      const message = createMessage()
      const wrapper = createWrapper(message, { enableDelete: false })

      const deleteBtn = wrapper.find('.chatbot-message__action-btn[title="Delete"]')
      expect(deleteBtn.exists()).toBe(false)
    })
  })
})

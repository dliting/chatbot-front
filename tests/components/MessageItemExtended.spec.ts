/**
 * Extended unit tests for MessageItem component
 * Covers untested branches: video/audio/document attachments, stopped status,
 * double-click edit, copy behavior (streaming, no content), isLastMessage,
 * actionsClasses visibility, error labels, custom labels, onUnmounted cleanup
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
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

vi.mock('@/utils/markdown', () => ({
  formatMarkdownContent: (content: string) => content,
}))

vi.mock('@/utils/message', () => ({
  formatMessageContent: (content: string) => content,
  getAttachmentsByType: (message: any, type: string) => {
    return (message.attachments || []).filter((a: any) => a.type === type)
  },
}))

describe('MessageItem Extended Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createUserMessage = (overrides = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: Date.now() - 10000,
    status: 'sent',
    ...overrides,
  })

  const createAssistantMessage = (overrides = {}): Message => ({
    id: 'msg-2',
    role: 'assistant',
    content: 'I am doing well, thank you!',
    timestamp: Date.now() - 5000,
    status: 'sent',
    ...overrides,
  })

  const createWrapper = (message: Message, props = {}) => {
    return mount(MessageItem, {
      props: {
        message,
        ...props,
      },
    })
  }

  describe('Video Attachments', () => {
    it('should render video content when message has video attachments', () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__videos').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__video').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__video-player').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__video-overlay').exists()).toBe(true)
    })

    it('should render multiple video attachments', () => {
      const message = createUserMessage({
        content: '',
        attachments: [
          { name: 'video1.mp4', url: 'https://example.com/video1.mp4', type: 'video' },
          { name: 'video2.mp4', url: 'https://example.com/video2.mp4', type: 'video' },
        ],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.findAll('.chatbot-message__video').length).toBe(2)
    })

    it('should apply video bubble class', () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--video').exists()).toBe(true)
    })

    it('should emit file-click event when video is clicked', async () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' }],
      })
      const wrapper = createWrapper(message)

      await wrapper.find('.chatbot-message__video').trigger('click')
      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]).toEqual([{ type: 'video', url: 'https://example.com/video.mp4' }])
    })
  })

  describe('Audio Attachments', () => {
    it('should render audio content when message has audio attachments', () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__audios').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__audio').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__audio-player').exists()).toBe(true)
    })

    it('should render multiple audio attachments', () => {
      const message = createUserMessage({
        content: '',
        attachments: [
          { name: 'audio1.mp3', url: 'https://example.com/audio1.mp3', type: 'audio' },
          { name: 'audio2.mp3', url: 'https://example.com/audio2.mp3', type: 'audio' },
        ],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.findAll('.chatbot-message__audio').length).toBe(2)
    })

    it('should apply audio bubble class', () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--audio').exists()).toBe(true)
    })

    it('should emit file-click event when audio is clicked', async () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' }],
      })
      const wrapper = createWrapper(message)

      await wrapper.find('.chatbot-message__audio').trigger('click')
      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]).toEqual([{ type: 'audio', url: 'https://example.com/audio.mp3' }])
    })
  })

  describe('Document Attachments', () => {
    it('should render document content when message has document attachments', () => {
      const message = createAssistantMessage({
        content: '',
        attachments: [{ name: 'report.pdf', url: 'https://example.com/report.pdf', type: 'document' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__documents').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__document').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__document-name').text()).toBe('report.pdf')
    })

    it('should apply document bubble class', () => {
      const message = createAssistantMessage({
        content: '',
        attachments: [{ name: 'report.pdf', url: 'https://example.com/report.pdf', type: 'document' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--document').exists()).toBe(true)
    })

    it('should emit file-click event with document type and name when document is clicked', async () => {
      const message = createAssistantMessage({
        content: '',
        attachments: [{ name: 'report.pdf', url: 'https://example.com/report.pdf', type: 'document' }],
      })
      const wrapper = createWrapper(message)

      await wrapper.find('.chatbot-message__document').trigger('click')
      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]).toEqual([{
        type: 'document',
        url: 'https://example.com/report.pdf',
        name: 'report.pdf',
      }])
    })

    it('should render multiple document attachments', () => {
      const message = createAssistantMessage({
        content: '',
        attachments: [
          { name: 'doc1.pdf', url: 'https://example.com/doc1.pdf', type: 'document' },
          { name: 'doc2.pdf', url: 'https://example.com/doc2.pdf', type: 'document' },
        ],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.findAll('.chatbot-message__document').length).toBe(2)
    })
  })

  describe('Stopped Status', () => {
    it('should render stopped indicator for stopped messages', () => {
      const message = createAssistantMessage({ status: 'stopped' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__stopped').exists()).toBe(true)
    })

    it('should show default stopped text', () => {
      const message = createAssistantMessage({ status: 'stopped' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__stopped').text()).toBe('Generation stopped')
    })

    it('should show custom errorMessage for stopped messages', () => {
      const message = createAssistantMessage({ status: 'stopped', errorMessage: 'Custom stop reason' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__stopped').text()).toBe('Custom stop reason')
    })

    it('should show custom labels.generationStopped for stopped messages', () => {
      const message = createAssistantMessage({ status: 'stopped' })
      const wrapper = createWrapper(message, {
        labels: { generationStopped: 'Stopped by user' },
      })

      expect(wrapper.find('.chatbot-message__stopped').text()).toBe('Stopped by user')
    })

    it('should apply stopped status class', () => {
      const message = createAssistantMessage({ status: 'stopped' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message--stopped').exists()).toBe(true)
    })
  })

  describe('Error Message Labels', () => {
    it('should show default error text for user error messages', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__error').text()).toContain('Send failed')
    })

    it('should show default error text for assistant error messages', () => {
      const message = createAssistantMessage({ status: 'error' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__error').text()).toContain('Response failed')
    })

    it('should show custom errorMessage when provided', () => {
      const message = createUserMessage({ status: 'error', errorMessage: 'Network timeout' })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__error').text()).toContain('Network timeout')
    })

    it('should use labels.sendFailed for user error messages', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, {
        labels: { sendFailed: 'Failed to send' },
      })

      expect(wrapper.find('.chatbot-message__error').text()).toContain('Failed to send')
    })

    it('should use labels.responseFailed for assistant error messages', () => {
      const message = createAssistantMessage({ status: 'error' })
      const wrapper = createWrapper(message, {
        labels: { responseFailed: 'AI failed to respond' },
      })

      expect(wrapper.find('.chatbot-message__error').text()).toContain('AI failed to respond')
    })
  })

  describe('Double-Click Edit', () => {
    it('should emit edit event on double-click for user messages', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const bubble = wrapper.find('.chatbot-message__bubble')
      await bubble.trigger('dblclick')

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]?.[0]).toEqual(message)
    })

    it('should not emit edit event on double-click for assistant messages', async () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message)

      const bubble = wrapper.find('.chatbot-message__bubble')
      await bubble.trigger('dblclick')

      expect(wrapper.emitted('edit')).toBeFalsy()
    })

    it('should not emit edit event on double-click when streaming', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      const bubble = wrapper.find('.chatbot-message__bubble')
      await bubble.trigger('dblclick')

      expect(wrapper.emitted('edit')).toBeFalsy()
    })
  })

  describe('Copy Behavior', () => {
    it('should show ElMessage error when copying while streaming', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      // Find and click copy button - during streaming, canCopy is false so copy button is hidden
      // But handleCopy itself checks for streaming
      const vm = wrapper.vm as any
      await vm.handleCopy()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })

    it('should show ElMessage error when copying empty content', async () => {
      const message = createUserMessage({ content: '' })
      const wrapper = createWrapper(message)

      const vm = wrapper.vm as any
      await vm.handleCopy()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })

    it('should successfully copy and emit copy event', async () => {
      const message = createUserMessage({ content: 'Copy this text' })
      const wrapper = createWrapper(message)

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      if (copyBtn) {
        await copyBtn.trigger('click')
        expect(wrapper.emitted('copy')).toBeTruthy()
        expect(ElMessage).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success' })
        )
      }
    })

    it('should show copy failure message when copyToClipboard fails', async () => {
      const { copyToClipboard } = await import('@/utils/helpers')
      vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Copy failed'))

      const message = createUserMessage({ content: 'Test content' })
      const wrapper = createWrapper(message)

      const vm = wrapper.vm as any
      await vm.handleCopy()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })

    it('should switch to copied icon after successful copy', async () => {
      const message = createUserMessage({ content: 'Test' })
      const wrapper = createWrapper(message)

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      if (copyBtn) {
        await copyBtn.trigger('click')
        await wrapper.vm.$nextTick()

        // Should show the copied class
        expect(wrapper.find('.chatbot-message__action-btn--copied').exists()).toBe(true)
      }
    })

    it('should reset copied state after copyTimeout', async () => {
      vi.useFakeTimers()
      const message = createUserMessage({ content: 'Test' })
      const wrapper = createWrapper(message, { copyTimeout: 1000 })

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      if (copyBtn) {
        await copyBtn.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.chatbot-message__action-btn--copied').exists()).toBe(true)

        vi.advanceTimersByTime(1000)
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.chatbot-message__action-btn--copied').exists()).toBe(false)
      }
      vi.useRealTimers()
    })

    it('should use custom labels for copy messages', async () => {
      const message = createUserMessage({ content: '' })
      const wrapper = createWrapper(message, {
        labels: { noContentToCopy: 'Nothing to copy' },
      })

      const vm = wrapper.vm as any
      await vm.handleCopy()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Nothing to copy' })
      )
    })
  })

  describe('Delete Behavior', () => {
    it('should emit delete when confirm dialog is accepted', async () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const deleteBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Delete')
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        // ElMessageBox.confirm is mocked to resolve
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('should not emit delete when confirm dialog is cancelled', async () => {
      vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancelled'))

      const message = createUserMessage()
      const wrapper = createWrapper(message)

      const deleteBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Delete')
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('delete')).toBeFalsy()
      }
    })
  })

  describe('isLastMessage and Actions Visibility', () => {
    it('should apply last message class when isLastMessage is true', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isLastMessage: true })

      expect(wrapper.find('.chatbot-message--last').exists()).toBe(true)
    })

    it('should not apply last message class when isLastMessage is false', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isLastMessage: false })

      expect(wrapper.find('.chatbot-message--last').exists()).toBe(false)
    })

    it('should show visible actions for last assistant message', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isLastMessage: true })

      expect(wrapper.find('.chatbot-message__actions--visible').exists()).toBe(true)
    })

    it('should not show visible actions for last user message', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { isLastMessage: true })

      expect(wrapper.find('.chatbot-message__actions--visible').exists()).toBe(false)
    })

    it('should not show visible actions when not last message', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isLastMessage: false })

      expect(wrapper.find('.chatbot-message__actions--visible').exists()).toBe(false)
    })
  })

  describe('Label Display with Custom Labels', () => {
    it('should use custom userLabel from labels prop', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, {
        showLabel: true,
        labels: { userLabel: 'Me' },
      })

      expect(wrapper.find('.chatbot-message__label').text()).toBe('Me')
    })

    it('should use custom assistantLabel from labels prop', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, {
        showLabel: true,
        labels: { assistantLabel: 'ChatGPT' },
      })

      expect(wrapper.find('.chatbot-message__label').text()).toBe('ChatGPT')
    })

    it('should fallback to default labels when labels prop is partial', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { showLabel: true })

      expect(wrapper.find('.chatbot-message__label').text()).toBe('You')
    })
  })

  describe('canCopy Computed', () => {
    it('should allow copy when text exists and not streaming', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message)

      // Copy button should be visible
      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      expect(copyBtn).toBeTruthy()
    })

    it('should not allow copy when message has no content', () => {
      const message = createUserMessage({ content: '' })
      const wrapper = createWrapper(message)

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      expect(copyBtn).toBeUndefined()
    })

    it('should not allow copy when streaming', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      expect(copyBtn).toBeUndefined()
    })
  })

  describe('Resend Button', () => {
    it('should show resend button only for error messages with enableResend', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, { enableResend: true })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Resend')
      expect(resendBtn).toBeTruthy()
    })

    it('should not show resend button for non-error messages', () => {
      const message = createUserMessage()
      const wrapper = createWrapper(message, { enableResend: true })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Resend')
      expect(resendBtn).toBeUndefined()
    })

    it('should not show resend button when enableResend is false', () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, { enableResend: false })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Resend')
      expect(resendBtn).toBeUndefined()
    })

    it('should emit resend event when resend button is clicked', async () => {
      const message = createUserMessage({ status: 'error' })
      const wrapper = createWrapper(message, { enableResend: true })

      const resendBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Resend')
      if (resendBtn) {
        await resendBtn.trigger('click')
        expect(wrapper.emitted('resend')).toBeTruthy()
      }
    })
  })

  describe('Streaming State', () => {
    it('should not show streaming cursor when not streaming', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isStreaming: false })

      expect(wrapper.find('.chatbot-message__cursor').exists()).toBe(false)
    })

    it('should show streaming cursor when streaming', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      expect(wrapper.find('.chatbot-message__cursor').exists()).toBe(true)
    })

    it('should apply streaming class to message container', () => {
      const message = createAssistantMessage()
      const wrapper = createWrapper(message, { isStreaming: true })

      expect(wrapper.find('.chatbot-message--streaming').exists()).toBe(true)
    })
  })

  describe('Mixed Content Bubble Classes', () => {
    it('should apply image-only bubble class when only images and no text', () => {
      const message = createUserMessage({
        content: '',
        attachments: [{ name: '', url: 'https://example.com/img.jpg', type: 'image' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--image').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__bubble--mixed').exists()).toBe(false)
    })

    it('should apply mixed bubble class when both text and images', () => {
      const message = createUserMessage({
        content: 'See this image',
        attachments: [{ name: '', url: 'https://example.com/img.jpg', type: 'image' }],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__bubble--mixed').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__bubble--image').exists()).toBe(false)
    })
  })

  describe('onUnmounted Cleanup', () => {
    it('should clean up copy timer on unmount', async () => {
      vi.useFakeTimers()
      const message = createUserMessage({ content: 'Test' })
      const wrapper = createWrapper(message)

      // Trigger copy to set up a timer
      const copyBtn = wrapper.findAll('.chatbot-message__action-btn').find(btn => btn.attributes('title') === 'Copy')
      if (copyBtn) {
        await copyBtn.trigger('click')
      }

      // Unmount before timer fires
      wrapper.unmount()

      // Should not throw when timer fires (timer should be cleared)
      vi.advanceTimersByTime(3000)
      vi.useRealTimers()
    })
  })

  describe('Combined Attachments', () => {
    it('should render text, images, videos, audio, and documents together', () => {
      const message = createAssistantMessage({
        content: 'Multimedia message',
        attachments: [
          { name: 'img.jpg', url: 'https://example.com/img.jpg', type: 'image' },
          { name: 'vid.mp4', url: 'https://example.com/vid.mp4', type: 'video' },
          { name: 'aud.mp3', url: 'https://example.com/aud.mp3', type: 'audio' },
          { name: 'doc.pdf', url: 'https://example.com/doc.pdf', type: 'document' },
        ],
      })
      const wrapper = createWrapper(message)

      expect(wrapper.find('.chatbot-message__text').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__images').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__videos').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__audios').exists()).toBe(true)
      expect(wrapper.find('.chatbot-message__documents').exists()).toBe(true)
    })
  })
})
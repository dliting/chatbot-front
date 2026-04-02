/**
 * Unit tests for message utilities
 */
import { describe, it, expect } from 'vitest'
import {
  createMessage,
  updateMessageStatus,
  updateMessageContent,
  isUserMessage,
  isAssistantMessage,
  hasImages,
  getMessageText,
  groupMessagesByDate,
  getMessagePreview,
  extractTopicTitle,
  filterMessagesByTopic,
  sortMessagesByTimestamp,
  getLastMessage,
  getMessageStats,
  truncateMessage,
  sanitizeMessageContent,
} from '@/utils/message'
import type { Message } from '@/types'

describe('utils/message', () => {
  const mockTopicId = 'topic_123'

  const mockUserMessage: Message = {
    messageId: 'msg_1',
    topicId: mockTopicId,
    role: 'user',
    type: 'text',
    content: 'Hello',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockAssistantMessage: Message = {
    messageId: 'msg_2',
    topicId: mockTopicId,
    role: 'assistant',
    type: 'text',
    content: 'Hi there!',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockImageMessage: Message = {
    messageId: 'msg_3',
    topicId: mockTopicId,
    role: 'user',
    type: 'image',
    content: '',
    attachments: [{ name: 'image.jpg', url: 'https://example.com/image.jpg', type: 'image' }],
    timestamp: Date.now(),
    status: 'sent',
  }

  describe('createMessage', () => {
    it('should create a text message', () => {
      const msg = createMessage('user', 'Test', mockTopicId)

      expect(msg.role).toBe('user')
      expect(msg.content).toBe('Test')
      expect(msg.topicId).toBe(mockTopicId)
      expect(msg.type).toBe('text')
      expect(msg.status).toBe('sending')
    })

    it('should create an image message', () => {
      const attachments = [{ name: 'img.jpg', url: 'https://example.com/img.jpg', type: 'image' as const }]
      const msg = createMessage('user', '', mockTopicId, { attachments })

      expect(msg.attachments).toEqual(attachments)
      expect(msg.type).toBe('image')
    })

    it('should create a mixed message', () => {
      const attachments = [{ name: 'img.jpg', url: 'https://example.com/img.jpg', type: 'image' as const }]
      const msg = createMessage('user', 'Look at this', mockTopicId, { attachments })

      expect(msg.attachments).toEqual(attachments)
      expect(msg.type).toBe('image') // single attachment type => that type, not mixed
    })

    it('should create a video message', () => {
      const attachments = [{ name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' as const }]
      const msg = createMessage('user', '', mockTopicId, { attachments })

      expect(msg.attachments).toEqual(attachments)
      expect(msg.type).toBe('video')
    })

    it('should create an audio message', () => {
      const attachments = [{ name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' as const }]
      const msg = createMessage('user', '', mockTopicId, { attachments })

      expect(msg.attachments).toEqual(attachments)
      expect(msg.type).toBe('audio')
    })

    it('should create message with multiple attachment types', () => {
      const attachments = [
        { name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' as const },
        { name: 'image.jpg', url: 'https://example.com/image.jpg', type: 'image' as const },
        { name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' as const },
      ]
      const msg = createMessage('user', 'Check this', mockTopicId, { attachments })

      expect(msg.attachments).toEqual(attachments)
      expect(msg.type).toBe('mixed')
    })

    it('should create assistant message with loading status', () => {
      const msg = createMessage('assistant', 'Response', mockTopicId)

      expect(msg.status).toBe('loading')
    })
  })

  describe('updateMessageStatus', () => {
    it('should update message status', () => {
      const updated = updateMessageStatus(mockUserMessage, 'error')

      expect(updated.status).toBe('error')
      expect(updated.messageId).toBe(mockUserMessage.messageId)
    })
  })

  describe('updateMessageContent', () => {
    it('should update message content', () => {
      const updated = updateMessageContent(mockAssistantMessage, 'New content')

      expect(updated.content).toBe('New content')
      expect(updated.messageId).toBe(mockAssistantMessage.messageId)
    })
  })

  describe('isUserMessage', () => {
    it('should return true for user messages', () => {
      expect(isUserMessage(mockUserMessage)).toBe(true)
      expect(isUserMessage(mockAssistantMessage)).toBe(false)
    })
  })

  describe('isAssistantMessage', () => {
    it('should return true for assistant messages', () => {
      expect(isAssistantMessage(mockAssistantMessage)).toBe(true)
      expect(isAssistantMessage(mockUserMessage)).toBe(false)
    })
  })

  describe('hasImages', () => {
    it('should return true for messages with images', () => {
      expect(hasImages(mockImageMessage)).toBe(true)
      expect(hasImages(mockUserMessage)).toBe(false)
    })
  })

  describe('getMessageText', () => {
    it('should return content for text messages', () => {
      expect(getMessageText(mockUserMessage)).toBe('Hello')
    })

    it('should return placeholder for image messages', () => {
      const text = getMessageText(mockImageMessage)
      expect(text).toContain('image')
    })

    it('should handle multiple images', () => {
      const msg: Message = {
        ...mockImageMessage,
        attachments: [
          { name: 'a.jpg', url: 'http://a', type: 'image' },
          { name: 'b.jpg', url: 'http://b', type: 'image' },
          { name: 'c.jpg', url: 'http://c', type: 'image' },
        ],
      }
      const text = getMessageText(msg)
      expect(text).toContain('3')
    })
  })

  describe('groupMessagesByDate', () => {
    it('should group messages by date', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const messages: Message[] = [
        { ...mockUserMessage, timestamp: today.getTime() },
        { ...mockAssistantMessage, timestamp: yesterday.getTime() },
      ]

      const groups = groupMessagesByDate(messages)

      expect(groups.size).toBe(2)
    })
  })

  describe('getMessagePreview', () => {
    it('should truncate long messages', () => {
      const longMessage: Message = {
        ...mockUserMessage,
        content: 'a'.repeat(100),
      }

      const preview = getMessagePreview(longMessage, 50)
      expect(preview.length).toBe(53) // 50 + '...'
      expect(preview).toContain('...')
    })

    it('should not truncate short messages', () => {
      const preview = getMessagePreview(mockUserMessage, 50)
      expect(preview).toBe('Hello')
      expect(preview).not.toContain('...')
    })

    it('should handle video messages', () => {
      const videoMessage: Message = {
        ...mockUserMessage,
        content: 'This is a video message',
        type: 'video',
        attachments: [{ name: 'video.mp4', url: 'http://v', type: 'video' }],
      }

      const preview = getMessagePreview(videoMessage, 50)
      expect(preview).toBe('This is a video message')
    })

    it('should handle audio messages', () => {
      const audioMessage: Message = {
        ...mockUserMessage,
        content: 'This is an audio message',
        type: 'audio',
        attachments: [{ name: 'audio.mp3', url: 'http://a', type: 'audio' }],
      }

      const preview = getMessagePreview(audioMessage, 50)
      expect(preview).toBe('This is an audio message')
    })
  })

  describe('extractTopicTitle', () => {
    it('should return AI response as title', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
      ]

      const title = extractTopicTitle(messages)
      expect(title).toBe('Hi there!')
    })

    it('should return default for empty messages', () => {
      const title = extractTopicTitle([])
      expect(title).toBe('新话题')
    })

    it('should return default for user-only messages', () => {
      const title = extractTopicTitle([mockUserMessage])
      expect(title).toBe('新话题')
    })

    it('should truncate long AI responses', () => {
      const longMessage: Message = {
        ...mockAssistantMessage,
        content: 'a'.repeat(100),
      }

      const title = extractTopicTitle([mockUserMessage, longMessage])
      expect(title.length).toBeLessThanOrEqual(33) // 30 + '...'
    })
  })

  describe('filterMessagesByTopic', () => {
    it('should filter messages by topic ID', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
        { ...mockUserMessage, topicId: 'other_topic' },
      ]

      const filtered = filterMessagesByTopic(messages, mockTopicId)
      expect(filtered.length).toBe(2)
    })
  })

  describe('sortMessagesByTimestamp', () => {
    it('should sort messages by timestamp', () => {
      const msg1 = { ...mockUserMessage, timestamp: 3000 }
      const msg2 = { ...mockAssistantMessage, timestamp: 1000 }
      const msg3 = { ...mockImageMessage, timestamp: 2000 }

      const sorted = sortMessagesByTimestamp([msg1, msg2, msg3])
      expect(sorted[0].timestamp).toBe(1000)
      expect(sorted[1].timestamp).toBe(2000)
      expect(sorted[2].timestamp).toBe(3000)
    })
  })

  describe('getLastMessage', () => {
    it('should return the last message', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
      ]

      const last = getLastMessage(messages, mockTopicId)
      expect(last).toEqual(mockAssistantMessage)
    })

    it('should return undefined for empty messages', () => {
      const last = getLastMessage([], mockTopicId)
      expect(last).toBeUndefined()
    })
  })

  describe('getMessageStats', () => {
    it('should calculate message statistics', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
        mockImageMessage,
      ]

      const stats = getMessageStats(messages)
      expect(stats.total).toBe(3)
      expect(stats.user).toBe(2)
      expect(stats.assistant).toBe(1)
      expect(stats.withImages).toBe(1)
    })
  })

  describe('truncateMessage', () => {
    it('should truncate message content', () => {
      const msg: Message = {
        ...mockUserMessage,
        content: 'a'.repeat(200),
      }

      const truncated = truncateMessage(msg, 100)
      expect(truncated.length).toBeLessThanOrEqual(103)
    })
  })

  describe('sanitizeMessageContent', () => {
    it('should sanitize malicious script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('should sanitize event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click</div>'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('onclick')
    })

    it('should allow safe formatting tags', () => {
      const safe = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeMessageContent(safe)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })

    it('should sanitize SVG-based XSS attacks', () => {
      const malicious = '<svg onload="alert(1)">Text</svg>'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('onload')
      expect(result).not.toContain('<svg>')
    })

    it('should sanitize iframe tags', () => {
      const malicious = '<iframe src="javascript:alert(1)"></iframe>Hello'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('<iframe>')
      expect(result).toContain('Hello')
    })

    it('should sanitize CSS-based attacks', () => {
      const malicious = '<div style="background:url(javascript:alert(1))">Text</div>'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('style=')
    })

    it('should sanitize javascript: protocol', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('javascript:')
    })

    it('should sanitize data URLs with script content', () => {
      const malicious = '<img src="data:text/html,<script>alert(1)</script>">'
      const result = sanitizeMessageContent(malicious)
      expect(result).not.toContain('data:text/html')
    })

    it('should handle empty string', () => {
      const result = sanitizeMessageContent('')
      expect(result).toBe('')
    })

    it('should handle string with only whitespace', () => {
      const result = sanitizeMessageContent('   ')
      expect(result).toBe('   ')
    })
  })
})

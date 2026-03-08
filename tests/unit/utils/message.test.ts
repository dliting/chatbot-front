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
  extractSessionTitle,
  filterMessagesBySession,
  sortMessagesByTimestamp,
  getLastMessage,
  getMessageStats,
  truncateMessage,
  sanitizeMessageContent,
} from '@/utils/message'
import type { Message } from '@/types'

describe('utils/message', () => {
  const mockSessionId = 'session_123'

  const mockUserMessage: Message = {
    id: 'msg_1',
    sessionId: mockSessionId,
    role: 'user',
    type: 'text',
    content: 'Hello',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockAssistantMessage: Message = {
    id: 'msg_2',
    sessionId: mockSessionId,
    role: 'assistant',
    type: 'text',
    content: 'Hi there!',
    timestamp: Date.now(),
    status: 'sent',
  }

  const mockImageMessage: Message = {
    id: 'msg_3',
    sessionId: mockSessionId,
    role: 'user',
    type: 'image',
    content: '',
    images: ['https://example.com/image.jpg'],
    timestamp: Date.now(),
    status: 'sent',
  }

  describe('createMessage', () => {
    it('should create a text message', () => {
      const msg = createMessage('user', 'Test', mockSessionId)

      expect(msg.role).toBe('user')
      expect(msg.content).toBe('Test')
      expect(msg.sessionId).toBe(mockSessionId)
      expect(msg.type).toBe('text')
      expect(msg.status).toBe('sending')
    })

    it('should create an image message', () => {
      const images = ['https://example.com/img.jpg']
      const msg = createMessage('user', '', mockSessionId, { images })

      expect(msg.images).toEqual(images)
      expect(msg.type).toBe('image')
    })

    it('should create a mixed message', () => {
      const images = ['https://example.com/img.jpg']
      const msg = createMessage('user', 'Look at this', mockSessionId, { images })

      expect(msg.images).toEqual(images)
      expect(msg.type).toBe('mixed')
    })

    it('should create a video message', () => {
      const videos = ['https://example.com/video.mp4']
      const msg = createMessage('user', '', mockSessionId, { videos })

      expect(msg.videos).toEqual(videos)
      expect(msg.type).toBe('video')
    })

    it('should create an audio message', () => {
      const audios = ['https://example.com/audio.mp3']
      const msg = createMessage('user', '', mockSessionId, { audios })

      expect(msg.audios).toEqual(audios)
      expect(msg.type).toBe('audio')
    })

    it('should create message with multiple attachments', () => {
      const videos = ['https://example.com/video.mp4']
      const images = ['https://example.com/image.jpg']
      const audios = ['https://example.com/audio.mp3']
      const msg = createMessage('user', 'Check this', mockSessionId, {
        videos,
        images,
        audios,
      })

      expect(msg.videos).toEqual(videos)
      expect(msg.images).toEqual(images)
      expect(msg.audios).toEqual(audios)
      expect(msg.type).toBe('video') // video takes precedence
    })

    it('should create assistant message with loading status', () => {
      const msg = createMessage('assistant', 'Response', mockSessionId)

      expect(msg.status).toBe('loading')
    })
  })

  describe('updateMessageStatus', () => {
    it('should update message status', () => {
      const updated = updateMessageStatus(mockUserMessage, 'error')

      expect(updated.status).toBe('error')
      expect(updated.id).toBe(mockUserMessage.id)
    })
  })

  describe('updateMessageContent', () => {
    it('should update message content', () => {
      const updated = updateMessageContent(mockAssistantMessage, 'New content')

      expect(updated.content).toBe('New content')
      expect(updated.id).toBe(mockAssistantMessage.id)
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
      const msg = {
        ...mockImageMessage,
        images: ['a.jpg', 'b.jpg', 'c.jpg'],
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
  })

  describe('extractSessionTitle', () => {
    it('should return AI response as title', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
      ]

      const title = extractSessionTitle(messages)
      expect(title).toBe('Hi there!')
    })

    it('should return default for empty messages', () => {
      const title = extractSessionTitle([])
      expect(title).toBe('New Chat')
    })

    it('should return default for user-only messages', () => {
      const title = extractSessionTitle([mockUserMessage])
      expect(title).toBe('New Chat')
    })

    it('should truncate long AI responses', () => {
      const longMessage: Message = {
        ...mockAssistantMessage,
        content: 'a'.repeat(100),
      }

      const title = extractSessionTitle([mockUserMessage, longMessage])
      expect(title.length).toBeLessThanOrEqual(33) // 30 + '...'
    })
  })

  describe('filterMessagesBySession', () => {
    it('should filter messages by session ID', () => {
      const messages: Message[] = [
        mockUserMessage,
        mockAssistantMessage,
        { ...mockUserMessage, sessionId: 'other_session' },
      ]

      const filtered = filterMessagesBySession(messages, mockSessionId)
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

      const last = getLastMessage(messages, mockSessionId)
      expect(last).toEqual(mockAssistantMessage)
    })

    it('should return undefined for empty messages', () => {
      const last = getLastMessage([], mockSessionId)
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

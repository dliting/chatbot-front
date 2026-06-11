/**
 * Unit tests for backend → frontend mapping functions
 */
import { describe, it, expect } from 'vitest'
import { mapSession, mapMessage, mapCreateSessionResponse, mapSendMessageResponse } from '@/utils/mappers'
import type { BackendSession, BackendMessage, BackendCreateSessionResponse, BackendSendMessageResponse } from '@/types/api'

describe('mapSession', () => {
  const baseSession: BackendSession = {
    sessionId: 'session-123',
    title: 'Test Topic',
    createdAt: 1000,
    updatedAt: 2000,
    messageCount: 5,
    unreadCount: 2,
  }

  it('should map backend session to frontend Topic', () => {
    const result = mapSession(baseSession)

    expect(result.topicId).toBe('session-123')
    expect(result.title).toBe('Test Topic')
    expect(result.createdAt).toBe(1000)
    expect(result.updatedAt).toBe(2000)
    expect(result.messageCount).toBe(5)
    expect(result.unreadCount).toBe(2)
  })

  it('should default messageCount and unreadCount to 0 when absent', () => {
    const session: BackendSession = {
      sessionId: 's-1',
      title: 'Topic',
      createdAt: 1000,
      updatedAt: 2000,
    }

    const result = mapSession(session)

    expect(result.messageCount).toBe(0)
    expect(result.unreadCount).toBe(0)
  })

  it('should preserve sessionId → topicId mapping consistently', () => {
    const result = mapSession({ sessionId: 'abc-456', title: 'T', createdAt: 1, updatedAt: 2 })

    expect(result.topicId).toBe('abc-456')
  })
})

describe('mapMessage', () => {
  const baseMessage: BackendMessage = {
    messageId: 'msg-1',
    sessionId: 'session-123',
    role: 'user',
    content: 'Hello',
    timestamp: 1000,
  }

  it('should map backend message to frontend Message', () => {
    const result = mapMessage(baseMessage, 'fallback-topic')

    expect(result.messageId).toBe('msg-1')
    expect(result.topicId).toBe('session-123')
    expect(result.role).toBe('user')
    expect(result.content).toBe('Hello')
    expect(result.timestamp).toBe(1000)
  })

  it('should use fallbackTopicId when sessionId is missing', () => {
    const msg: BackendMessage = { ...baseMessage, sessionId: '' }
    const result = mapMessage(msg, 'fallback-topic')

    expect(result.topicId).toBe('fallback-topic')
  })

  it('should default type to text when absent', () => {
    const result = mapMessage(baseMessage, 'fallback')

    expect(result.type).toBe('text')
  })

  it('should default status to sent when absent', () => {
    const result = mapMessage(baseMessage, 'fallback')

    expect(result.status).toBe('sent')
  })

  it('should map images to Attachment[]', () => {
    const msg: BackendMessage = { ...baseMessage, images: ['img1.jpg', 'img2.jpg'] }
    const result = mapMessage(msg, 'fallback')

    expect(result.attachments).toEqual([
      { name: '', url: 'img1.jpg', type: 'image' },
      { name: '', url: 'img2.jpg', type: 'image' },
    ])
  })

  it('should map videos to Attachment[]', () => {
    const msg: BackendMessage = { ...baseMessage, videos: ['vid1.mp4'] }
    const result = mapMessage(msg, 'fallback')

    expect(result.attachments).toEqual([
      { name: '', url: 'vid1.mp4', type: 'video' },
    ])
  })

  it('should map audios to Attachment[]', () => {
    const msg: BackendMessage = { ...baseMessage, audios: ['audio1.mp3'] }
    const result = mapMessage(msg, 'fallback')

    expect(result.attachments).toEqual([
      { name: '', url: 'audio1.mp3', type: 'audio' },
    ])
  })

  it('should map documents to Attachment[]', () => {
    const msg: BackendMessage = {
      ...baseMessage,
      documents: [{ name: 'doc.pdf', url: '/files/doc.pdf', size: 1024 }],
    }
    const result = mapMessage(msg, 'fallback')

    expect(result.attachments).toEqual([
      { name: 'doc.pdf', url: '/files/doc.pdf', type: 'document', size: 1024 },
    ])
  })

  it('should map mixed media to combined Attachment[]', () => {
    const msg: BackendMessage = {
      ...baseMessage,
      images: ['img.jpg'],
      videos: ['vid.mp4'],
      audios: ['audio.mp3'],
      documents: [{ name: 'doc.pdf', url: '/doc.pdf' }],
    }
    const result = mapMessage(msg, 'fallback')

    expect(result.attachments!.length).toBe(4)
    expect(result.attachments![0].type).toBe('image')
    expect(result.attachments![1].type).toBe('video')
    expect(result.attachments![2].type).toBe('audio')
    expect(result.attachments![3].type).toBe('document')
  })

  it('should set attachments to empty array when no media', () => {
    const result = mapMessage(baseMessage, 'fallback')

    expect(result.attachments).toEqual([])
  })

  it('should map thinkingContent', () => {
    const msg: BackendMessage = { ...baseMessage, thinkingContent: 'I am thinking...' }
    const result = mapMessage(msg, 'fallback')

    expect(result.thinkingContent).toBe('I am thinking...')
  })

  it('should map thinkingTime', () => {
    const msg: BackendMessage = { ...baseMessage, thinkingTime: 500 }
    const result = mapMessage(msg, 'fallback')

    expect(result.thinkingTime).toBe(500)
  })

  it('should map errorMessage', () => {
    const msg: BackendMessage = { ...baseMessage, errorMessage: 'Something went wrong' }
    const result = mapMessage(msg, 'fallback')

    expect(result.errorMessage).toBe('Something went wrong')
  })

  it('should map metadata', () => {
    const msg: BackendMessage = { ...baseMessage, metadata: { key: 'value' } }
    const result = mapMessage(msg, 'fallback')

    expect(result.metadata).toEqual({ key: 'value' })
  })

  it('should not include undefined optional fields', () => {
    const result = mapMessage(baseMessage, 'fallback')

    expect(result.thinkingContent).toBeUndefined()
    expect(result.thinkingTime).toBeUndefined()
    expect(result.errorMessage).toBeUndefined()
    expect(result.metadata).toBeUndefined()
  })
})

describe('mapCreateSessionResponse', () => {
  it('should map backend create-session response to frontend Topic', () => {
    const raw: BackendCreateSessionResponse = {
      sessionId: 'new-session-1',
      title: 'New Chat',
      createdAt: 3000,
    }

    const result = mapCreateSessionResponse(raw)

    expect(result.topicId).toBe('new-session-1')
    expect(result.title).toBe('New Chat')
    expect(result.createdAt).toBe(3000)
    expect(result.updatedAt).toBe(3000)
    expect(result.messageCount).toBe(0)
    expect(result.unreadCount).toBe(0)
  })

  it('should set updatedAt equal to createdAt', () => {
    const raw: BackendCreateSessionResponse = {
      sessionId: 's-1',
      title: 'T',
      createdAt: 5000,
    }

    const result = mapCreateSessionResponse(raw)

    expect(result.updatedAt).toBe(raw.createdAt)
  })
})

describe('mapSendMessageResponse', () => {
  it('should map backend send-message response to frontend Message', () => {
    const raw: BackendSendMessageResponse = {
      messageId: 'msg-123',
      sessionId: 'session-456',
      role: 'assistant',
      content: 'Hello response',
      timestamp: 1000,
    }

    const result = mapSendMessageResponse(raw, 'fallback-topic')

    expect(result.messageId).toBe('msg-123')
    expect(result.topicId).toBe('session-456')
    expect(result.role).toBe('assistant')
    expect(result.content).toBe('Hello response')
    expect(result.timestamp).toBe(1000)
    expect(result.type).toBe('text')
    expect(result.status).toBe('sent')
  })

  it('should use fallbackTopicId when sessionId is missing', () => {
    const raw: BackendSendMessageResponse = {
      messageId: 'msg-1',
      sessionId: '',
      role: 'assistant',
      content: 'Response',
      timestamp: 1000,
    }

    const result = mapSendMessageResponse(raw, 'fallback-topic')

    expect(result.topicId).toBe('fallback-topic')
  })
})

describe('sessionId → topicId consistency', () => {
  it('should map same sessionId to same topicId across all mapper functions', () => {
    const sessionId = 'consistent-session-id'

    const session = mapSession({
      sessionId,
      title: 'T',
      createdAt: 1,
      updatedAt: 2,
    })

    const createResult = mapCreateSessionResponse({
      sessionId,
      title: 'T',
      createdAt: 1,
    })

    const message = mapMessage({
      messageId: 'm-1',
      sessionId,
      role: 'user',
      content: 'Test',
      timestamp: 1,
    }, 'fallback')

    const sendMessage = mapSendMessageResponse({
      messageId: 'm-2',
      sessionId,
      role: 'assistant',
      content: 'Reply',
      timestamp: 2,
    }, 'fallback')

    expect(session.topicId).toBe(sessionId)
    expect(createResult.topicId).toBe(sessionId)
    expect(message.topicId).toBe(sessionId)
    expect(sendMessage.topicId).toBe(sessionId)
  })
})
import { describe, it, expect } from 'vitest'
import type { Attachment, AttachmentType, Message } from '@/types'
import { deriveMessageType, getAttachmentsByType } from '@/utils/message'

describe('Attachment types', () => {
  it('should accept a valid image attachment', () => {
    const attachment: Attachment = {
      name: 'photo.jpg',
      url: 'https://example.com/photo.jpg',
      type: 'image',
      size: 1024,
      mimeType: 'image/jpeg',
    }
    expect(attachment.type).toBe('image')
  })

  it('should accept all attachment types', () => {
    const types: AttachmentType[] = ['image', 'video', 'audio', 'document']
    types.forEach(type => {
      const a: Attachment = { name: 'test', url: 'http://x', type }
      expect(a.type).toBe(type)
    })
  })

  it('should allow optional fields', () => {
    const a: Attachment = { name: 'test', url: 'http://x', type: 'image' }
    expect(a.size).toBeUndefined()
    expect(a.mimeType).toBeUndefined()
  })
})

describe('deriveMessageType', () => {
  it('should return text for no attachments', () => {
    const result = deriveMessageType({ content: 'hello', attachments: [] })
    expect(result).toBe('text')
  })

  it('should return text for undefined attachments', () => {
    const result = deriveMessageType({ content: 'hello', attachments: undefined })
    expect(result).toBe('text')
  })

  it('should return image for single image attachment', () => {
    const result = deriveMessageType({
      content: '',
      attachments: [{ name: 'a.jpg', url: 'http://x', type: 'image' }],
    })
    expect(result).toBe('image')
  })

  it('should return image for images with text content (single type)', () => {
    const result = deriveMessageType({
      content: 'hello',
      attachments: [{ name: 'a.jpg', url: 'http://x', type: 'image' }],
    })
    expect(result).toBe('image')
  })

  it('should return mixed for multiple attachment types', () => {
    const result = deriveMessageType({
      content: '',
      attachments: [
        { name: 'a.jpg', url: 'http://x', type: 'image' },
        { name: 'b.mp4', url: 'http://x', type: 'video' },
      ],
    })
    expect(result).toBe('mixed')
  })
})

describe('getAttachmentsByType', () => {
  it('should filter attachments by type', () => {
    const msg: Message = {
      messageId: '1', topicId: 't1', role: 'user', type: 'mixed',
      content: 'hi',
      attachments: [
        { name: 'a.jpg', url: 'http://a', type: 'image' },
        { name: 'b.mp4', url: 'http://b', type: 'video' },
        { name: 'c.jpg', url: 'http://c', type: 'image' },
      ],
      timestamp: Date.now(), status: 'sent',
    }
    const images = getAttachmentsByType(msg, 'image')
    expect(images).toHaveLength(2)
    expect(images[0].name).toBe('a.jpg')
  })

  it('should return empty array for no matching type', () => {
    const msg: Message = {
      messageId: '1', topicId: 't1', role: 'user', type: 'text',
      content: 'hi', timestamp: Date.now(), status: 'sent',
    }
    expect(getAttachmentsByType(msg, 'video')).toEqual([])
  })

  it('should return empty array when attachments is undefined', () => {
    const msg: Message = {
      messageId: '1', topicId: 't1', role: 'user', type: 'text',
      content: 'hi', timestamp: Date.now(), status: 'sent',
    }
    expect(getAttachmentsByType(msg, 'image')).toEqual([])
  })
})

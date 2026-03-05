import { describe, it, expect } from 'vitest'
import type { Session } from '@/types'

describe('Session Type', () => {
  it('should have unreadCount field', () => {
    const session: Session = {
      id: '1',
      title: 'Test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      unreadCount: 0  // 新字段
    }
    expect(session.unreadCount).toBe(0)
  })
})

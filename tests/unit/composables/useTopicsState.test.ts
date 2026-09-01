import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTopicsState } from '@/composables/useTopicsState'
import type { Topic } from '@/types'

// Save original localStorage methods
const originalSetItem = localStorage.setItem.bind(localStorage)
const originalGetItem = localStorage.getItem.bind(localStorage)
const originalRemoveItem = localStorage.removeItem.bind(localStorage)
const originalClear = localStorage.clear.bind(localStorage)

// In-memory storage for test isolation
const storage: Record<string, string> = {}

describe('useTopicsState - switchTopic', () => {
  beforeEach(() => {
    // Reset in-memory storage
    Object.keys(storage).forEach(key => delete storage[key])

    // Mock localStorage to use in-memory storage
    localStorage.setItem = (key: string, value: string) => { storage[key] = value }
    localStorage.getItem = (key: string) => storage[key] || null
    localStorage.removeItem = (key: string) => { delete storage[key] }
    localStorage.clear = () => { Object.keys(storage).forEach(key => delete storage[key]) }
  })

  // Restore original localStorage after all tests
  afterAll(() => {
    localStorage.setItem = originalSetItem
    localStorage.getItem = originalGetItem
    localStorage.removeItem = originalRemoveItem
    localStorage.clear = originalClear
  })

  it('should NOT reorder topics when switching', () => {
    const { topics, switchTopic } = useTopicsState({ defaultTitle: 'Test' })

    // Replace the list with controlled test data
    topics.list.length = 0
    topics.list.push(
      { topicId: 't1', title: 'First', createdAt: 100, updatedAt: 100, messageCount: 1, unreadCount: 0 },
      { topicId: 't2', title: 'Second', createdAt: 200, updatedAt: 200, messageCount: 2, unreadCount: 0 },
      { topicId: 't3', title: 'Third', createdAt: 300, updatedAt: 300, messageCount: 0, unreadCount: 0 },
    )

    const orderBefore = topics.list.map((t: Topic) => t.topicId)
    expect(orderBefore).toEqual(['t1', 't2', 't3'])

    // Switch to last topic
    switchTopic('t3')

    // Order should NOT change
    const orderAfter = topics.list.map((t: Topic) => t.topicId)
    expect(orderAfter).toEqual(['t1', 't2', 't3'])

    // But currentId should change
    expect(topics.currentId).toBe('t3')
  })

  it('should move topic to top only on updateTopicAfterMessage', () => {
    const { topics, updateTopicAfterMessage } = useTopicsState({ defaultTitle: 'Test' })

    topics.list.length = 0
    topics.list.push(
      { topicId: 't1', title: 'First', createdAt: 100, updatedAt: 100, messageCount: 1, unreadCount: 0 },
      { topicId: 't2', title: 'Second', createdAt: 200, updatedAt: 200, messageCount: 2, unreadCount: 0 },
    )

    // t1 is at index 0 already; update t2 to move it to top
    updateTopicAfterMessage('t2', 5)

    // t2 should be at the top now
    expect(topics.list[0].topicId).toBe('t2')
    expect(topics.list[0].messageCount).toBe(5)
    // t1 should be pushed down
    expect(topics.list[1].topicId).toBe('t1')
  })

  it('should not reorder when switching to first topic (index 0)', () => {
    const { topics, switchTopic } = useTopicsState({ defaultTitle: 'Test' })

    topics.list.length = 0
    topics.list.push(
      { topicId: 't1', title: 'First', createdAt: 100, updatedAt: 100, messageCount: 1, unreadCount: 0 },
      { topicId: 't2', title: 'Second', createdAt: 200, updatedAt: 200, messageCount: 2, unreadCount: 0 },
    )

    const orderBefore = topics.list.map((t: Topic) => t.topicId)
    switchTopic('t1')
    const orderAfter = topics.list.map((t: Topic) => t.topicId)

    expect(orderAfter).toEqual(orderBefore)
    expect(topics.currentId).toBe('t1')
  })

  it('should not reorder when switching to middle topic', () => {
    const { topics, switchTopic } = useTopicsState({ defaultTitle: 'Test' })

    topics.list.length = 0
    topics.list.push(
      { topicId: 't1', title: 'First', createdAt: 100, updatedAt: 100, messageCount: 1, unreadCount: 0 },
      { topicId: 't2', title: 'Second', createdAt: 200, updatedAt: 200, messageCount: 2, unreadCount: 0 },
      { topicId: 't3', title: 'Third', createdAt: 300, updatedAt: 300, messageCount: 0, unreadCount: 0 },
    )

    const orderBefore = topics.list.map((t: Topic) => t.topicId)
    switchTopic('t2')
    const orderAfter = topics.list.map((t: Topic) => t.topicId)

    expect(orderAfter).toEqual(orderBefore)
    expect(topics.currentId).toBe('t2')
  })
})

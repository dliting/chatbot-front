import { describe, it, expect } from 'vitest'
import { chatActionsKey, topicActionsKey, uiActionsKey } from '@/symbols'

describe('symbols', () => {
  it('should export unique symbol keys', () => {
    expect(typeof chatActionsKey).toBe('symbol')
    expect(typeof topicActionsKey).toBe('symbol')
    expect(typeof uiActionsKey).toBe('symbol')
  })

  it('should have distinct keys', () => {
    expect(chatActionsKey).not.toBe(topicActionsKey)
    expect(chatActionsKey).not.toBe(uiActionsKey)
    expect(topicActionsKey).not.toBe(uiActionsKey)
  })
})

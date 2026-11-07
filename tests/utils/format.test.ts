import { describe, it, expect } from 'vitest'
import { formatTemplate } from '@/utils/format'

describe('formatTemplate', () => {
  it('replaces a single {count} placeholder', () => {
    expect(formatTemplate('{count} messages', { count: 3 })).toBe('3 messages')
  })

  it('replaces multiple occurrences of the same placeholder', () => {
    expect(formatTemplate('{count}/{count}', { count: 2 })).toBe('2/2')
  })

  it('replaces different placeholders', () => {
    expect(formatTemplate('{name} has {count} items', { name: 'Bob', count: 7 })).toBe(
      'Bob has 7 items'
    )
  })

  it('leaves unknown placeholders untouched', () => {
    expect(formatTemplate('{other} {count}', { count: 1 })).toBe('{other} 1')
  })

  it('handles numeric and string values alike', () => {
    expect(formatTemplate('{count}', { count: 0 })).toBe('0')
    expect(formatTemplate('{name}', { name: '' })).toBe('')
  })
})

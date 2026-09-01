import { describe, it, expect } from 'vitest'
import { resolveQuickActionIcon, isBuiltinIconName } from '@/utils/icons'

describe('resolveQuickActionIcon', () => {
  it('should resolve built-in icon names', () => {
    expect(resolveQuickActionIcon('write')).toEqual({ type: 'builtin', value: 'write' })
    expect(resolveQuickActionIcon('analyze')).toEqual({ type: 'builtin', value: 'analyze' })
    expect(resolveQuickActionIcon('translate')).toEqual({ type: 'builtin', value: 'translate' })
    expect(resolveQuickActionIcon('code')).toEqual({ type: 'builtin', value: 'code' })
    expect(resolveQuickActionIcon('search')).toEqual({ type: 'builtin', value: 'search' })
    expect(resolveQuickActionIcon('chat')).toEqual({ type: 'builtin', value: 'chat' })
    expect(resolveQuickActionIcon('brain')).toEqual({ type: 'builtin', value: 'brain' })
    expect(resolveQuickActionIcon('tool')).toEqual({ type: 'builtin', value: 'tool' })
  })

  it('should resolve absolute paths as-is', () => {
    expect(resolveQuickActionIcon('/icons/custom.svg')).toEqual({ type: 'path', value: '/icons/custom.svg' })
  })

  it('should resolve URL paths as-is', () => {
    expect(resolveQuickActionIcon('https://example.com/icon.svg')).toEqual({ type: 'path', value: 'https://example.com/icon.svg' })
    expect(resolveQuickActionIcon('http://example.com/icon.svg')).toEqual({ type: 'path', value: 'http://example.com/icon.svg' })
  })

  it('should resolve relative paths with iconBase', () => {
    expect(resolveQuickActionIcon('my-icon.svg', '/assets/icons')).toEqual({ type: 'path', value: '/assets/icons/my-icon.svg' })
  })

  it('should handle iconBase with trailing slash', () => {
    expect(resolveQuickActionIcon('my-icon.svg', '/assets/icons/')).toEqual({ type: 'path', value: '/assets/icons/my-icon.svg' })
  })

  it('should fall back to letter for undefined icon', () => {
    expect(resolveQuickActionIcon(undefined)).toEqual({ type: 'letter', value: '' })
  })

  it('should fall back to letter for empty string icon', () => {
    expect(resolveQuickActionIcon('')).toEqual({ type: 'letter', value: '' })
  })

  it('should fall back to letter for relative path without iconBase', () => {
    expect(resolveQuickActionIcon('my-icon.svg')).toEqual({ type: 'letter', value: '' })
  })
})

describe('isBuiltinIconName', () => {
  it('should return true for built-in names', () => {
    expect(isBuiltinIconName('write')).toBe(true)
    expect(isBuiltinIconName('tool')).toBe(true)
  })

  it('should return false for non-built-in names', () => {
    expect(isBuiltinIconName('custom')).toBe(false)
    expect(isBuiltinIconName('')).toBe(false)
  })
})

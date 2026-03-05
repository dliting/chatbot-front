import { describe, it, expect } from 'vitest'
import type { Theme } from '@/types'

describe('Theme Type', () => {
  it('should accept system theme', () => {
    const theme: Theme = 'system'
    expect(theme).toBe('system')
  })

  it('should accept light theme', () => {
    const theme: Theme = 'light'
    expect(theme).toBe('light')
  })

  it('should accept dark theme', () => {
    const theme: Theme = 'dark'
    expect(theme).toBe('dark')
  })
})

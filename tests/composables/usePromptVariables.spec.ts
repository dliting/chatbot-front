import { describe, it, expect } from 'vitest'
import { usePromptVariables } from '@/composables/usePromptVariables'

describe('usePromptVariables', () => {
  describe('built-in variables', () => {
    const { resolve } = usePromptVariables()

    it('should resolve {{date}} to current date', async () => {
      const result = await resolve('Today is {{date}}')
      expect(result).toMatch(/Today is \d{4}/)
    })

    it('should resolve {{time}} to current time', async () => {
      const result = await resolve('Time: {{time}}')
      expect(result).toMatch(/Time: \d/)
    })

    it('should resolve {{datetime}} to current datetime', async () => {
      const result = await resolve('Now: {{datetime}}')
      expect(result).toMatch(/Now: \d{4}/)
    })

    it('should resolve {{weekday}} to day of week', async () => {
      const result = await resolve('Day: {{weekday}}')
      expect(result).not.toBe('Day: {{weekday}}')
      expect(result.length).toBeGreaterThan('Day: '.length)
    })

    it('should resolve multiple variables in one prompt', async () => {
      const result = await resolve('{{date}} {{time}}')
      expect(result).not.toContain('{{')
    })
  })

  describe('custom resolvers', () => {
    it('should resolve custom variables', async () => {
      const { resolve } = usePromptVariables({
        customResolvers: {
          username: () => 'Alice',
        },
      })
      const result = await resolve('Hello {{username}}')
      expect(result).toBe('Hello Alice')
    })

    it('should resolve async custom variables', async () => {
      const { resolve } = usePromptVariables({
        customResolvers: {
          user_id: async () => 'user-123',
        },
      })
      const result = await resolve('ID: {{user_id}}')
      expect(result).toBe('ID: user-123')
    })

    it('should mix built-in and custom variables', async () => {
      const { resolve } = usePromptVariables({
        customResolvers: {
          company: () => 'Acme',
        },
      })
      const result = await resolve('{{company}} on {{date}}')
      expect(result).toContain('Acme')
      expect(result).not.toContain('{{')
    })

    it('should allow custom resolvers to override built-in', async () => {
      const { resolve } = usePromptVariables({
        customResolvers: {
          date: () => '2025-01-01',
        },
      })
      const result = await resolve('{{date}}')
      expect(result).toBe('2025-01-01')
    })
  })

  describe('unresolved variables', () => {
    const { resolve } = usePromptVariables()

    it('should leave unresolved variables as-is', async () => {
      const result = await resolve('Hello {{unknown_var}}')
      expect(result).toBe('Hello {{unknown_var}}')
    })

    it('should resolve known and leave unknown', async () => {
      const result = await resolve('{{date}} and {{unknown}}')
      expect(result).not.toContain('{{date}}')
      expect(result).toContain('{{unknown}}')
    })
  })

  describe('edge cases', () => {
    const { resolve } = usePromptVariables()

    it('should return prompt unchanged when no variables', async () => {
      const result = await resolve('No variables here')
      expect(result).toBe('No variables here')
    })

    it('should handle empty prompt', async () => {
      const result = await resolve('')
      expect(result).toBe('')
    })

    it('should resolve multiple occurrences of same variable', async () => {
      const result = await resolve('{{date}} - {{date}}')
      const parts = result.split(' - ')
      expect(parts[0]).toBe(parts[1])
      expect(parts[0]).not.toBe('{{date}}')
    })
  })
})

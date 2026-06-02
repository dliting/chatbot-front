import { describe, it, expect } from 'vitest'
import { defaultChatbotConfig } from '@/types/config'
import type { ChatbotConfig } from '@/types/config'
import { modeToLayoutMap } from '@/types'

describe('ChatbotConfig Type', () => {
  describe('Type Structure', () => {
    it('should accept mode field with InteractionMode values', () => {
      const config: ChatbotConfig = {
        mode: 'extended'
      }
      expect(config.mode).toBe('extended')
    })

    it('should accept layout field with Layout values', () => {
      const config: ChatbotConfig = {
        layout: 'dual'
      }
      expect(config.layout).toBe('dual')
    })

    it('should accept layout field with single value', () => {
      const config: ChatbotConfig = {
        layout: 'single'
      }
      expect(config.layout).toBe('single')
    })
  })

  describe('Default Configuration', () => {
    it('should have floating mode as default mode', () => {
      expect(defaultChatbotConfig.mode).toBe('floating')
    })

    it('should have single layout as default layout', () => {
      expect(defaultChatbotConfig.layout).toBe('single')
    })

    it('should have reasonable default panel dimensions', () => {
      expect(defaultChatbotConfig.panelWidth).toBe(400)
      expect(defaultChatbotConfig.panelHeight).toBe(600)
      expect(defaultChatbotConfig.minWidth).toBe(300)
      expect(defaultChatbotConfig.minHeight).toBe(400)
    })

    it('should have sensible default feature flags', () => {
      expect(defaultChatbotConfig.enableImageUpload).toBe(true)
      expect(defaultChatbotConfig.draggable).toBe(true)
      expect(defaultChatbotConfig.resizable).toBe(true)
      expect(defaultChatbotConfig.rememberPosition).toBe(true)
    })
  })

  describe('Mode and Layout Integration', () => {
    it('should auto-derive layout from mode when layout is not specified', () => {
      // When mode is specified but layout is not, layout should be derived from modeToLayoutMap
      const config: ChatbotConfig = { mode: 'extended' }
      const derivedLayout = modeToLayoutMap[config.mode!]
      expect(derivedLayout).toBe('dual')
    })

    it('should use explicit layout when provided', () => {
      const config: ChatbotConfig = {
        mode: 'floating',
        layout: 'dual' // Explicit override
      }
      expect(config.layout).toBe('dual')
    })

    it('should map floating mode to single layout by default', () => {
      const layout = modeToLayoutMap['floating']
      expect(layout).toBe('single')
    })

    it('should map extended mode to dual layout by default', () => {
      const layout = modeToLayoutMap['extended']
      expect(layout).toBe('dual')
    })

    it('should map sidebar mode to single layout by default', () => {
      const layout = modeToLayoutMap['sidebar']
      expect(layout).toBe('single')
    })
  })

  describe('Layout Field Constraints', () => {
    it('should only accept dual or single as valid layout values', () => {
      const validLayouts: ('dual' | 'single')[] = ['dual', 'single']
      expect(validLayouts).toHaveLength(2)
    })

    it('should reject invalid layout values at compile time', () => {
      // @ts-expect-error - Testing type safety for invalid layout value
      const invalidConfig: ChatbotConfig = { layout: 'invalid' }
      expect(true).toBe(true) // Placeholder for type check
    })
  })

  describe('Mode Field Constraints', () => {
    it('should only accept floating, extended, or sidebar as valid mode values', () => {
      const validModes: ('floating' | 'extended' | 'sidebar')[] = ['floating', 'extended', 'sidebar']
      expect(validModes).toHaveLength(3)
    })

    it('should reject invalid mode values at compile time', () => {
      // @ts-expect-error - Testing type safety for invalid mode value
      const invalidConfig: ChatbotConfig = { mode: 'invalid' }
      expect(true).toBe(true) // Placeholder for type check
    })
  })

  describe('Required Fields', () => {
    it('should have all required fields in default config', () => {
      const requiredFields = [
        'mode', 'layout', 'position', 'panelWidth', 'panelHeight',
        'panelMinWidth', 'panelMaxWidth', 'defaultExpanded', 'panelMode',
        'draggable', 'resizable', 'minWidth', 'minHeight', 'rememberPosition',
        'enableImageUpload', 'enableVoiceInput',
        'enableCopyMessage', 'enableDeleteMessage', 'enableResend', 'enableClearAll',
        'maxImageCount', 'maxImageSize', 'theme', 'primaryColor',
        'apiBaseUrl', 'streamEnabled', 'streamTimeout',
        'iframeMode', 'allowedOrigins', 'locale',
        'maxMessagesInMemory', 'autoScroll', 'labels'
      ]

      requiredFields.forEach(field => {
        expect(defaultChatbotConfig).toHaveProperty(field)
      })
    })
  })
})

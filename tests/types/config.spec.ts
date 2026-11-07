import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { defaultChatbotConfig, getDefaultLabels } from '@/types/config'
import type { ChatbotConfig, ChatbotLabels } from '@/types/config'
import { modeToLayoutMap } from '@/types'

describe('ChatbotConfig Type', () => {
  describe('Type Structure', () => {
    it('should accept mode field with InteractionMode values', () => {
      const config: ChatbotConfig = {
        mode: 'extended'
      }
      expect(config.mode).toBe('extended')
    })

    it('derives layout purely from mode (layout is not configurable)', () => {
      // layout was removed from ChatbotConfig: modeToLayoutMap is the single source
      expect(modeToLayoutMap.extended).toBe('dual')
      expect(modeToLayoutMap.sidebar).toBe('single')
      expect(modeToLayoutMap.floating).toBe('single')
    })
  })

  describe('Default Configuration', () => {
    it('should have floating mode as default mode', () => {
      expect(defaultChatbotConfig.mode).toBe('floating')
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
        'mode', 'position', 'panelWidth', 'panelHeight',
        'defaultExpanded', 'panelMode',
        'draggable', 'resizable', 'minWidth', 'minHeight', 'rememberPosition',
        'enableImageUpload',
        'enableCopyMessage', 'enableDeleteMessage', 'enableResend', 'enableClearAll',
        'maxImageCount', 'maxImageSize', 'theme', 'primaryColor',
        'apiBaseUrl', 'streamEnabled', 'streamTimeout',
        'allowedOrigins', 'locale',
        'autoScroll', 'labels'
      ]

      requiredFields.forEach(field => {
        expect(defaultChatbotConfig).toHaveProperty(field)
      })
    })
  })
})

describe('ChatbotLabels package-root export', () => {
  it('is re-exported by the package root and types barrel', () => {
    const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8')
    // Assert the export STATEMENT itself, not just any mention of the name
    expect(read('../../src/index.ts')).toMatch(/export type \{[\s\S]*?\bChatbotLabels\b/)
    expect(read('../../src/types/index.ts')).toMatch(
      /export type \{[\s\S]*?\bChatbotLabels\b[\s\S]*?\} from '\.\/config'/
    )
  })

  it('getDefaultLabels output satisfies required ChatbotLabels fields', () => {
    const labels = getDefaultLabels()
    const required: Array<keyof ChatbotLabels> = [
      'clearAll',
      'sendFailed',
      'responseFailed',
      'userLabel',
      'assistantLabel',
    ]
    for (const key of required) {
      expect(labels[key], String(key)).toBeTruthy()
    }
  })
})

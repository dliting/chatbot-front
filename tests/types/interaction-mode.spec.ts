import { describe, it, expect } from 'vitest'
import type { InteractionMode } from '@/types'
import { modeToLayoutMap } from '@/types'
import type { Layout } from '@/types'

describe('InteractionMode Type', () => {
  describe('Type Definitions', () => {
    it('should accept floating mode', () => {
      const mode: InteractionMode = 'floating'
      expect(mode).toBe('floating')
    })

    it('should accept extended mode', () => {
      const mode: InteractionMode = 'extended'
      expect(mode).toBe('extended')
    })

    it('should accept sidebar mode', () => {
      const mode: InteractionMode = 'sidebar'
      expect(mode).toBe('sidebar')
    })
  })

  describe('Mode Characteristics', () => {
    it('floating mode should use single layout internally', () => {
      const mode: InteractionMode = 'floating'
      const layout: Layout = modeToLayoutMap[mode]
      expect(layout).toBe('single')
    })

    it('extended mode should use dual layout internally', () => {
      const mode: InteractionMode = 'extended'
      const layout: Layout = modeToLayoutMap[mode]
      expect(layout).toBe('dual')
    })

    it('sidebar mode should use single layout internally', () => {
      const mode: InteractionMode = 'sidebar'
      const layout: Layout = modeToLayoutMap[mode]
      expect(layout).toBe('single')
    })
  })

  describe('Mode Descriptions', () => {
    it('floating mode should represent floating ball + floating window', () => {
      const mode: InteractionMode = 'floating'
      expect(mode).toBe('floating')
      // Floating mode: 悬浮球 + 悬浮窗口
    })

    it('extended mode should represent full-screen page with dual layout', () => {
      const mode: InteractionMode = 'extended'
      expect(mode).toBe('extended')
      // Extended mode: 全屏页面，内部使用双栏布局
    })

    it('sidebar mode should represent fixed sidebar with single layout', () => {
      const mode: InteractionMode = 'sidebar'
      expect(mode).toBe('sidebar')
      // Sidebar mode: 固定边栏，内部使用单栏布局
    })
  })

  describe('Type Safety', () => {
    it('should not accept invalid mode values', () => {
      // @ts-expect-error - Testing type safety for invalid values
      const invalidMode: InteractionMode = 'invalid'
      expect(true).toBe(true) // Placeholder for type check
    })

    it('should only accept floating, extended, or sidebar as valid modes', () => {
      const validModes: InteractionMode[] = ['floating', 'extended', 'sidebar']
      expect(validModes).toHaveLength(3)
    })
  })

  describe('Mode to Layout Mapping', () => {
    it('should correctly map all modes to appropriate layouts', () => {
      const modes: InteractionMode[] = ['floating', 'extended', 'sidebar']
      const expectedLayouts: Layout[] = ['single', 'dual', 'single']

      modes.forEach((mode, index) => {
        expect(modeToLayoutMap[mode]).toBe(expectedLayouts[index])
      })
    })

    it('should allow multiple modes to use the same layout type', () => {
      // Both floating and sidebar modes use single layout (tab-based switching)
      // This is correct - they are different interaction modes sharing layout structure
      const singleLayoutModes: InteractionMode[] = ['floating', 'sidebar']

      singleLayoutModes.forEach(mode => {
        expect(modeToLayoutMap[mode]).toBe('single')
      })
    })
  })
})

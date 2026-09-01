/**
 * Extended unit tests for DraggableWindow component
 * Covers: drag interaction, resize interaction, prop watchers,
 * loadPosition edge cases, window resize handler, no-header slot,
 * computed styles, classes, visibility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DraggableWindow from '@/components/DraggableWindow.vue'

describe('DraggableWindow Extended Tests', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString() },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
    }
  })()

  beforeEach(() => {
    global.localStorage = localStorageMock as Storage
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  const createWrapper = (props = {}, slots = {}) => {
    return mount(DraggableWindow, {
      props: {
        x: 100,
        y: 100,
        width: 400,
        height: 500,
        visible: true,
        ...props,
      },
      slots: {
        header: '<div class="test-header">Window Header</div>',
        default: '<div class="test-content">Window Content</div>',
        ...slots,
      },
      attachTo: document.body,
    })
  }

  describe('Drag Interaction', () => {
    it('should not emit position updates when draggable is false', async () => {
      const wrapper = createWrapper({ draggable: false })
      const header = wrapper.find('.draggable-window__header')

      await header.trigger('mousedown', { clientX: 150, clientY: 150 })
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      await nextTick()

      // No position updates when not draggable
      expect(wrapper.emitted('update:x')).toBeFalsy()
    })

    it('should emit position updates during drag', async () => {
      const wrapper = createWrapper({ draggable: true })
      const header = wrapper.find('.draggable-window__header')

      await header.trigger('mousedown', { clientX: 150, clientY: 150 })
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      await nextTick()

      expect(wrapper.emitted('update:x')).toBeTruthy()
      expect(wrapper.emitted('update:y')).toBeTruthy()
    })

    it('should stop drag on mouseup and emit final position', async () => {
      const wrapper = createWrapper({ draggable: true })
      const header = wrapper.find('.draggable-window__header')

      await header.trigger('mousedown', { clientX: 150, clientY: 150 })
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      await nextTick()

      document.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()

      // After mouseup, dragging class should be gone
      expect(wrapper.find('.draggable-window--dragging').exists()).toBe(false)
    })

    it('should add dragging class during drag', async () => {
      const wrapper = createWrapper({ draggable: true })
      const header = wrapper.find('.draggable-window__header')

      await header.trigger('mousedown', { clientX: 150, clientY: 150 })
      await nextTick()

      // Should have dragging class during active drag
      expect(wrapper.find('.draggable-window--dragging').exists()).toBe(true)

      document.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()
    })
  })

  describe('Prop Watchers', () => {
    it('should update window position when x prop changes', async () => {
      const wrapper = createWrapper({ x: 100, y: 100 })

      await wrapper.setProps({ x: 200 })
      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('left: 200px')
    })

    it('should update window position when y prop changes', async () => {
      const wrapper = createWrapper({ x: 100, y: 100 })

      await wrapper.setProps({ y: 200 })
      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('top: 200px')
    })

    it('should update window size when width prop changes', async () => {
      const wrapper = createWrapper({ width: 400 })

      await wrapper.setProps({ width: 600 })
      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('width: 600px')
    })

    it('should update window size when height prop changes', async () => {
      const wrapper = createWrapper({ height: 500 })

      await wrapper.setProps({ height: 700 })
      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('height: 700px')
    })

    it('should not update position from prop while dragging', async () => {
      const wrapper = createWrapper({ x: 100, y: 100, draggable: true })
      const header = wrapper.find('.draggable-window__header')

      // Start drag
      await header.trigger('mousedown', { clientX: 150, clientY: 150 })

      // Try to update x via prop while dragging - position should stay at drag location
      await wrapper.setProps({ x: 300 })
      await nextTick()

      // Position should still be controlled by drag (not the new prop)
      const style = wrapper.find('.draggable-window').attributes('style')
      // The left position should not be 300px since we're dragging
      expect(style).not.toContain('left: 300px')

      document.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()
    })
  })

  describe('loadPosition Edge Cases', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.setItem('test-pos', 'invalid-json{')

      const wrapper = createWrapper({
        storageKey: 'test-pos',
        rememberPosition: true,
      })

      expect(wrapper.find('.draggable-window').exists()).toBe(true)
    })

    it('should not load position when rememberPosition is false', () => {
      localStorageMock.setItem('test-pos', JSON.stringify({ x: 200, y: 300, width: 500, height: 600 }))

      const wrapper = createWrapper({
        storageKey: 'test-pos',
        rememberPosition: false,
      })

      // Should use default props (x: 100, y: 100)
      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('left: 100px')
      expect(style).toContain('top: 100px')
    })

    it('should handle missing properties in stored position', () => {
      localStorageMock.setItem('test-partial', JSON.stringify({ x: 200 }))

      const wrapper = createWrapper({
        storageKey: 'test-partial',
        rememberPosition: true,
      })

      expect(wrapper.find('.draggable-window').exists()).toBe(true)
    })
  })

  describe('Window Resize Handler', () => {
    it('should not throw on window resize event', () => {
      const wrapper = createWrapper({ x: 100, y: 100 })

      expect(() => {
        window.dispatchEvent(new Event('resize'))
      }).not.toThrow()

      expect(wrapper.find('.draggable-window').exists()).toBe(true)
    })
  })

  describe('No Header Slot', () => {
    it('should not render header when no header slot is provided', () => {
      const wrapper = mount(DraggableWindow, {
        props: { x: 100, y: 100, width: 400, height: 500, visible: true },
        slots: {
          default: '<div class="test-content">Content</div>',
        },
        attachTo: document.body,
      })

      expect(wrapper.find('.draggable-window__header').exists()).toBe(false)
      expect(wrapper.find('.draggable-window__body').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('windowStyle Computed', () => {
    it('should apply correct styles for position and size', () => {
      const wrapper = createWrapper({ x: 50, y: 75, width: 300, height: 400, zIndex: 100 })

      const style = wrapper.find('.draggable-window').attributes('style')
      expect(style).toContain('left: 50px')
      expect(style).toContain('top: 75px')
      expect(style).toContain('width: 300px')
      expect(style).toContain('height: 400px')
      expect(style).toContain('z-index: 100')
    })
  })

  describe('classes Computed', () => {
    it('should include theme class', () => {
      const wrapper = createWrapper({ theme: 'dark' })
      expect(wrapper.find('.draggable-window--dark').exists()).toBe(true)
    })

    it('should include rounded class when rounded is true', () => {
      const wrapper = createWrapper({ rounded: true })
      expect(wrapper.find('.draggable-window--rounded').exists()).toBe(true)
    })

    it('should not include rounded class when rounded is false', () => {
      const wrapper = createWrapper({ rounded: false })
      expect(wrapper.find('.draggable-window--rounded').exists()).toBe(false)
    })

    it('should include dragging class during drag', async () => {
      const wrapper = createWrapper({ draggable: true })
      const header = wrapper.find('.draggable-window__header')

      await header.trigger('mousedown', { clientX: 150, clientY: 150 })
      await nextTick()

      expect(wrapper.find('.draggable-window--dragging').exists()).toBe(true)

      document.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()

      expect(wrapper.find('.draggable-window--dragging').exists()).toBe(false)
    })
  })

  describe('Cleanup on Unmount', () => {
    it('should remove all event listeners on unmount without error', () => {
      const wrapper = createWrapper({ draggable: true, resizable: true })
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('Edge Cases with minSize', () => {
    it('should enforce minWidth when loading position from storage', () => {
      localStorageMock.setItem('test-minw', JSON.stringify({
        x: 100, y: 100, width: 100, height: 500,
      }))

      const wrapper = createWrapper({
        storageKey: 'test-minw',
        rememberPosition: true,
        minWidth: 200,
      })

      const style = wrapper.find('.draggable-window').attributes('style')
      // Width should be >= minWidth (200)
      const widthMatch = style?.match(/width: (\d+)px/)
      if (widthMatch) {
        expect(parseInt(widthMatch[1])).toBeGreaterThanOrEqual(200)
      }
    })

    it('should enforce minHeight when loading position from storage', () => {
      localStorageMock.setItem('test-minh', JSON.stringify({
        x: 100, y: 100, width: 400, height: 100,
      }))

      const wrapper = createWrapper({
        storageKey: 'test-minh',
        rememberPosition: true,
        minHeight: 300,
      })

      const style = wrapper.find('.draggable-window').attributes('style')
      const heightMatch = style?.match(/height: (\d+)px/)
      if (heightMatch) {
        expect(parseInt(heightMatch[1])).toBeGreaterThanOrEqual(300)
      }
    })
  })

  describe('Visibility', () => {
    it('should render window with visible true', () => {
      const wrapper = createWrapper({ visible: true })
      expect(wrapper.find('.draggable-window').exists()).toBe(true)
    })

    it('should render window div even when visible is false', async () => {
      const wrapper = createWrapper({ visible: false })
      await nextTick()

      expect(wrapper.find('.draggable-window').exists()).toBe(true)
    })
  })
})
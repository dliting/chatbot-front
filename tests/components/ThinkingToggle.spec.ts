/**
 * Tests for ThinkingToggle component
 * Covers: rendering, click emit, toggle state, disabled state, tooltip
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThinkingToggle from '@/components/ThinkingToggle.vue'

describe('ThinkingToggle', () => {
  const createWrapper = (props = {}) => {
    return mount(ThinkingToggle, {
      props: {
        enabled: false,
        disabled: false,
        tooltip: '',
        ...props,
      },
    })
  }

  describe('Rendering', () => {
    it('should render a button element', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should render with the thinking-toggle class', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('button.thinking-toggle').exists()).toBe(true)
    })

    it('should render a lightbulb SVG icon', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('svg.thinking-toggle__icon').exists()).toBe(true)
    })
  })

  describe('Click behavior', () => {
    it('should emit update:enabled on click', async () => {
      const wrapper = createWrapper({ enabled: false })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:enabled')).toBeTruthy()
      expect(wrapper.emitted('update:enabled')![0][0]).toBe(true)
    })

    it('should toggle state on click', async () => {
      const wrapper = createWrapper({ enabled: false })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:enabled')![0][0]).toBe(true)
    })

    it('should emit false when already enabled', async () => {
      const wrapper = createWrapper({ enabled: true })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:enabled')![0][0]).toBe(false)
    })
  })

  describe('Disabled state', () => {
    it('should not emit when disabled', async () => {
      const wrapper = createWrapper({ enabled: false, disabled: true })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:enabled')).toBeFalsy()
    })

    it('should set disabled attribute on button', () => {
      const wrapper = createWrapper({ disabled: true })
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('Active state', () => {
    it('should apply active class when enabled', () => {
      const wrapper = createWrapper({ enabled: true })
      expect(wrapper.find('button').classes()).toContain('thinking-toggle--active')
    })

    it('should NOT apply active class when disabled (not enabled)', () => {
      const wrapper = createWrapper({ enabled: false })
      expect(wrapper.find('button').classes()).not.toContain('thinking-toggle--active')
    })
  })

  describe('Tooltip', () => {
    it('should render tooltip attribute', () => {
      const wrapper = createWrapper({ tooltip: 'Toggle thinking' })
      expect(wrapper.find('button').attributes('title')).toBe('Toggle thinking')
    })

    it('should have empty title when no tooltip provided', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('button').attributes('title')).toBe('')
    })
  })
})

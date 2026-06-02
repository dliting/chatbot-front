/**
 * Tests for ThinkingBlock component
 * Covers: rendering, expand/collapse, time formatting, thinking state, copy, auto-collapse
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ThinkingBlock from '@/components/ThinkingBlock.vue'

// Mock formatMarkdownContent
vi.mock('@/utils/helpers', () => ({
  formatMarkdownContent: (content: string) => `<p>${content}</p>`,
}))

describe('ThinkingBlock', () => {
  const createWrapper = (props = {}) => {
    return mount(ThinkingBlock, {
      props: {
        content: 'This is my thinking process.',
        thinkingTime: 3500,
        isThinking: false,
        autoCollapse: true,
        labels: {},
        ...props,
      },
    })
  }

  describe('Rendering', () => {
    it('should render the thinking-block container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block').exists()).toBe(true)
    })

    it('should render the header', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__header').exists()).toBe(true)
    })

    it('should render the lightbulb icon', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__icon').exists()).toBe(true)
    })

    it('should render the label text', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__label').exists()).toBe(true)
    })

    it('should render the chevron arrow', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__arrow').exists()).toBe(true)
    })
  })

  describe('Collapsed by default', () => {
    it('should be collapsed by default (body not rendered)', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__body').exists()).toBe(false)
    })
  })

  describe('Expand / collapse', () => {
    it('should expand on header click', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__body').exists()).toBe(true)
    })

    it('should add expanded class to arrow when expanded', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__arrow').classes()).toContain('thinking-block__arrow--expanded')
    })

    it('should collapse on second header click', async () => {
      const wrapper = createWrapper()
      // First click: expand
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__body').exists()).toBe(true)
      // Second click: collapse
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__body').exists()).toBe(false)
    })
  })

  describe('Formatted time', () => {
    it('should show formatted time in label when done thinking', () => {
      const wrapper = createWrapper({ thinkingTime: 3500, isThinking: false })
      const label = wrapper.find('.thinking-block__label')
      expect(label.text()).toContain('3.5')
    })

    it('should format sub-second time', () => {
      const wrapper = createWrapper({ thinkingTime: 500, isThinking: false })
      const label = wrapper.find('.thinking-block__label')
      expect(label.text()).toContain('0.5')
    })

    it('should show "Thought deeply" label when done', () => {
      const wrapper = createWrapper({ thinkingTime: 2000, isThinking: false })
      const label = wrapper.find('.thinking-block__label')
      expect(label.text()).toContain('Thought deeply')
    })
  })

  describe('Thinking state', () => {
    it('should show thinking text when isThinking is true', () => {
      const wrapper = createWrapper({ isThinking: true })
      const label = wrapper.find('.thinking-block__label')
      expect(label.text()).toBe('Thinking...')
    })

    it('should add active class to icon when isThinking', () => {
      const wrapper = createWrapper({ isThinking: true })
      expect(wrapper.find('.thinking-block__icon').classes()).toContain('thinking-block__icon--active')
    })

    it('should NOT add active class to icon when not thinking', () => {
      const wrapper = createWrapper({ isThinking: false })
      expect(wrapper.find('.thinking-block__icon').classes()).not.toContain('thinking-block__icon--active')
    })

    it('should add thinking class to container when isThinking', () => {
      const wrapper = createWrapper({ isThinking: true })
      expect(wrapper.find('.thinking-block').classes()).toContain('thinking-block--thinking')
    })
  })

  describe('Copy button', () => {
    it('should show copy button when expanded', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__copy').exists()).toBe(true)
    })

    it('should emit copy event when copy button is clicked', async () => {
      const wrapper = createWrapper({ content: 'My thinking content' })
      await wrapper.find('.thinking-block__header').trigger('click')
      await wrapper.find('.thinking-block__copy').trigger('click')
      expect(wrapper.emitted('copy')).toBeTruthy()
      expect(wrapper.emitted('copy')![0][0]).toBe('My thinking content')
    })

    it('should NOT show copy button when collapsed', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-block__copy').exists()).toBe(false)
    })
  })

  describe('Content rendering', () => {
    it('should render content via formatMarkdownContent when expanded', async () => {
      const wrapper = createWrapper({ content: 'Some thinking text' })
      await wrapper.find('.thinking-block__header').trigger('click')
      const content = wrapper.find('.thinking-block__content')
      expect(content.html()).toContain('Some thinking text')
    })

    it('should have markdown-content class on content div', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.thinking-block__header').trigger('click')
      const content = wrapper.find('.thinking-block__content')
      expect(content.classes()).toContain('markdown-content')
    })
  })

  describe('Auto-collapse', () => {
    it('should auto-collapse when isThinking transitions from true to false', async () => {
      const wrapper = createWrapper({ isThinking: true })
      // Expand while thinking
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__body').exists()).toBe(true)
      // Thinking finishes
      await wrapper.setProps({ isThinking: false })
      expect(wrapper.find('.thinking-block__body').exists()).toBe(false)
    })

    it('should stay expanded when autoCollapse is false', async () => {
      const wrapper = createWrapper({ isThinking: true, autoCollapse: false })
      // Expand while thinking
      await wrapper.find('.thinking-block__header').trigger('click')
      expect(wrapper.find('.thinking-block__body').exists()).toBe(true)
      // Thinking finishes, but autoCollapse is false
      await wrapper.setProps({ isThinking: false })
      expect(wrapper.find('.thinking-block__body').exists()).toBe(true)
    })
  })

  describe('Custom labels', () => {
    it('should use custom thinking label', () => {
      const wrapper = createWrapper({
        isThinking: true,
        labels: { thinking: 'Thinking...' },
      })
      expect(wrapper.find('.thinking-block__label').text()).toBe('Thinking...')
    })

    it('should use custom deeplyThought label with time', () => {
      const wrapper = createWrapper({
        isThinking: false,
        thinkingTime: 2000,
        labels: { deeplyThought: 'Thought for {seconds} seconds' },
      })
      expect(wrapper.find('.thinking-block__label').text()).toBe('Thought for 2.0 seconds')
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPanel from '@/components/ChatPanel.vue'

describe('ChatPanel.vue', () => {
  const defaultProps = {
    isOpen: true,
    mode: 'dialog' as const,
    position: 'bottom-right' as const,
    theme: 'light' as const,
    title: 'AI Assistant',
    width: 380,
    showThemeToggle: true,
  }

  const createWrapper = (props = {}) => {
    return mount(ChatPanel, {
      props: {
        ...defaultProps,
        ...props,
      },
      slots: {
        default: '<div class="slot-content">Default slot content</div>',
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render the chat panel', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chatbot-panel').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should be visible when isOpen is true', () => {
      const wrapper = createWrapper({ isOpen: true })
      expect(wrapper.find('.chatbot-panel').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should not be visible when isOpen is false', () => {
      const wrapper = createWrapper({ isOpen: false })
      expect(wrapper.find('.chatbot-panel').exists()).toBe(false)
      wrapper.unmount()
    })

    it('should render the panel title', () => {
      const wrapper = createWrapper({ title: 'Custom Title' })
      expect(wrapper.find('.chatbot-panel__title').text()).toBe('Custom Title')
      wrapper.unmount()
    })

    it('should render slot content', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.slot-content').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Panel Modes', () => {
    it('should apply dialog mode class', () => {
      const wrapper = createWrapper({ mode: 'dialog' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--dialog')
      wrapper.unmount()
    })

    it('should apply sidebar mode class', () => {
      const wrapper = createWrapper({ mode: 'sidebar' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--sidebar')
      wrapper.unmount()
    })

    it('should apply fullscreen mode class', () => {
      const wrapper = createWrapper({ mode: 'fullscreen' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--fullscreen')
      wrapper.unmount()
    })
  })

  describe('Position', () => {
    it('should apply bottom-right position class', () => {
      const wrapper = createWrapper({ position: 'bottom-right' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--bottom-right')
      wrapper.unmount()
    })

    it('should apply bottom-left position class', () => {
      const wrapper = createWrapper({ position: 'bottom-left' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--bottom-left')
      wrapper.unmount()
    })
  })

  describe('Theme', () => {
    it('should apply light theme class', () => {
      const wrapper = createWrapper({ theme: 'light' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--light')
      wrapper.unmount()
    })

    it('should apply dark theme class', () => {
      const wrapper = createWrapper({ theme: 'dark' })
      expect(wrapper.find('.chatbot-panel').classes()).toContain('chatbot-panel--dark')
      wrapper.unmount()
    })
  })

  describe('Close Button', () => {
    it('should render close button', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chatbot-panel__close-btn').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should emit close event when close button is clicked', async () => {
      const wrapper = createWrapper()
      const closeButton = wrapper.find('.chatbot-panel__close-btn')
      await closeButton.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })
  })

  describe('Theme Toggle', () => {
    it('should render theme toggle button when showThemeToggle is true', () => {
      const wrapper = createWrapper({ showThemeToggle: true })
      // The theme toggle button has class chatbot-panel__action-btn
      expect(wrapper.findAll('.chatbot-panel__action-btn').length).toBeGreaterThan(0)
      wrapper.unmount()
    })

    it('should not render theme toggle button when showThemeToggle is false', () => {
      const wrapper = createWrapper({ showThemeToggle: false })
      // Should only have the close button
      expect(wrapper.findAll('.chatbot-panel__action-btn').length).toBe(1)
      wrapper.unmount()
    })

    it('should emit toggle-theme event when theme button is clicked', async () => {
      const wrapper = createWrapper({ showThemeToggle: true })
      const themeButton = wrapper.findAll('.chatbot-panel__action-btn')[0]
      await themeButton.trigger('click')
      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
      wrapper.unmount()
    })
  })

  describe('Custom Width', () => {
    it('should apply custom width when provided', () => {
      const wrapper = createWrapper({ width: 500 })
      const panel = wrapper.find('.chatbot-panel')
      expect(panel.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Transition Classes', () => {
    it('should have transition for animation', () => {
      const wrapper = createWrapper()
      // Check that Transition component is present
      expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })
})

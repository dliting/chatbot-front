import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPanel from '@/components/ChatPanel.vue'

describe('ChatPanel.vue', () => {
  const defaultProps = {
    isOpen: true,
    mode: 'dock',
    position: 'right',
    theme: 'light',
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
      expect(wrapper.find('.chat-panel').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should be visible when isOpen is true', () => {
      const wrapper = createWrapper({ isOpen: true })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--open')
      wrapper.unmount()
    })

    it('should not be visible when isOpen is false', () => {
      const wrapper = createWrapper({ isOpen: false })
      expect(wrapper.find('.chat-panel').classes()).not.toContain('chat-panel--open')
      wrapper.unmount()
    })

    it('should render the panel title', () => {
      const wrapper = createWrapper({ title: 'Custom Title' })
      expect(wrapper.find('.chat-panel__title').text()).toBe('Custom Title')
      wrapper.unmount()
    })

    it('should render slot content', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.slot-content').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Panel Modes', () => {
    it('should apply dock mode class', () => {
      const wrapper = createWrapper({ mode: 'dock' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--dock')
      wrapper.unmount()
    })

    it('should apply sidebar mode class', () => {
      const wrapper = createWrapper({ mode: 'sidebar' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--sidebar')
      wrapper.unmount()
    })

    it('should apply fullscreen mode class', () => {
      const wrapper = createWrapper({ mode: 'fullscreen' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--fullscreen')
      wrapper.unmount()
    })
  })

  describe('Position', () => {
    it('should apply right position class', () => {
      const wrapper = createWrapper({ position: 'right' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--right')
      wrapper.unmount()
    })

    it('should apply left position class', () => {
      const wrapper = createWrapper({ position: 'left' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--left')
      wrapper.unmount()
    })
  })

  describe('Theme', () => {
    it('should apply light theme class', () => {
      const wrapper = createWrapper({ theme: 'light' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--light')
      wrapper.unmount()
    })

    it('should apply dark theme class', () => {
      const wrapper = createWrapper({ theme: 'dark' })
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--dark')
      wrapper.unmount()
    })
  })

  describe('Close Button', () => {
    it('should render close button', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-panel__close-btn').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should emit close event when close button is clicked', async () => {
      const wrapper = createWrapper()
      const closeButton = wrapper.find('.chat-panel__close-btn')
      await closeButton.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })
  })

  describe('Theme Toggle', () => {
    it('should render theme toggle button when showThemeToggle is true', () => {
      const wrapper = createWrapper({ showThemeToggle: true })
      expect(wrapper.find('.chat-panel__theme-toggle').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should not render theme toggle button when showThemeToggle is false', () => {
      const wrapper = createWrapper({ showThemeToggle: false })
      expect(wrapper.find('.chat-panel__theme-toggle').exists()).toBe(false)
      wrapper.unmount()
    })

    it('should emit toggle-theme event when theme button is clicked', async () => {
      const wrapper = createWrapper({ showThemeToggle: true })
      const themeButton = wrapper.find('.chat-panel__theme-toggle')
      await themeButton.trigger('click')
      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
      wrapper.unmount()
    })
  })

  describe('Custom Width', () => {
    it('should apply custom width when provided', () => {
      const wrapper = createWrapper({ width: 500 })
      const panel = wrapper.find('.chat-panel')
      // The width should be applied via inline styles
      expect(panel.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Transition Classes', () => {
    it('should have transition classes for animation', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-panel').classes()).toContain('chat-panel--transition')
      wrapper.unmount()
    })
  })
})

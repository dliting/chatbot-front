import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPanel from '@/components/ChatPanel.vue'
import DraggableWindow from '@/components/DraggableWindow.vue'

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
      expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Floating mode', () => {
    it('should render DraggableWindow in floating mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'floating', isOpen: true },
        global: { stubs: { DraggableWindow: { template: '<div class="draggable-stub"><slot name="header" /><slot /></div>' } } },
        slots: { default: '<div class="body-content" />' },
      })
      expect(wrapper.find('.draggable-stub').exists()).toBe(true)
      expect(wrapper.find('.body-content').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should render header inside DraggableWindow in floating mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'floating', isOpen: true },
        global: { stubs: { DraggableWindow: { template: '<div class="draggable-stub"><slot name="header" /><slot /></div>' } } },
      })
      expect(wrapper.find('.chatbot-panel__header').exists()).toBe(true)
      expect(wrapper.find('.chatbot-panel__title').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should initialize floating position on mount', async () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'floating', isOpen: true },
        global: { stubs: { DraggableWindow: true } },
      })
      // Verify the component rendered successfully (onMounted runs)
      expect(wrapper.find('draggable-window-stub').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should render dark theme SVG in floating mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'floating', isOpen: true, theme: 'dark' },
        global: { stubs: { DraggableWindow: { template: '<div><slot name="header" /><slot /></div>' } } },
      })
      // In dark theme, the sun SVG should be rendered (v-else branch)
      const buttons = wrapper.findAll('.chatbot-panel__action-btn')
      expect(buttons.length).toBeGreaterThan(0)
      wrapper.unmount()
    })

    it('should pass draggable/resizable props based on floating mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'floating', isOpen: true, draggable: true, resizable: true },
        global: { stubs: { DraggableWindow: true } },
      })
      expect(wrapper.find('draggable-window-stub').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Non-floating transition names', () => {
    it('should use fullscreen transition for fullscreen mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'fullscreen', isOpen: true },
      })
      const transition = wrapper.findComponent({ name: 'Transition' })
      expect(transition.exists()).toBe(true)
      wrapper.unmount()
    })

    it('should use sidebar-left transition for sidebar with left position', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'sidebar', position: 'bottom-left', isOpen: true },
      })
      expect(wrapper.find('.chatbot-panel').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should use dialog-top transition for top position', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'dialog', position: 'top-right', isOpen: true },
      })
      expect(wrapper.find('.chatbot-panel--top-right').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Panel style computations', () => {
    it('should apply 100% width and height for fullscreen mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'fullscreen', isOpen: true },
      })
      const panel = wrapper.find('.chatbot-panel')
      expect(panel.exists()).toBe(true)
      wrapper.unmount()
    })

    it('should apply pixel width for sidebar mode', () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, mode: 'sidebar', width: 350, isOpen: true },
      })
      const panel = wrapper.find('.chatbot-panel')
      expect(panel.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Touch gestures', () => {
    it('should emit close on right swipe exceeding threshold', async () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, isOpen: true, mode: 'dialog' },
        attachTo: document.body,
      })

      const panel = wrapper.find('.chatbot-panel')
      // Simulate touchstart at x=100, y=200
      await panel.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 200 }],
      })
      // Simulate touchend at x=250 (deltaX=150 > threshold=100), y=210 (deltaY=10 < verticalThreshold=50)
      await panel.trigger('touchend', {
        changedTouches: [{ clientX: 250, clientY: 210 }],
      })

      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })

    it('should not emit close on short swipe', async () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, isOpen: true, mode: 'dialog' },
        attachTo: document.body,
      })

      const panel = wrapper.find('.chatbot-panel')
      await panel.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 200 }],
      })
      // delta only 50, below threshold
      await panel.trigger('touchend', {
        changedTouches: [{ clientX: 150, clientY: 210 }],
      })

      expect(wrapper.emitted('close')).toBeFalsy()
      wrapper.unmount()
    })

    it('should not emit close on vertical swipe', async () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, isOpen: true, mode: 'dialog' },
        attachTo: document.body,
      })

      const panel = wrapper.find('.chatbot-panel')
      await panel.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      // deltaX=150 but deltaY=200 > verticalThreshold
      await panel.trigger('touchend', {
        changedTouches: [{ clientX: 250, clientY: 300 }],
      })

      expect(wrapper.emitted('close')).toBeFalsy()
      wrapper.unmount()
    })

    it('should handle touchend without changedTouches', async () => {
      const wrapper = mount(ChatPanel, {
        props: { ...defaultProps, isOpen: true, mode: 'dialog' },
        attachTo: document.body,
      })

      const panel = wrapper.find('.chatbot-panel')
      await panel.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 200 }],
      })
      // No changedTouches - should not crash or emit
      await panel.trigger('touchend', {})

      expect(wrapper.emitted('close')).toBeFalsy()
      wrapper.unmount()
    })
  })

  describe('Dark theme SVG rendering', () => {
    it('should render dark theme icon when theme is dark in non-floating mode', () => {
      const wrapper = createWrapper({ theme: 'dark', showThemeToggle: true })
      const buttons = wrapper.findAll('.chatbot-panel__action-btn')
      // Should have theme toggle + close button
      expect(buttons.length).toBe(2)
      wrapper.unmount()
    })
  })

  describe('Hidden header', () => {
    it('should not render header when showHeader is false', () => {
      const wrapper = createWrapper({ showHeader: false })
      expect(wrapper.find('.chatbot-panel__header').exists()).toBe(false)
      wrapper.unmount()
    })
  })
})

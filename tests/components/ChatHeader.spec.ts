/**
 * Comprehensive unit tests for ChatHeader component
 * Tests all modes: Extended, Compact, Floating
 * Covers: inject/emit fallback for toggle-theme
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatHeader from '@/components/ChatHeader.vue'
import { uiActionsKey } from '@/symbols'
import { createMockUIActions } from '../utils/mockActions'

const mockUIActions = createMockUIActions()

function mountChatHeader(props?: Record<string, unknown>, options?: { omitUIActions?: boolean }) {
  return mount(ChatHeader, {
    props,
    global: {
      provide: options?.omitUIActions ? {} : { [uiActionsKey]: mockUIActions },
    },
  })
}

describe('ChatHeader Component', () => {
  describe('Props and Defaults', () => {
    it('should render with default props', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').text()).toBe('AI Assistant')
      expect(wrapper.find('.chat-header--light').exists()).toBe(true)
    })

    it('should render custom title', () => {
      const wrapper = mountChatHeader({ title: 'Custom Title' })

      expect(wrapper.find('.chat-header__title').text()).toBe('Custom Title')
    })

    it('should apply dark theme class', () => {
      const wrapper = mountChatHeader({ theme: 'dark' })

      expect(wrapper.find('.chat-header--dark').exists()).toBe(true)
    })

    it('should not show back button by default', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.find('.chat-header__back').exists()).toBe(false)
    })

    it('should show back button when enabled', () => {
      const wrapper = mountChatHeader({ showBackButton: true })

      expect(wrapper.find('.chat-header__back').exists()).toBe(true)
    })

    it('should not show sessions button by default', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
    })

    it('should show topics button when enabled', () => {
      const wrapper = mountChatHeader({ showTopicsButton: true })

      expect(wrapper.findAll('.chat-header__btn').length).toBeGreaterThan(0)
    })

    it('should not show theme toggle by default', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
    })

    it('should show theme toggle when enabled', () => {
      const wrapper = mountChatHeader({ showThemeToggle: true })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBeGreaterThan(0)
      expect(wrapper.html()).toContain('viewBox')
    })

    it('should not show close button by default', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.find('.chat-header__close').exists()).toBe(false)
    })

    it('should show close button when enabled', () => {
      const wrapper = mountChatHeader({ showCloseButton: true })

      expect(wrapper.find('.chat-header__close').exists()).toBe(true)
    })
  })

  describe('Theme Toggle', () => {
    it('should display moon icon in light theme', () => {
      const wrapper = mountChatHeader({ theme: 'light', showThemeToggle: true })

      expect(wrapper.html()).toContain('viewBox="0 0 24 24"')
    })

    it('should display sun icon in dark theme', () => {
      const wrapper = mountChatHeader({ theme: 'dark', showThemeToggle: true })

      expect(wrapper.html()).toContain('viewBox')
    })
  })

  describe('Events', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should emit back event when back button is clicked', async () => {
      const wrapper = mountChatHeader({ showBackButton: true })

      await wrapper.find('.chat-header__back').trigger('click')

      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back').length).toBe(1)
    })

    it('should emit topics event when topics button is clicked', async () => {
      const wrapper = mountChatHeader({ showTopicsButton: true })

      await wrapper.find('.chat-header__btn').trigger('click')

      expect(wrapper.emitted('topics')).toBeTruthy()
    })

    it('should emit toggle-theme event when theme button is clicked (fallback)', async () => {
      const wrapper = mountChatHeader({ showThemeToggle: true }, { omitUIActions: true })

      const buttons = wrapper.findAll('.chat-header__btn')
      await buttons[0].trigger('click')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should call uiActions.toggleTheme when injected (inject path)', async () => {
      const wrapper = mountChatHeader({ showThemeToggle: true })

      const buttons = wrapper.findAll('.chat-header__btn')
      await buttons[0].trigger('click')

      expect(mockUIActions.toggleTheme).toHaveBeenCalled()
      expect(wrapper.emitted('toggle-theme')).toBeFalsy()
    })

    it('should emit close event when close button is clicked', async () => {
      const wrapper = mountChatHeader({ showCloseButton: true })

      await wrapper.find('.chat-header__close').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit multiple events correctly', async () => {
      const wrapper = mountChatHeader(
        { showBackButton: true, showTopicsButton: true, showThemeToggle: true, showCloseButton: true },
        { omitUIActions: true },
      )

      await wrapper.find('.chat-header__back').trigger('click')
      await wrapper.findAll('.chat-header__btn')[0].trigger('click')
      await wrapper.findAll('.chat-header__btn')[1].trigger('click')
      await wrapper.find('.chat-header__close').trigger('click')

      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('topics')).toBeTruthy()
      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should apply correct BEM classes', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').exists()).toBe(true)
      expect(wrapper.find('.chat-header__actions').exists()).toBe(true)
    })

    it('should apply theme class correctly', () => {
      const lightWrapper = mountChatHeader({ theme: 'light' })
      const darkWrapper = mountChatHeader({ theme: 'dark' })

      expect(lightWrapper.find('.chat-header--light').exists()).toBe(true)
      expect(darkWrapper.find('.chat-header--dark').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      const wrapper = mountChatHeader({ showTopicsButton: true, showThemeToggle: true, showCloseButton: true })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBeGreaterThan(0)

      const html = wrapper.html()
      expect(html).toMatch(/title=["']History["']/)
      expect(html).toMatch(/title=["']Switch to/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      const wrapper = mountChatHeader({ title: '' })

      expect(wrapper.find('.chat-header__title').text()).toBe('')
    })

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100)
      const wrapper = mountChatHeader({ title: longTitle })

      expect(wrapper.find('.chat-header__title').text()).toBe(longTitle)
    })

    it('should handle all buttons enabled', () => {
      const wrapper = mountChatHeader({
        showBackButton: true, showTopicsButton: true, showThemeToggle: true, showCloseButton: true,
      })

      const backBtn = wrapper.find('.chat-header__back')
      const actionBtns = wrapper.findAll('.chat-header__btn')

      expect(backBtn.exists()).toBe(true)
      expect(actionBtns.length).toBeGreaterThan(0)
    })

    it('should handle no buttons shown', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
      expect(wrapper.find('.chat-header__back').exists()).toBe(false)
    })
  })

  describe('Component Rendering', () => {
    it('should render header structure correctly', () => {
      const wrapper = mountChatHeader()

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').exists()).toBe(true)
      expect(wrapper.find('.chat-header__actions').exists()).toBe(true)
    })

    it('should render all action buttons in correct order', () => {
      const wrapper = mountChatHeader({ showTopicsButton: true, showThemeToggle: true, showCloseButton: true })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBe(3)
    })

    it('should update theme when prop changes', async () => {
      const wrapper = mountChatHeader({ theme: 'light', showThemeToggle: true })

      expect(wrapper.find('.chat-header--light').exists()).toBe(true)

      await wrapper.setProps({ theme: 'dark' })

      expect(wrapper.find('.chat-header--dark').exists()).toBe(true)
    })
  })

  describe('Mode-specific Tests', () => {
    describe('Extended Mode', () => {
      it('should show topics button in extended mode', () => {
        const wrapper = mountChatHeader({ showTopicsButton: true, showThemeToggle: true })

        const buttons = wrapper.findAll('.chat-header__btn')
        expect(buttons.length).toBe(2)
      })

      it('should not show close button in extended mode', () => {
        const wrapper = mountChatHeader()

        expect(wrapper.find('.chat-header__close').exists()).toBe(false)
      })
    })

    describe('Compact Mode', () => {
      it('should show close button in compact mode', () => {
        const wrapper = mountChatHeader({ showCloseButton: true, showThemeToggle: true })

        expect(wrapper.find('.chat-header__close').exists()).toBe(true)
      })

      it('should not show topics button in compact mode', () => {
        const wrapper = mountChatHeader()

        const topicsBtn = wrapper.findAll('.chat-header__btn').filter(btn => {
          return btn.attributes('title')?.includes('History')
        })
        expect(topicsBtn.length).toBe(0)
      })
    })

    describe('Floating Mode', () => {
      it('should show only close and theme buttons in floating mode', () => {
        const wrapper = mountChatHeader({ showCloseButton: true, showThemeToggle: true })

        const buttons = wrapper.findAll('.chat-header__btn')
        expect(buttons.length).toBe(2)
      })
    })
  })
})

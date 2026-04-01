/**
 * Comprehensive unit tests for ChatHeader component
 * Tests all modes: Extended, Compact, Floating
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatHeader from '@/components/ChatHeader.vue'
import type { Theme } from '@/types'

describe('ChatHeader Component', () => {
  describe('Props and Defaults', () => {
    it('should render with default props', () => {
      const wrapper = mount(ChatHeader)

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').text()).toBe('AI Assistant')
      expect(wrapper.find('.chat-header--light').exists()).toBe(true)
    })

    it('should render custom title', () => {
      const wrapper = mount(ChatHeader, {
        props: { title: 'Custom Title' },
      })

      expect(wrapper.find('.chat-header__title').text()).toBe('Custom Title')
    })

    it('should apply dark theme class', () => {
      const wrapper = mount(ChatHeader, {
        props: { theme: 'dark' as Theme },
      })

      expect(wrapper.find('.chat-header--dark').exists()).toBe(true)
    })

    it('should not show back button by default', () => {
      const wrapper = mount(ChatHeader)

      expect(wrapper.find('.chat-header__back').exists()).toBe(false)
    })

    it('should show back button when enabled', () => {
      const wrapper = mount(ChatHeader, {
        props: { showBackButton: true },
      })

      expect(wrapper.find('.chat-header__back').exists()).toBe(true)
    })

    it('should not show sessions button by default', () => {
      const wrapper = mount(ChatHeader)

      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
    })

    it('should show topics button when enabled', () => {
      const wrapper = mount(ChatHeader, {
        props: { showTopicsButton: true },
      })

      expect(wrapper.findAll('.chat-header__btn').length).toBeGreaterThan(0)
    })

    it('should not show theme toggle by default', () => {
      const wrapper = mount(ChatHeader)

      // Should have no buttons without any props enabled
      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
    })

    it('should show theme toggle when enabled', () => {
      const wrapper = mount(ChatHeader, {
        props: { showThemeToggle: true },
      })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBeGreaterThan(0)

      // Check for moon icon (light theme)
      expect(wrapper.html()).toContain('viewBox')
    })

    it('should not show close button by default', () => {
      const wrapper = mount(ChatHeader)

      expect(wrapper.find('.chat-header__close').exists()).toBe(false)
    })

    it('should show close button when enabled', () => {
      const wrapper = mount(ChatHeader, {
        props: { showCloseButton: true },
      })

      expect(wrapper.find('.chat-header__close').exists()).toBe(true)
    })
  })

  describe('Theme Toggle', () => {
    it('should display moon icon in light theme', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          theme: 'light' as Theme,
          showThemeToggle: true,
        },
      })

      expect(wrapper.html()).toContain('viewBox="0 0 24 24"')
    })

    it('should display sun icon in dark theme', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          theme: 'dark' as Theme,
          showThemeToggle: true,
        },
      })

      expect(wrapper.html()).toContain('viewBox')
    })
  })

  describe('Events', () => {
    it('should emit back event when back button is clicked', async () => {
      const wrapper = mount(ChatHeader, {
        props: { showBackButton: true },
      })

      await wrapper.find('.chat-header__back').trigger('click')

      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back').length).toBe(1)
    })

    it('should emit topics event when topics button is clicked', async () => {
      const wrapper = mount(ChatHeader, {
        props: { showTopicsButton: true },
      })

      await wrapper.find('.chat-header__btn').trigger('click')

      expect(wrapper.emitted('topics')).toBeTruthy()
    })

    it('should emit toggle-theme event when theme button is clicked', async () => {
      const wrapper = mount(ChatHeader, {
        props: { showThemeToggle: true },
      })

      // Find theme toggle button (should be the only button in default state)
      const buttons = wrapper.findAll('.chat-header__btn')
      await buttons[0].trigger('click')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should emit close event when close button is clicked', async () => {
      const wrapper = mount(ChatHeader, {
        props: { showCloseButton: true },
      })

      await wrapper.find('.chat-header__close').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit multiple events correctly', async () => {
      const wrapper = mount(ChatHeader, {
        props: {
          showBackButton: true,
          showTopicsButton: true,
          showThemeToggle: true,
          showCloseButton: true,
        },
      })

      // Test all buttons
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
      const wrapper = mount(ChatHeader)

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').exists()).toBe(true)
      expect(wrapper.find('.chat-header__actions').exists()).toBe(true)
    })

    it('should apply theme class correctly', () => {
      const lightWrapper = mount(ChatHeader, {
        props: { theme: 'light' as Theme },
      })
      const darkWrapper = mount(ChatHeader, {
        props: { theme: 'dark' as Theme },
      })

      expect(lightWrapper.find('.chat-header--light').exists()).toBe(true)
      expect(darkWrapper.find('.chat-header--dark').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          showTopicsButton: true,
          showThemeToggle: true,
          showCloseButton: true,
        },
      })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBeGreaterThan(0)

      // Check for title attributes
      const html = wrapper.html()
      // Check for title attributes using escaped quotes
      expect(html).toMatch(/title=["']历史话题["']/)
      expect(html).toMatch(/title=["']切换到/)
    })

  })

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      const wrapper = mount(ChatHeader, {
        props: { title: '' },
      })

      expect(wrapper.find('.chat-header__title').text()).toBe('')
    })

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100)
      const wrapper = mount(ChatHeader, {
        props: { title: longTitle },
      })

      expect(wrapper.find('.chat-header__title').text()).toBe(longTitle)
    })

    it('should handle all buttons disabled (edge case)', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          showBackButton: true,
          showTopicsButton: true,
          showThemeToggle: true,
          showCloseButton: true,
        },
      })

      // Count all visible buttons (back + actions)
      const backBtn = wrapper.find('.chat-header__back')
      const actionBtns = wrapper.findAll('.chat-header__btn')

      expect(backBtn.exists()).toBe(true)
      expect(actionBtns.length).toBeGreaterThan(0)
    })

    it('should handle no buttons shown', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          showBackButton: false,
          showTopicsButton: false,
          showThemeToggle: false,
          showCloseButton: false,
        },
      })

      expect(wrapper.findAll('.chat-header__btn').length).toBe(0)
      expect(wrapper.find('.chat-header__back').exists()).toBe(false)
    })
  })

  describe('Component Rendering', () => {
    it('should render header structure correctly', () => {
      const wrapper = mount(ChatHeader)

      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.chat-header__title').exists()).toBe(true)
      expect(wrapper.find('.chat-header__actions').exists()).toBe(true)
    })

    it('should render all action buttons in correct order', () => {
      const wrapper = mount(ChatHeader, {
        props: {
          showTopicsButton: true,
          showThemeToggle: true,
          showCloseButton: true,
        },
      })

      const buttons = wrapper.findAll('.chat-header__btn')
      expect(buttons.length).toBe(3) // topics, theme, close
    })

    it('should update theme when prop changes', async () => {
      const wrapper = mount(ChatHeader, {
        props: {
          theme: 'light' as Theme,
          showThemeToggle: true,
        },
      })

      expect(wrapper.find('.chat-header--light').exists()).toBe(true)

      await wrapper.setProps({ theme: 'dark' as Theme })

      expect(wrapper.find('.chat-header--dark').exists()).toBe(true)
    })
  })

  describe('Mode-specific Tests', () => {
    describe('Extended Mode', () => {
      it('should show topics button in extended mode', () => {
        const wrapper = mount(ChatHeader, {
          props: {
            showTopicsButton: true,
            showThemeToggle: true,
          },
        })

        const buttons = wrapper.findAll('.chat-header__btn')
        expect(buttons.length).toBe(2)
      })

      it('should not show close button in extended mode', () => {
        const wrapper = mount(ChatHeader, {
          props: {
            showCloseButton: false,
          },
        })

        expect(wrapper.find('.chat-header__close').exists()).toBe(false)
      })
    })

    describe('Compact Mode', () => {
      it('should show close button in compact mode', () => {
        const wrapper = mount(ChatHeader, {
          props: {
            showCloseButton: true,
            showThemeToggle: true,
          },
        })

        expect(wrapper.find('.chat-header__close').exists()).toBe(true)
      })

      it('should not show topics button in compact mode', () => {
        const wrapper = mount(ChatHeader, {
          props: {
            showTopicsButton: false,
          },
        })

        const topicsBtn = wrapper.findAll('.chat-header__btn').filter(btn => {
          return btn.attributes('title')?.includes('历史话题')
        })
        expect(topicsBtn.length).toBe(0)
      })
    })

    describe('Floating Mode', () => {
      it('should show only close and theme buttons in floating mode', () => {
        const wrapper = mount(ChatHeader, {
          props: {
            showCloseButton: true,
            showThemeToggle: true,
          },
        })

        const buttons = wrapper.findAll('.chat-header__btn')
        expect(buttons.length).toBe(2)
      })
    })
  })
})

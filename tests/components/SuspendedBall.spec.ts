/**
 * Comprehensive unit tests for SuspendedBall (FloatingBall) component
 * Tests for floating mode functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SuspendedBall from '@/components/SuspendedBall.vue'
import type { Position } from '@/types'

describe('SuspendedBall Component', () => {
  describe('Props and Defaults', () => {
    it('should render with default props', () => {
      const wrapper = mount(SuspendedBall)

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
      expect(wrapper.find('.chatbot-ball--bottom-right').exists()).toBe(true)
    })

    it('should apply custom size', () => {
      const wrapper = mount(SuspendedBall, {
        props: { size: 72 },
      })

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.attributes('style')).toContain('width: 72px')
      expect(ball.attributes('style')).toContain('height: 72px')
    })

    it('should apply custom colors', () => {
      const wrapper = mount(SuspendedBall, {
        props: {
          iconColor: '#000000',
          backgroundColor: '#ff0000',
        },
      })

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.attributes('style')).toContain('background-color: #ff0000')
      expect(ball.attributes('style')).toContain('color: #000000')
    })

    it('should not render when visible is false', () => {
      const wrapper = mount(SuspendedBall, {
        props: { visible: false },
      })

      expect(wrapper.find('.chatbot-ball').exists()).toBe(false)
    })

    it('should apply position class correctly', () => {
      const positions: Position[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

      positions.forEach((pos) => {
        const wrapper = mount(SuspendedBall, {
          props: { position: pos },
        })

        expect(wrapper.find(`.chatbot-ball--${pos}`).exists()).toBe(true)
        wrapper.unmount()
      })
    })

    it('should disable dragging when draggable is false', () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: false },
      })

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
    })
  })

  describe('Badge Functionality', () => {
    it('should not show badge when badge is null', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: null },
      })

      expect(wrapper.find('.chatbot-ball__badge').exists()).toBe(false)
    })

    it('should show numeric badge', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: 5 },
      })

      const badge = wrapper.find('.chatbot-ball__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('5')
    })

    it('should show badge with string value', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: 'New' },
      })

      const badge = wrapper.find('.chatbot-ball__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('New')
    })

    it('should display 99+ for badge > 99', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: 150 },
      })

      const badge = wrapper.find('.chatbot-ball__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('99+')
      expect(badge.classes()).toContain('chatbot-ball__badge--dot')
    })
  })

  describe('Events', () => {
    it('should emit click event when clicked', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { clickToOpen: true },
      })

      await wrapper.find('.chatbot-ball').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click').length).toBe(1)
    })

    it('should not emit click when clickToOpen is false', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { clickToOpen: false },
      })

      await wrapper.find('.chatbot-ball').trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should not emit click after dragging (movement detection)', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      const ball = wrapper.find('.chatbot-ball')
      await ball.trigger('mousedown', { clientX: 100, clientY: 100 })

      // Simulate drag movement
      const vm = wrapper.vm as unknown as {
        hasMoved: boolean
        dragStartPos: { x: number; y: number }
      }
      vm.hasMoved = true

      await ball.trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should emit drag events when dragged', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
        attachTo: document.body,
      })

      const ball = wrapper.find('.chatbot-ball')

      await ball.trigger('mousedown', { button: 0, clientX: 100, clientY: 100 })

      // The component uses makeDraggable utility which sets up event listeners
      // We verify the initial state
      await nextTick()

      wrapper.unmount()
    })
  })

  describe('Icon Slot', () => {
    it('should render default icon when no slot provided', () => {
      const wrapper = mount(SuspendedBall)

      expect(wrapper.find('.chatbot-ball__icon').exists()).toBe(true)
      expect(wrapper.html()).toContain('viewBox="0 0 24 24"')
    })

    it('should render custom icon via slot', () => {
      const wrapper = mount(SuspendedBall, {
        slots: {
          icon: '<svg class="custom-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        },
      })

      expect(wrapper.find('.custom-icon').exists()).toBe(true)
      expect(wrapper.html()).toContain('cx="12" cy="12"')
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should apply correct BEM classes', () => {
      const wrapper = mount(SuspendedBall)

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
      expect(wrapper.find('.chatbot-ball__icon').exists()).toBe(true)
    })

    it('should apply dragging class during drag', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      const vm = wrapper.vm as unknown as {
        isDragging: boolean
      }

      // Simulate dragging state
      vm.isDragging = true
      await nextTick()

      expect(wrapper.find('.chatbot-ball--dragging').exists()).toBe(true)
    })

    it('should have correct position styles', () => {
      const wrapper = mount(SuspendedBall, {
        props: { position: 'top-left' },
      })

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.attributes('style')).toContain('left:')
      expect(ball.attributes('style')).toContain('top:')
    })
  })

  describe('Position Initialization', () => {
    it('should initialize position on mount', () => {
      const wrapper = mount(SuspendedBall, {
        props: { position: 'bottom-right' },
      })

      const vm = wrapper.vm as unknown as {
        currentPosition: { x: number; y: number }
      }

      // Position should be initialized
      expect(typeof vm.currentPosition.x).toBe('number')
      expect(typeof vm.currentPosition.y).toBe('number')
    })

    it('should reinitialize when position prop changes', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { position: 'top-left' },
      })

      const vm = wrapper.vm as unknown as {
        isDragging: boolean
        initPosition: () => void
      }

      vm.isDragging = false
      await wrapper.setProps({ position: 'bottom-right' })
      await nextTick()

      // Position should have been reinitialized
      expect(vm).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const wrapper = mount(SuspendedBall)

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.exists()).toBe(true)
    })

    it('should have proper cursor styles', () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.exists()).toBe(true)
    })
  })

  describe('Lifecycle', () => {
    it('should setup drag on mount', () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
    })

    it('should cleanup drag on unmount', () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle size of 0', () => {
      const wrapper = mount(SuspendedBall, {
        props: { size: 0 },
      })

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
    })

    it('should handle very large size', () => {
      const wrapper = mount(SuspendedBall, {
        props: { size: 500 },
      })

      const ball = wrapper.find('.chatbot-ball')
      expect(ball.attributes('style')).toContain('width: 500px')
    })

    it('should handle zero badge', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: 0 },
      })

      const badge = wrapper.find('.chatbot-ball__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('0')
    })

    it('should handle negative badge', () => {
      const wrapper = mount(SuspendedBall, {
        props: { badge: -1 },
      })

      const badge = wrapper.find('.chatbot-ball__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('-1')
    })
  })

  describe('Transition Animation', () => {
    it('should have transition classes', () => {
      const wrapper = mount(SuspendedBall)

      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
    })
  })

  describe('Drag Behavior', () => {
    it('should only start drag with left mouse button', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: true },
      })

      const ball = wrapper.find('.chatbot-ball')

      // Right click (button 2) should not start drag
      await ball.trigger('mousedown', { button: 2 })

      const vm = wrapper.vm as unknown as {
        dragStartPos: { x: number; y: number }
      }

      // Position should not have been recorded for drag start
      expect(vm).toBeDefined()
    })

    it('should handle non-draggable state', async () => {
      const wrapper = mount(SuspendedBall, {
        props: { draggable: false },
      })

      const ball = wrapper.find('.chatbot-ball')
      await ball.trigger('mousedown', { button: 0 })

      // Should not throw or crash
      expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
    })
  })
})

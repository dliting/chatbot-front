/**
 * Unit tests for SuspendedBall badge functionality (unreadCount prop)
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SuspendedBall from '@/components/SuspendedBall.vue'

describe('SuspendedBall Badge (unreadCount)', () => {
  it('should show badge when unreadCount > 0', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        unreadCount: 5,
        visible: true
      }
    })

    expect(wrapper.find('.suspended-ball__badge').exists()).toBe(true)
    expect(wrapper.find('.suspended-ball__badge').text()).toBe('5')
  })

  it('should show 99+ when unreadCount > 99', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        unreadCount: 150,
        visible: true
      }
    })

    expect(wrapper.find('.suspended-ball__badge').text()).toBe('99+')
  })

  it('should NOT show badge when unreadCount = 0', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        unreadCount: 0,
        visible: true
      }
    })

    expect(wrapper.find('.suspended-ball__badge').exists()).toBe(false)
  })

  it('should NOT show badge when unreadCount is undefined', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true
      }
    })

    expect(wrapper.find('.suspended-ball__badge').exists()).toBe(false)
  })
})

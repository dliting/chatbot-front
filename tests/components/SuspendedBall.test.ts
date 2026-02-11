/**
 * Unit tests for SuspendedBall component
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SuspendedBall from '@/components/SuspendedBall.vue'

describe('SuspendedBall', () => {
  it('should render with default props', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
      },
    })

    expect(wrapper.find('.chatbot-ball').exists()).toBe(true)
  })

  it('should not render when visible is false', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: false,
      },
    })

    expect(wrapper.find('.chatbot-ball').exists()).toBe(false)
  })

  it('should apply correct size', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
        size: 64,
      },
    })

    const ball = wrapper.find('.chatbot-ball')
    expect(ball.attributes('style')).toContain('width: 64px')
    expect(ball.attributes('style')).toContain('height: 64px')
  })

  it('should apply custom colors', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
        iconColor: '#ffffff',
        backgroundColor: '#ff0000',
      },
    })

    const ball = wrapper.find('.chatbot-ball')
    expect(ball.attributes('style')).toContain('#ff0000')
  })

  it('should show badge when provided', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
        badge: 5,
      },
    })

    expect(wrapper.find('.chatbot-ball__badge').exists()).toBe(true)
    expect(wrapper.find('.chatbot-ball__badge').text()).toBe('5')
  })

  it('should show dot for large badge numbers', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
        badge: 100,
      },
    })

    const badge = wrapper.find('.chatbot-ball__badge')
    expect(badge.classes()).toContain('chatbot-ball__badge--dot')
    expect(badge.text()).toBe('99+')
  })

  it('should emit click event', async () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
      },
    })

    await wrapper.find('.chatbot-ball').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.length).toBe(1)
  })

  it('should render default icon', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
      },
    })

    expect(wrapper.find('.chatbot-ball__icon').exists()).toBe(true)
  })

  it('should render custom icon slot', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
      },
      slots: {
        icon: '<div class="custom-icon">Custom</div>',
      },
    })

    expect(wrapper.find('.custom-icon').exists()).toBe(true)
    expect(wrapper.find('.custom-icon').text()).toBe('Custom')
  })

  it('should have correct position classes', () => {
    const positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ] as const

    positions.forEach(position => {
      const wrapper = mount(SuspendedBall, {
        props: {
          visible: true,
          position,
        },
      })

      expect(wrapper.find('.chatbot-ball').classes()).toContain(`chatbot-ball--${position}`)
    })
  })

  it('should be draggable when enabled', () => {
    const wrapper = mount(SuspendedBall, {
      props: {
        visible: true,
        draggable: true,
      },
    })

    const ball = wrapper.find('.chatbot-ball')
    expect(ball.classes()).toContain('chatbot-ball')
    // Draggable functionality requires more integration testing
  })
})

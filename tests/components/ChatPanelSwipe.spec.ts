import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPanel from '@/components/ChatPanel.vue'

describe('ChatPanel Swipe Gesture', () => {
  it('should emit close on swipe left to right', async () => {
    const wrapper = mount(ChatPanel, {
      props: {
        isOpen: true,
        mode: 'sidebar'
      },
      emits: ['close']
    })

    const el = wrapper.find('.chatbot-panel')

    // Touch start
    await el.trigger('touchstart', {
      touches: [{ clientX: 50, clientY: 100 }]
    })

    // Touch end (swipe right > 100px)
    await el.trigger('touchend', {
      changedTouches: [{ clientX: 200, clientY: 100 }]
    })

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should NOT emit close on vertical swipe', async () => {
    const wrapper = mount(ChatPanel, {
      props: {
        isOpen: true,
        mode: 'sidebar'
      },
      emits: ['close']
    })

    const el = wrapper.find('.chatbot-panel')

    // Vertical swipe
    await el.trigger('touchstart', {
      touches: [{ clientX: 50, clientY: 50 }]
    })

    await el.trigger('touchend', {
      changedTouches: [{ clientX: 60, clientY: 200 }]
    })

    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('should NOT emit close on short swipe', async () => {
    const wrapper = mount(ChatPanel, {
      props: {
        isOpen: true,
        mode: 'sidebar'
      },
      emits: ['close']
    })

    const el = wrapper.find('.chatbot-panel')

    // Touch start
    await el.trigger('touchstart', {
      touches: [{ clientX: 50, clientY: 100 }]
    })

    // Touch end (swipe < 100px)
    await el.trigger('touchend', {
      changedTouches: [{ clientX: 130, clientY: 100 }]
    })

    expect(wrapper.emitted('close')).toBeFalsy()
  })
})

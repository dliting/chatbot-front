import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatInput from '@/components/ChatInput.vue'

describe('ChatInput - ThinkingToggle', () => {
  it('renders ThinkingToggle when enableThinking is true', () => {
    const wrapper = mount(ChatInput, {
      props: { disabled: false, enableThinking: true, thinkingEnabled: true },
    })
    expect(wrapper.findComponent({ name: 'ThinkingToggle' }).exists()).toBe(true)
  })

  it('does NOT render ThinkingToggle when enableThinking is false/missing', () => {
    const wrapper = mount(ChatInput, {
      props: { disabled: false },
    })
    expect(wrapper.findComponent({ name: 'ThinkingToggle' }).exists()).toBe(false)
  })

  it('emits update:thinkingEnabled when ThinkingToggle clicked', async () => {
    const wrapper = mount(ChatInput, {
      props: { disabled: false, enableThinking: true, thinkingEnabled: false },
    })
    await wrapper.findComponent({ name: 'ThinkingToggle' }).trigger('click')
    expect(wrapper.emitted('update:thinkingEnabled')?.[0]).toEqual([true])
  })
})

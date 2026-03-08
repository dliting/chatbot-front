/**
 * Unit tests for VoiceOverlay component
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VoiceOverlay from '@/components/VoiceOverlay.vue'

describe('VoiceOverlay', () => {
  it('should render the component', () => {
    const wrapper = mount(VoiceOverlay)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.voice-overlay').exists()).toBe(true)
  })

  it('should render voice animation', () => {
    const wrapper = mount(VoiceOverlay)
    expect(wrapper.find('.voice-overlay__animation').exists()).toBe(true)
  })

  it('should render recording text', () => {
    const wrapper = mount(VoiceOverlay)
    expect(wrapper.find('.voice-overlay__text').exists()).toBe(true)
    expect(wrapper.find('.voice-overlay__text').text()).toBe('正在录音...')
  })

  it('should render cancel button', () => {
    const wrapper = mount(VoiceOverlay)
    expect(wrapper.find('.voice-overlay__cancel').exists()).toBe(true)
    expect(wrapper.find('.voice-overlay__cancel').text()).toBe('取消')
  })

  it('should emit cancel event when cancel button is clicked', async () => {
    const wrapper = mount(VoiceOverlay)
    const cancelBtn = wrapper.find('.voice-overlay__cancel')

    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('should emit cancel event when overlay is clicked', async () => {
    const wrapper = mount(VoiceOverlay)
    const overlay = wrapper.find('.voice-overlay')

    await overlay.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})

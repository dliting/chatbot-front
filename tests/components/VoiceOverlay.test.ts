/**
 * Unit tests for VoiceOverlay component
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VoiceOverlay from '@/components/VoiceOverlay.vue'

describe('VoiceOverlay', () => {
  describe('Component Rendering', () => {
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
      expect(wrapper.find('.voice-overlay__text').text()).toBe('Recording...')
    })

    it('should render cancel button', () => {
      const wrapper = mount(VoiceOverlay)
      expect(wrapper.find('.voice-overlay__cancel').exists()).toBe(true)
      expect(wrapper.find('.voice-overlay__cancel').text()).toBe('Cancel')
    })

    it('should render SVG icon', () => {
      const wrapper = mount(VoiceOverlay)
      expect(wrapper.find('.voice-overlay__animation svg').exists()).toBe(true)
    })
  })

  describe('Events', () => {
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

  describe('CSS Classes', () => {
    it('should have correct overlay class', () => {
      const wrapper = mount(VoiceOverlay)
      expect(wrapper.find('.voice-overlay').exists()).toBe(true)
    })

    it('should have animation element', () => {
      const wrapper = mount(VoiceOverlay)
      expect(wrapper.find('.voice-overlay__animation').exists()).toBe(true)
    })

    it('should have cancel button styled', () => {
      const wrapper = mount(VoiceOverlay)
      const cancel = wrapper.find('.voice-overlay__cancel')
      expect(cancel.exists()).toBe(true)
    })
  })
})

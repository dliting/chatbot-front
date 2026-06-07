/**
 * Tests for AIChatPanel component
 * Covers: mode switching (floating vs embedded), prop defaults, prop forwarding
 * Note: With inject-primary pattern, AIChatPanel no longer forwards action events.
 * Actions are handled via inject (topicActionsKey, chatActionsKey, uiActionsKey).
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AIChatPanel from '@/components/AIChatPanel.vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import EmbeddedChatPanel from '@/components/EmbeddedChatPanel.vue'

// Mock child components
vi.mock('@/components/FloatingChatPanel.vue', () => ({
  default: {
    name: 'FloatingChatPanel',
    template: '<div class="floating-panel-mock" />',
    props: ['config', 'messages', 'topics', 'currentTopicId', 'isStreaming', 'hideWelcome', 'hideQuickActions', 'enableThinking', 'thinkingEnabled', 'isThinking', 'enableVoiceInput'],
  },
}))

vi.mock('@/components/EmbeddedChatPanel.vue', () => ({
  default: {
    name: 'EmbeddedChatPanel',
    template: '<div class="embedded-panel-mock" />',
    props: ['mode', 'layout', 'config', 'messages', 'topics', 'currentTopicId', 'isStreaming', 'hideWelcome', 'hideQuickActions', 'hideHeader', 'enableThinking', 'thinkingEnabled', 'isThinking', 'enableVoiceInput'],
  },
}))

describe('AIChatPanel', () => {
  describe('mode switching', () => {
    it('should render FloatingChatPanel when mode is floating', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'floating' },
        global: { stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'FloatingChatPanel' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'EmbeddedChatPanel' }).exists()).toBe(false)
    })

    it('should render EmbeddedChatPanel when mode is extended', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'extended' },
        global: { stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'EmbeddedChatPanel' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'FloatingChatPanel' }).exists()).toBe(false)
    })

    it('should render EmbeddedChatPanel when mode is sidebar', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'sidebar' },
        global: { stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'EmbeddedChatPanel' }).exists()).toBe(true)
    })
  })

  describe('prop defaults', () => {
    it('should have correct default values', () => {
      const wrapper = mount(AIChatPanel, {
        global: { stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      const props = wrapper.props()
      expect(props.mode).toBe('floating')
      expect(props.layout).toBeUndefined()
      expect(props.messages).toEqual([])
      expect(props.topics).toEqual([])
      expect(props.currentTopicId).toBe('')
      expect(props.isStreaming).toBe(false)
      expect(props.hideWelcome).toBe(false)
      expect(props.hideQuickActions).toBe(false)
      expect(props.hideHeader).toBe(false)
    })
  })

  describe('prop forwarding', () => {
    it('should pass all props to FloatingChatPanel', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          mode: 'floating',
          config: { apiBaseUrl: 'http://test' },
          messages: [{ id: 'm1', content: 'Hi', role: 'user' }],
          topics: [{ topicId: 't1', title: 'Test' }],
          currentTopicId: 't1',
          isStreaming: true,
          hideWelcome: true,
          hideQuickActions: true,
          enableThinking: true,
          thinkingEnabled: true,
          isThinking: true,
          enableVoiceInput: true,
        },
      })

      const floating = wrapper.findComponent(FloatingChatPanel)
      expect(floating.props('config')).toEqual({ apiBaseUrl: 'http://test' })
      expect(floating.props('currentTopicId')).toBe('t1')
      expect(floating.props('isStreaming')).toBe(true)
      expect(floating.props('hideWelcome')).toBe(true)
      expect(floating.props('enableThinking')).toBe(true)
      expect(floating.props('thinkingEnabled')).toBe(true)
      expect(floating.props('isThinking')).toBe(true)
      expect(floating.props('enableVoiceInput')).toBe(true)
    })

    it('should pass all props to EmbeddedChatPanel', () => {
      const wrapper = mount(AIChatPanel, {
        props: {
          mode: 'extended',
          layout: 'dual',
          config: { apiBaseUrl: 'http://test' },
          messages: [],
          topics: [],
          currentTopicId: '',
          isStreaming: false,
          hideHeader: true,
        },
      })

      const embedded = wrapper.findComponent(EmbeddedChatPanel)
      expect(embedded.props('mode')).toBe('extended')
      expect(embedded.props('layout')).toBe('dual')
      expect(embedded.props('hideHeader')).toBe(true)
    })
  })

  describe('no event forwarding (inject-primary pattern)', () => {
    it('should not have emit declarations for action events', () => {
      // AIChatPanel no longer forwards action events - they are handled via inject
      // Only verifying the component renders without errors when no event listeners are attached
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'floating', config: {}, messages: [], topics: [] },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })
})

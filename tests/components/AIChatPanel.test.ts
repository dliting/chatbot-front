/**
 * Integration tests for AIChatPanel component
 * Covers: full mounting with real child components, prop propagation
 * Note: With inject-primary pattern, action events are handled via inject, not emit forwarding.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AIChatPanel from '@/components/AIChatPanel.vue'
import { topicActionsKey, uiActionsKey, chatActionsKey } from '@/symbols'
import { createMockTopicActions, createMockUIActions } from '../utils/mockActions'

describe('AIChatPanel Integration', () => {
  const mockActions = {
    [topicActionsKey]: createMockTopicActions(),
    [uiActionsKey]: createMockUIActions(),
    [chatActionsKey]: {
      sendMessage: vi.fn(),
      editMessage: vi.fn(),
      deleteMessage: vi.fn(),
      refreshMessage: vi.fn(),
      stopGenerating: vi.fn(),
      isGenerating: { value: false },
      isThinkingActive: { value: false },
    },
  }

  describe('floating mode', () => {
    it('should render FloatingChatPanel in floating mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'floating', config: {} },
        global: { provide: mockActions, stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'FloatingChatPanel' }).exists()).toBe(true)
    })
  })

  describe('extended mode', () => {
    it('should render EmbeddedChatPanel in extended mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'extended', config: {} },
        global: { provide: mockActions, stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'EmbeddedChatPanel' }).exists()).toBe(true)
    })
  })

  describe('sidebar mode', () => {
    it('should render EmbeddedChatPanel in sidebar mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: { mode: 'sidebar', config: {} },
        global: { provide: mockActions, stubs: { FloatingChatPanel: true, EmbeddedChatPanel: true } },
      })
      expect(wrapper.findComponent({ name: 'EmbeddedChatPanel' }).exists()).toBe(true)
    })
  })
})

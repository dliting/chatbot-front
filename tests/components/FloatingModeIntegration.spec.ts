/**
 * Integration test for floating mode rendering
 * Verifies the full component chain: AIChatbot → FloatingChatPanel / EmbeddedChatPanel
 *
 * This test specifically guards against the double-DraggableWindow bug where
 * FloatingChatPanel was wrapped in ChatPanel, causing a blank panel on open.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatbot from '@/components/AIChatbot.vue'

// Mock useApiClient to avoid actual API calls
vi.mock('@/composables/useApiClient', () => ({
  useApiClient: () => ({
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { type: 'token', content: 'Hello' }
      yield { type: 'end' }
    }),
    getSessionMessages: vi.fn().mockResolvedValue([]),
  }),
}))

describe('Floating Mode Integration', () => {
  beforeEach(() => {
    // Set a reasonable viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
  })

  describe('Floating Mode - No Double Wrapping', () => {
    it('should not wrap FloatingChatPanel in ChatPanel', async () => {
      const wrapper = mount(AIChatbot, {
        props: {
          config: {
            mode: 'floating',
            defaultExpanded: true,
            panelWidth: 400,
            panelHeight: 500,
            apiBaseUrl: 'http://localhost:3000/api',
          },
        },
      })

      await nextTick()

      // FloatingChatPanel should render directly
      const floatingChatPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingChatPanel.exists()).toBe(true)

      // ChatPanel should NOT wrap the floating panel (no double DraggableWindow)
      const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
      expect(chatPanel.exists()).toBe(false)
    })

    it('should show SuspendedBall when panel is closed', async () => {
      const wrapper = mount(AIChatbot, {
        props: {
          config: {
            mode: 'floating',
            defaultExpanded: false,
            panelWidth: 400,
            panelHeight: 500,
            apiBaseUrl: 'http://localhost:3000/api',
          },
        },
      })

      await nextTick()

      // SuspendedBall from FloatingChatPanel should be visible
      const suspendedBall = wrapper.findComponent({ name: 'SuspendedBall' })
      expect(suspendedBall.exists()).toBe(true)
    })

    it('should show ChatContent when panel is opened via SuspendedBall click', async () => {
      const wrapper = mount(AIChatbot, {
        props: {
          config: {
            mode: 'floating',
            defaultExpanded: false,
            panelWidth: 400,
            panelHeight: 500,
            apiBaseUrl: 'http://localhost:3000/api',
          },
        },
      })

      await nextTick()

      // Initially, DraggableWindow should not be visible
      let draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(false)

      // Click the SuspendedBall
      const suspendedBall = wrapper.find('.chatbot-ball')
      expect(suspendedBall.exists()).toBe(true)
      await suspendedBall.trigger('click')
      await nextTick()

      // Now DraggableWindow should be visible (from FloatingChatPanel)
      draggableWindow = wrapper.findComponent({ name: 'DraggableWindow' })
      expect(draggableWindow.exists()).toBe(true)

      // ChatContent should be visible inside (not blank!)
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)

      // ChatInput should be present (input area)
      const chatInput = wrapper.findComponent({ name: 'ChatInput' })
      expect(chatInput.exists()).toBe(true)
    })

    it('should only have one DraggableWindow when panel is open', async () => {
      const wrapper = mount(AIChatbot, {
        props: {
          config: {
            mode: 'floating',
            defaultExpanded: true,
            panelWidth: 400,
            panelHeight: 500,
            apiBaseUrl: 'http://localhost:3000/api',
          },
        },
      })

      await nextTick()

      // There should be exactly ONE DraggableWindow
      const draggableWindows = wrapper.findAllComponents({ name: 'DraggableWindow' })
      expect(draggableWindows.length).toBe(1)
    })
  })

  describe('Extended Mode - No Regression', () => {
    it('should render EmbeddedChatPanel directly for extended mode', async () => {
      const wrapper = mount(AIChatbot, {
        props: {
          config: {
            mode: 'extended',
            apiBaseUrl: 'http://localhost:3000/api',
          },
        },
      })

      await nextTick()

      // Should render EmbeddedChatPanel directly (AIChatPanel layer removed)
      const embeddedPanel = wrapper.findComponent({ name: 'EmbeddedChatPanel' })
      expect(embeddedPanel.exists()).toBe(true)

      // Should NOT use ChatPanel wrapper
      const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
      expect(chatPanel.exists()).toBe(false)

      // Should NOT render FloatingChatPanel in extended mode
      const floatingPanel = wrapper.findComponent({ name: 'FloatingChatPanel' })
      expect(floatingPanel.exists()).toBe(false)
    })
  })
})

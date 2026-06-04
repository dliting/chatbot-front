/**
 * Tests for AIChatPanel component
 * Covers: mode switching (floating vs embedded), event forwarding, prop defaults
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AIChatPanel from '@/components/AIChatPanel.vue'
import FloatingChatPanel from '@/components/FloatingChatPanel.vue'
import EmbeddedChatPanel from '@/components/EmbeddedChatPanel.vue'

// Mock child components with real emits to trigger event forwarding
vi.mock('@/components/FloatingChatPanel.vue', () => ({
  default: {
    name: 'FloatingChatPanel',
    template: '<div class="floating-panel-mock" />',
    props: ['config', 'messages', 'topics', 'currentTopicId', 'isStreaming', 'hideWelcome', 'hideQuickActions', 'enableThinking', 'thinkingEnabled', 'isThinking', 'enableVoiceInput'],
    emits: ['send-message', 'quick-action', 'create-topic', 'select-topic', 'delete-topic', 'update-topic-title', 'edit-message', 'copy-message', 'refresh-message', 'delete-message', 'toggle-theme', 'thinking-toggle', 'stop-generating'],
  },
}))

vi.mock('@/components/EmbeddedChatPanel.vue', () => ({
  default: {
    name: 'EmbeddedChatPanel',
    template: '<div class="embedded-panel-mock" />',
    props: ['mode', 'layout', 'config', 'messages', 'topics', 'currentTopicId', 'isStreaming', 'hideWelcome', 'hideQuickActions', 'hideHeader', 'enableThinking', 'thinkingEnabled', 'isThinking', 'enableVoiceInput'],
    emits: ['send-message', 'quick-action', 'create-topic', 'select-topic', 'delete-topic', 'update-topic-title', 'edit', 'copy', 'refresh', 'delete', 'toggle-theme', 'thinking-toggle', 'stop-generating'],
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

  describe('event forwarding - FloatingChatPanel', () => {
    const mountFloating = () => mount(AIChatPanel, {
      props: { mode: 'floating', config: {}, messages: [], topics: [] },
    })

    it('should emit send-message via handleSendMessage', async () => {
      const wrapper = mountFloating()
      const data = { content: 'Hello', attachments: [] }
      await wrapper.vm.handleSendMessage(data)

      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')![0][0]).toEqual(data)
    })

    it('should forward quick-action from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('quick-action', 'Hello')

      expect(wrapper.emitted('quick-action')).toBeTruthy()
      expect(wrapper.emitted('quick-action')![0]).toEqual(['Hello'])
    })

    it('should forward create-topic from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('create-topic')

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should forward select-topic from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('select-topic', 'topic-1')

      expect(wrapper.emitted('select-topic')).toBeTruthy()
      expect(wrapper.emitted('select-topic')![0]).toEqual(['topic-1'])
    })

    it('should forward delete-topic from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('delete-topic', 'topic-1')

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
      expect(wrapper.emitted('delete-topic')![0]).toEqual(['topic-1'])
    })

    it('should forward update-topic-title from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('update-topic-title', 'topic-1', 'New Title')

      expect(wrapper.emitted('update-topic-title')).toBeTruthy()
      expect(wrapper.emitted('update-topic-title')![0]).toEqual(['topic-1', 'New Title'])
    })

    it('should forward edit-message from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      const msg = { id: '1', content: 'test' } as any
      await panel.vm.$emit('edit-message', msg)

      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('should forward copy-message from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('copy-message', { id: '1' } as any)

      expect(wrapper.emitted('copy')).toBeTruthy()
    })

    it('should forward refresh-message from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('refresh-message', { id: '1' } as any)

      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('should forward delete-message from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('delete-message', { id: '1' } as any)

      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('should forward toggle-theme from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should forward thinking-toggle from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('thinking-toggle', true)

      expect(wrapper.emitted('thinking-toggle')).toBeTruthy()
      expect(wrapper.emitted('thinking-toggle')![0]).toEqual([true])
    })

    it('should forward stop-generating from FloatingChatPanel', async () => {
      const wrapper = mountFloating()
      const panel = wrapper.findComponent(FloatingChatPanel)
      await panel.vm.$emit('stop-generating')

      expect(wrapper.emitted('stop-generating')).toBeTruthy()
    })
  })

  describe('event forwarding - EmbeddedChatPanel', () => {
    const mountEmbedded = () => mount(AIChatPanel, {
      props: { mode: 'extended', layout: 'dual', config: {}, messages: [], topics: [] },
    })

    it('should emit send-message via handleSendMessage', async () => {
      const wrapper = mountEmbedded()
      const data = { content: 'Hello' }
      await wrapper.vm.handleSendMessage(data)

      expect(wrapper.emitted('send-message')).toBeTruthy()
    })

    it('should forward quick-action from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('quick-action', 'Hello')

      expect(wrapper.emitted('quick-action')).toBeTruthy()
    })

    it('should forward create-topic from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('create-topic')

      expect(wrapper.emitted('create-topic')).toBeTruthy()
    })

    it('should forward select-topic from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('select-topic', 'topic-1')

      expect(wrapper.emitted('select-topic')).toBeTruthy()
    })

    it('should forward delete-topic from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('delete-topic', 'topic-1')

      expect(wrapper.emitted('delete-topic')).toBeTruthy()
    })

    it('should forward update-topic-title from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('update-topic-title', 'topic-1', 'New Title')

      expect(wrapper.emitted('update-topic-title')).toBeTruthy()
    })

    it('should forward edit from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('edit', { id: '1' } as any)

      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('should forward copy from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('copy', { id: '1' } as any)

      expect(wrapper.emitted('copy')).toBeTruthy()
    })

    it('should forward refresh from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('refresh', { id: '1' } as any)

      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('should forward delete from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('delete', { id: '1' } as any)

      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('should forward toggle-theme from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('toggle-theme')

      expect(wrapper.emitted('toggle-theme')).toBeTruthy()
    })

    it('should forward thinking-toggle from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('thinking-toggle', false)

      expect(wrapper.emitted('thinking-toggle')).toBeTruthy()
    })

    it('should forward stop-generating from EmbeddedChatPanel', async () => {
      const wrapper = mountEmbedded()
      const panel = wrapper.findComponent(EmbeddedChatPanel)
      await panel.vm.$emit('stop-generating')

      expect(wrapper.emitted('stop-generating')).toBeTruthy()
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
})
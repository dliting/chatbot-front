/**
 * Tests for AIChatbot mode-specific rendering behavior
 * Ensures each mode (extended, floating, sidebar) renders correctly
 * These tests specifically prevent regression of the sidebar mode
 * "历史对话" button missing bug.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatbot from '@/components/AIChatbot.vue'
import ChatPanel from '@/components/ChatPanel.vue'

// Mock useApiClient to avoid real API calls
vi.mock('@/composables/useApiClient', () => ({
  useApiClient: () => ({
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { type: 'token', content: 'test' }
      yield { type: 'end' }
    }),
    getSessionMessages: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({ sessionId: 'new-session' }),
  }),
}))

describe('AIChatbot Mode Rendering', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('ChatPanel wrapper vs direct rendering', () => {
    it('should render AIChatbot directly without ChatPanel for floating mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'floating', apiBaseUrl: '/api' } },
        global: { stubs: { SuspendedBall: true, DraggableWindow: true, ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true } },
      })

      // Floating mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should render AIChatbot directly without ChatPanel for extended mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true } },
      })

      // Extended mode should NOT use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(false)
    })

    it('should wrap content in ChatPanel for sidebar mode', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should use ChatPanel wrapper
      expect(wrapper.findComponent(ChatPanel).exists()).toBe(true)
    })
  })

  describe('ChatPanel header visibility', () => {
    it('should hide ChatPanel header for sidebar mode (inner ChatHeader handles navigation)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      const chatPanel = wrapper.findComponent(ChatPanel)
      expect(chatPanel.exists()).toBe(true)
      // ChatPanel's own header should be hidden - inner ChatHeader provides navigation
      expect(chatPanel.props('showHeader')).toBe(false)
    })

  })

  describe('ChatHeader rendering for session navigation', () => {
    it('should render ChatHeader for extended mode (dual layout)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode renders ChatHeader (dual layout shows it alongside sidebar)
      const chatHeader = wrapper.findAll('[class*="chat-header"]').length
      expect(chatHeader).toBeGreaterThanOrEqual(1)
    })
  })

  describe('layout assignment', () => {
    it('should assign dual layout for extended mode', () => {
      // Verify by checking that both session sidebar and chat area would be needed
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Extended mode should have sidebar container
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(true)
    })

    it('should use single layout for sidebar mode (view-based switching)', () => {
      const wrapper = mount(AIChatbot, {
        props: { config: { mode: 'sidebar', apiBaseUrl: '/api' } },
        global: { stubs: { ChatHeader: true, ChatContent: true, SessionListView: true, FilePreviewModal: true, DraggableWindow: true } },
      })

      // Sidebar mode should NOT have sidebar container (uses single layout)
      const sidebar = wrapper.find('[class*="ai-chat__sidebar"]')
      expect(sidebar.exists()).toBe(false)
    })
  })
})

describe('AIChatbot clear-all integration', () => {
  it('clears messages, emits messages:cleared and calls onClearMessages after confirmation', async () => {
    const onClearMessages = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          enableClearAll: true,
          callbacks: { onClearMessages },
        },
      },
      global: {
        stubs: {
          Teleport: true,
          SuspendedBall: true,
          ChatContent: true,
          TopicListView: true,
          TopicSearch: true,
          TopicActionMenu: true,
          FilePreviewModal: true,
        },
      },
    })
    await nextTick()

    const clearBtn = wrapper.find('.chat-header__clear')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')

    const confirmBtn = wrapper.find('.confirm-dialog__btn--confirm')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')
    await nextTick()

    expect(wrapper.emitted('messages:cleared')).toHaveLength(1)
    expect(onClearMessages).toHaveBeenCalledTimes(1)
  })
})

describe('AIChatbot upload-limit raw passthrough (default fallbacks intact)', () => {
  it('leaves upload-limit fields undefined so ChatInput defaults apply', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const input = wrapper.findComponent({ name: 'ChatInput' })
    expect(input.props('allowedImageTypes')).toBeUndefined()
    expect(input.props('maxImageSize')).toBeUndefined()
    expect(input.props('maxImageCount')).toBeUndefined()
    expect(input.props('enableUpload')).toBe(true)
  })

  it('still forwards host-provided upload limits', async () => {
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          allowedImageTypes: ['image/png'],
          maxImageSize: 2048,
          maxImageCount: 2,
        },
      },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const input = wrapper.findComponent({ name: 'ChatInput' })
    expect(input.props('allowedImageTypes')).toEqual(['image/png'])
    expect(input.props('maxImageSize')).toBe(2048)
    expect(input.props('maxImageCount')).toBe(2)
  })
})

describe('AIChatbot clear-all callback error handling', () => {
  it('surfaces onClearMessages rejection as chatbot:error', async () => {
    const onClearMessages = vi.fn().mockRejectedValue(new Error('backend down'))
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'extended',
          apiBaseUrl: '/api',
          enableClearAll: true,
          callbacks: { onClearMessages },
        },
      },
      global: {
        stubs: {
          Teleport: true,
          SuspendedBall: true,
          ChatContent: true,
          TopicListView: true,
          TopicSearch: true,
          TopicActionMenu: true,
          FilePreviewModal: true,
        },
      },
    })
    await nextTick()

    await wrapper.find('.chat-header__clear').trigger('click')
    await wrapper.find('.confirm-dialog__btn--confirm').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()

    const errors = (wrapper.emitted('chatbot:error') ?? []).map(
      (e) => (e[0] as { error: { userMessage: string } }).error.userMessage
    )
    expect(errors).toContain('Failed to clear messages')
  })
})

describe('AIChatbot expose sendMessage/getState', () => {
  it('sendMessage delegates to the chat flow (user message added)', async () => {
    const onSendMessage = vi.fn(function* (params: { content: string }) {
      yield { type: 'token', content: 'reply-' + params.content }
      yield { type: 'end' }
    })
    const wrapper = mount(AIChatbot, {
      props: {
        config: { mode: 'extended', apiBaseUrl: '/api', callbacks: { onSendMessage } },
      },
      global: {
        stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true },
      },
    })
    await nextTick()

    await wrapper.vm.sendMessage({ content: 'from host' })

    const userMsgs = wrapper.emitted('message:sent')
    expect(userMsgs).toBeTruthy()
    expect((userMsgs![0][0] as { message: { content: string } }).message.content).toBe('from host')
  })

  it('getState returns a full snapshot shape', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: {
        stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true },
      },
    })
    await nextTick()

    const snapshot = wrapper.vm.getState()
    expect(snapshot.config).toBeDefined()
    expect(typeof snapshot.isOpen).toBe('boolean')
    expect(typeof snapshot.currentTopicId).toBe('string')
    expect(Array.isArray(snapshot.topics)).toBe(true)
    expect(Array.isArray(snapshot.messages)).toBe(true)
  })
})

describe('AIChatbot getState structured-clone safety', () => {
  it('returns a snapshot that survives structuredClone (no reactive proxies)', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: {
        stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true },
      },
    })
    await nextTick()

    const snapshot = wrapper.vm.getState()
    expect(() => structuredClone(snapshot)).not.toThrow()
  })
})

describe('AIChatbot voiceTranscriber provide chain', () => {
  it('provides a transcriber function when apiClient exists', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const content = wrapper.findComponent({ name: 'ChatContent' })
    expect(typeof (content.vm as unknown as { voiceTranscriber: unknown }).voiceTranscriber).toBe('function')
  })

  it('provides undefined transcriber without apiBaseUrl', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const content = wrapper.findComponent({ name: 'ChatContent' })
    expect((content.vm as unknown as { voiceTranscriber: unknown }).voiceTranscriber).toBeUndefined()
  })
})

describe('AIChatbot floating customization config passthrough', () => {
  it('passes ball badge/icon/margin and panel offset/fontScale to FloatingChatPanel', async () => {
    const wrapper = mount(AIChatbot, {
      props: {
        config: {
          mode: 'floating',
          apiBaseUrl: '/api',
          ballBadge: 3,
          ballIcon: 'chat',
          ballMargin: 24,
          panelOffset: { x: -30, y: -50 },
          fontScale: 1.25,
        },
      },
      global: {
        stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true },
      },
    })
    await nextTick()

    const panel = wrapper.findComponent({ name: 'FloatingChatPanel' })
    expect(panel.props('config')).toMatchObject({
      ballBadge: 3,
      ballIcon: 'chat',
      ballMargin: 24,
      panelOffset: { x: -30, y: -50 },
      fontScale: 1.25,
    })
  })

  it('falls back to documented defaults when not configured', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'floating', apiBaseUrl: '/api' } },
      global: {
        stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true, DraggableWindow: true },
      },
    })
    await nextTick()
    const panel = wrapper.findComponent({ name: 'FloatingChatPanel' })
    expect(panel.props('config').ballBadge).toBeUndefined()
    expect(panel.props('config').ballIcon).toBeUndefined()
    expect(panel.props('config').ballMargin).toBe(16)
    expect(panel.props('config').panelOffset).toBeUndefined()
    expect(panel.props('config').fontScale).toBe(1)
  })
})

describe('AIChatbot theme derivation and font scale', () => {
  it('derives primary variants onto the root when primaryColor is set', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api', primaryColor: '#409eff' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const root = wrapper.find('.ai-chatbot')
    const style = root.attributes('style') ?? ''
    expect(style).toContain('--theme-primary-hover: #70b6ff')
    expect(style).toContain('--theme-primary-dark: #2d6fb3')
  })

  it('does not emit variant vars when primaryColor is unset', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api' } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const style = wrapper.find('.ai-chatbot').attributes('style') ?? ''
    expect(style).not.toContain('--theme-primary-hover')
  })

  it('applies fontScale as a CSS variable on the root', async () => {
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', apiBaseUrl: '/api', fontScale: 1.25 } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, ChatContent: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()
    const style = wrapper.find('.ai-chatbot').attributes('style') ?? ''
    expect(style).toContain('--chatbot-font-scale: 1.25')
    expect(style).toContain('font-size: calc(15px * 1.25)')
  })
})

describe('AIChatbot config.transport injection (Bridge)', () => {
  function createTransportFixture() {
    const streamMessage = vi.fn(function* (params: { content: string }) {
      yield { type: 'token', content: 'transport says: ' + params.content }
      yield { type: 'end' }
    })
    const transport: import('@/types').ChatTransport = {
      streamMessage,
      sendMessage: vi.fn().mockResolvedValue({
        messageId: 'srv-1', topicId: 't1', role: 'assistant', type: 'text',
        content: 'ns', timestamp: Date.now(), status: 'sent',
      }),
      loadTopics: vi.fn().mockResolvedValue([]),
      loadMessages: vi.fn().mockResolvedValue([]),
    }
    return transport
  }

  it('chat works end-to-end with a transport and no apiBaseUrl', async () => {
    const transport = createTransportFixture()
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', transport } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()

    // send via exposed sendMessage → transport.streamMessage consumed
    await wrapper.vm.sendMessage({ content: 'hello transport' })
    await nextTick()

    expect(transport.streamMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'hello transport' })
    )
    const style = wrapper.find('.ai-chatbot')
    expect(style.exists()).toBe(true)
  })

  it('transport.transcribe feeds the voice transcriber chain', async () => {
    const transcribe = vi.fn().mockResolvedValue('voice text')
    const transport: import('@/types').ChatTransport = {
      streamMessage: vi.fn(function* () { yield { type: 'end' } }),
      sendMessage: vi.fn(),
      transcribe,
    }
    const wrapper = mount(AIChatbot, {
      props: { config: { mode: 'extended', transport } },
      global: { stubs: { SuspendedBall: true, ChatHeader: true, TopicListView: true, FilePreviewModal: true } },
    })
    await nextTick()

    const content = wrapper.findComponent({ name: 'ChatContent' })
    const transcriber = (content.vm as unknown as { voiceTranscriber?: unknown }).voiceTranscriber
    expect(typeof transcriber).toBe('function')
    await (transcriber as (a: string, f: string) => Promise<string>)('QUJD', 'wav')
    expect(transcribe).toHaveBeenCalledWith('QUJD', 'wav')
  })
})

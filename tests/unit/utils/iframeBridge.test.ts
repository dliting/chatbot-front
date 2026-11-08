import { describe, it, expect, vi } from 'vitest'
import { createIframeBridge } from '@/utils/iframeBridge'

function createFakeChatbot() {
  return {
    togglePanel: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockReturnValue({
      config: { mode: 'floating' },
      isOpen: true,
      currentTopicId: 't1',
      topics: [{ topicId: 't1' }],
      messages: [{ messageId: 'm1' }],
    }),
  }
}

function setup() {
  const sent: Array<{ type: string; data?: unknown }> = []
  const chatbot = createFakeChatbot()
  const bridge = createIframeBridge({
    send: (type, data) => sent.push({ type, data }),
    getChatbot: () => chatbot as never,
  })
  return { bridge, sent, chatbot }
}

describe('createIframeBridge.forwardEvent', () => {
  const MAP: Array<[string, unknown, string]> = [
    ['ui:panel-toggle', { isOpen: true, mode: 'floating' }, 'chatbot:toggle'],
    ['message:sent', { message: { messageId: 'm1' } }, 'chatbot:sendMessage'],
    ['message:error', { message: { messageId: 'm1' }, error: new Error('boom') }, 'chatbot:messageError'],
    ['topic:switched', { topicId: 't2' }, 'chatbot:topicChange'],
    ['message:deleted', { messageId: 'm1', topicId: 't1' }, 'chatbot:messageDeleted'],
    ['message:edited', { messageId: 'm1', topicId: 't1' }, 'chatbot:messageEdited'],
    ['message:regenerated', { messageId: 'm1', topicId: 't1' }, 'chatbot:messageRegenerated'],
    ['message:stream-start', { messageId: 'm1' }, 'chatbot:messageStreamStart'],
    ['message:stream-end', { messageId: 'm1', fullContent: 'done' }, 'chatbot:messageStreamEnd'],
    ['messages:cleared', { topicId: 't1' }, 'chatbot:messagesCleared'],
    ['topic:created', { topic: { topicId: 't9' } }, 'chatbot:topicCreated'],
    ['topic:deleted', { topicId: 't1' }, 'chatbot:topicDeleted'],
    ['topic:title-updated', { topicId: 't1', title: 'x' }, 'chatbot:topicTitleUpdated'],
    ['ui:theme-changed', { theme: 'dark' }, 'chatbot:themeChanged'],
    ['ui:stop-generating', undefined, 'chatbot:stopGenerating'],
    ['chatbot:error', { error: new Error('fatal') }, 'chatbot:error'],
  ]

  it.each(MAP)('maps %s → %s', (event, data, expectedType) => {
    const { bridge, sent } = setup()
    bridge.forwardEvent(event, data)
    expect(sent).toHaveLength(1)
    expect(sent[0].type).toBe(expectedType)
    // Error payloads are serialized by the bridge — covered by dedicated tests below
    if (!(data instanceof Error) && !(data as { error?: unknown })?.error) {
      expect(sent[0].data).toEqual(data)
    }
  })

  it('serializes Error payloads into plain objects (structured-clone safety)', () => {
    const { bridge, sent } = setup()
    bridge.forwardEvent('message:error', { message: {}, error: new Error('boom') })
    const payload = sent[0].data as { error: Record<string, unknown> }
    expect(payload.error).toEqual({ name: 'Error', message: 'boom' })
    expect(payload.error).not.toBeInstanceOf(Error)
  })

  it('ignores unmapped events', () => {
    const { bridge, sent } = setup()
    bridge.forwardEvent('some:unknown-event', { x: 1 })
    expect(sent).toHaveLength(0)
  })
})

describe('createIframeBridge.handleHostMessage', () => {
  it('host:toggle delegates to togglePanel', () => {
    const { bridge, chatbot } = setup()
    bridge.handleHostMessage({ type: 'host:toggle', data: { isOpen: false } })
    expect(chatbot.togglePanel).toHaveBeenCalledWith(false)
  })

  it('host:sendMessage delegates to sendMessage', () => {
    const { bridge, chatbot } = setup()
    bridge.handleHostMessage({ type: 'host:sendMessage', data: { content: 'hi' } })
    expect(chatbot.sendMessage).toHaveBeenCalledWith({ content: 'hi' })
  })

  it('host:sendMessage swallows rejections (component events report errors)', async () => {
    const { bridge, chatbot, sent } = setup()
    chatbot.sendMessage.mockRejectedValueOnce(new Error('no topic'))
    bridge.handleHostMessage({ type: 'host:sendMessage', data: { content: 'hi' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(sent).toHaveLength(0)
  })

  it('host:getState responds with chatbot:state snapshot', () => {
    const { bridge, sent, chatbot } = setup()
    bridge.handleHostMessage({ type: 'host:getState' })
    expect(chatbot.getState).toHaveBeenCalled()
    expect(sent[0].type).toBe('chatbot:state')
    expect(sent[0].data).toMatchObject({ isOpen: true, currentTopicId: 't1' })
  })

  it('ignores unknown host message types (setConfig handled by entry)', () => {
    const { bridge, sent, chatbot } = setup()
    bridge.handleHostMessage({ type: 'host:setConfig', data: { theme: 'dark' } })
    bridge.handleHostMessage({ type: 'host:unknown', data: {} })
    bridge.handleHostMessage({})
    expect(sent).toHaveLength(0)
    expect(chatbot.togglePanel).not.toHaveBeenCalled()
  })
})

describe('iframe bridge integration (real IframeMessenger wiring)', () => {
  /**
   * Pins the wiring contract that the unit tests above cannot see:
   * IframeMessenger handlers receive the PAYLOAD (not the envelope), so the
   * entry must re-wrap it into { type, data } before calling the bridge.
   */
  it('dispatches real window messages from host page to the chatbot', async () => {
    const { IframeMessenger } = await import('@/utils/postMessage')
    const { createIframeBridge } = await import('@/utils/iframeBridge')

    const sent: Array<{ type: string; data?: unknown }> = []
    const chatbot = createFakeChatbot()

    const messenger = new IframeMessenger({
      allowedOrigins: ['http://host.example'],
      targetWindow: null,
    })
    const bridge = createIframeBridge({
      send: (type, data) => sent.push({ type, data }),
      getChatbot: () => chatbot as never,
    })
    messenger.on('host:toggle', (payload) =>
      bridge.handleHostMessage({ type: 'host:toggle', data: payload })
    )
    messenger.on('host:sendMessage', (payload) =>
      bridge.handleHostMessage({ type: 'host:sendMessage', data: payload })
    )
    messenger.on('host:getState', (payload) =>
      bridge.handleHostMessage({ type: 'host:getState', data: payload })
    )
    messenger.on('chatbot:state', (payload) => sent.push({ type: 'chatbot:state-received', data: payload }))

    const dispatch = (type: string, data?: unknown) => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://host.example',
          source: null,
          data: { source: 'host-page', type, data },
        })
      )
    }

    dispatch('host:toggle', { isOpen: false })
    expect(chatbot.togglePanel).toHaveBeenCalledWith(false)

    dispatch('host:sendMessage', { content: 'hi' })
    expect(chatbot.sendMessage).toHaveBeenCalledWith({ content: 'hi' })

    dispatch('host:getState')
    await new Promise((r) => setTimeout(r, 0))
    const stateMsg = sent.find((m) => m.type === 'chatbot:state')
    expect(stateMsg).toBeTruthy()
    // response payload must survive structured cloning (real postMessage requirement)
    expect(() => structuredClone(stateMsg!.data)).not.toThrow()

    messenger.destroy?.()
  })
})

describe('createIframeBridge payload sanitize', () => {
  it('forwarded payloads survive structuredClone even with reactive proxies', () => {
    const { reactive } = require('vue') as typeof import('vue')
    const { bridge, sent } = setup()
    const proxyMessage = reactive({ messageId: 'm1', content: 'hi', nested: { deep: true } })
    bridge.forwardEvent('message:sent', { message: proxyMessage })
    expect(() => structuredClone(sent[0].data)).not.toThrow()
    expect((sent[0].data as { message: { content: string } }).message.content).toBe('hi')
  })

  it('host:sendMessage with invalid payload is ignored', () => {
    const { bridge, chatbot } = setup()
    bridge.handleHostMessage({ type: 'host:sendMessage', data: {} })
    bridge.handleHostMessage({ type: 'host:sendMessage', data: { content: '   ' } })
    bridge.handleHostMessage({ type: 'host:sendMessage', data: { content: 123 } })
    expect(chatbot.sendMessage).not.toHaveBeenCalled()
  })
})

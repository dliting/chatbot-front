/**
 * Characterization tests for postMessage utilities (previously untested).
 * Dispatches real MessageEvents so origin/source/shape validation is
 * exercised exactly as in production.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  IframeMessenger,
  HostMessenger,
  waitForIframeReady,
  createBidirectionalMessenger,
} from '@/utils/postMessage'

const HOST_ORIGIN = 'http://host.example'

function dispatchHost(type: string, data?: unknown, origin = HOST_ORIGIN) {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin,
      source: null,
      data: { source: 'host-page', type, data },
    })
  )
}

describe('IframeMessenger', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    postMessageSpy = vi.spyOn(window.parent as Window, 'postMessage').mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('send wraps payload into the ai-chatbot envelope and posts to parent', () => {
    const messenger = new IframeMessenger()
    messenger.send('chatbot:toggle', { isOpen: true })

    expect(postMessageSpy).toHaveBeenCalledTimes(1)
    const [message, origin] = postMessageSpy.mock.calls[0]
    expect(message).toEqual({ source: 'ai-chatbot', type: 'chatbot:toggle', data: { isOpen: true } })
    expect(origin).toBe('*')
  })

  it('send uses targetWindow when set', () => {
    const target = { postMessage: vi.fn() } as unknown as Window
    const messenger = new IframeMessenger({ targetWindow: target })
    messenger.send('chatbot:ready')

    expect(target.postMessage).toHaveBeenCalledTimes(1)
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('dispatches matching handlers with the payload only', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const handler = vi.fn()
    messenger.on('host:toggle', handler)

    dispatchHost('host:toggle', { isOpen: false })
    expect(handler).toHaveBeenCalledWith({ isOpen: false })
  })

  it('runs all handlers registered for one type', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const a = vi.fn()
    const b = vi.fn()
    messenger.on('host:toggle', a)
    messenger.on('host:toggle', b)

    dispatchHost('host:toggle', { isOpen: true })
    expect(a).toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
  })

  it('blocks origins outside the whitelist', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const handler = vi.fn()
    messenger.on('host:toggle', handler)

    dispatchHost('host:toggle', {}, 'http://evil.example')
    expect(handler).not.toHaveBeenCalled()
  })

  it('blocks origins mismatching an explicit targetOrigin', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN], targetOrigin: 'http://strict.example' })
    const handler = vi.fn()
    messenger.on('host:toggle', handler)

    dispatchHost('host:toggle', {}, HOST_ORIGIN)
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores non-object payloads, wrong sources and unknown types', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const handler = vi.fn()
    messenger.on('host:toggle', handler)

    window.dispatchEvent(new MessageEvent('message', { origin: HOST_ORIGIN, data: 'string-payload' }))
    window.dispatchEvent(new MessageEvent('message', { origin: HOST_ORIGIN, data: { source: 'third-party', type: 'host:toggle' } }))
    dispatchHost('host:unknown-type')
    expect(handler).not.toHaveBeenCalled()
  })

  it('catches handler errors without breaking other handlers', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const bad = vi.fn(() => {
      throw new Error('handler crashed')
    })
    const good = vi.fn()
    messenger.on('host:toggle', bad)
    messenger.on('host:toggle', good)

    dispatchHost('host:toggle', { isOpen: true })
    expect(bad).toHaveBeenCalled()
    expect(good).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('unregister function removes a single handler', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const handler = vi.fn()
    const off = messenger.on('host:toggle', handler)

    off()
    dispatchHost('host:toggle', { isOpen: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('off removes all handlers for a type; destroy removes the listener', () => {
    const messenger = new IframeMessenger({ allowedOrigins: [HOST_ORIGIN] })
    const handler = vi.fn()
    messenger.on('host:toggle', handler)

    messenger.off('host:toggle')
    dispatchHost('host:toggle', { isOpen: true })
    expect(handler).not.toHaveBeenCalled()

    messenger.destroy()
    // after destroy, messages no longer reach any handler (listener removed)
    const other = vi.fn()
    messenger.on('host:ready', other)
    dispatchHost('host:ready')
    expect(other).not.toHaveBeenCalled()
  })

  it('setTargetWindow and setTargetOrigin take effect for sends', () => {
    const messenger = new IframeMessenger()
    const target = { postMessage: vi.fn() } as unknown as Window
    messenger.setTargetWindow(target)
    messenger.setTargetOrigin('http://parent.example')
    messenger.send('chatbot:ready')

    expect(target.postMessage).toHaveBeenCalledWith(expect.anything(), 'http://parent.example')
  })
})

describe('HostMessenger', () => {
  it('sendToIframe posts with host-page source and the iframe origin', () => {
    const postToIframe = vi.fn()
    const iframe = {
      contentWindow: { postMessage: postToIframe },
      src: 'http://chat.example/iframe.html',
    } as unknown as HTMLIFrameElement

    const messenger = new HostMessenger({ iframe })
    messenger.sendToIframe('host:toggle', { isOpen: true })

    expect(postToIframe).toHaveBeenCalledWith(
      { source: 'host-page', type: 'host:toggle', data: { isOpen: true } },
      'http://chat.example'
    )
  })

  it('resolves the iframe via selector', () => {
    document.body.innerHTML = '<iframe id="chat-frame" src="http://chat.example/"></iframe>'
    const postToIframe = vi.fn()

    const messenger = new HostMessenger({ iframeSelector: '#chat-frame' })
    // patch contentWindow postMessage
    const iframe = document.querySelector('#chat-frame') as HTMLIFrameElement
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage: postToIframe } })

    messenger.sendToIframe('host:getState')
    expect(postToIframe).toHaveBeenCalledTimes(1)
    document.body.innerHTML = ''
  })

  it('warns and skips when no iframe is attached', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const messenger = new HostMessenger()
    messenger.sendToIframe('host:toggle')
    expect(consoleSpy).toHaveBeenCalledWith('Iframe not found or not loaded')
    consoleSpy.mockRestore()
  })

  it('setIframe updates the target', () => {
    const postToIframe = vi.fn()
    const messenger = new HostMessenger()
    const iframe = {
      contentWindow: { postMessage: postToIframe },
      src: 'http://chat.example/',
    } as unknown as HTMLIFrameElement

    messenger.setIframe(iframe)
    messenger.sendToIframe('host:toggle', { isOpen: true })
    expect(postToIframe).toHaveBeenCalledTimes(1)
  })
})

describe('waitForIframeReady', () => {
  function fakeIframe() {
    return { contentWindow: { postMessage: vi.fn() } } as unknown as HTMLIFrameElement
  }

  it('resolves when the iframe announces chatbot:ready', async () => {
    const iframe = fakeIframe()
    const promise = waitForIframeReady(iframe, 2000)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: '*',
        data: { source: 'ai-chatbot', type: 'chatbot:ready' },
      })
    )
    await expect(promise).resolves.toBeUndefined()
    // readiness ping was sent into the iframe
    expect((iframe.contentWindow as { postMessage: ReturnType<typeof vi.fn> }).postMessage).toHaveBeenCalled()
  })

  it('rejects on timeout', async () => {
    vi.useFakeTimers()
    const promise = waitForIframeReady(fakeIframe(), 500)
    const assertion = expect(promise).rejects.toThrow('Iframe ready timeout')
    vi.advanceTimersByTime(600)
    await assertion
    vi.useRealTimers()
  })

  it('rejects immediately when the iframe has no contentWindow', async () => {
    const promise = waitForIframeReady({} as HTMLIFrameElement, 100)
    await expect(promise).rejects.toThrow('Iframe has no contentWindow')
  })
})

describe('createBidirectionalMessenger', () => {
  it('delegates sends to child and parent channels respectively', () => {
    const toParent = vi.fn()
    const toIframe = vi.fn()
    vi.spyOn(IframeMessenger.prototype, 'send').mockImplementation(toParent)
    vi.spyOn(HostMessenger.prototype, 'sendToIframe').mockImplementation(toIframe)

    const bidi = createBidirectionalMessenger({})
    bidi.sendToParent('chatbot:ready')
    bidi.sendToIframe('host:toggle', { isOpen: true })

    expect(toParent).toHaveBeenCalledWith('chatbot:ready', undefined)
    expect(toIframe).toHaveBeenCalledWith('host:toggle', { isOpen: true })
  })

  it('destroy tears down both channels', () => {
    const destroySpy = vi.fn()
    const removeListenerSpy = vi.fn()
    vi.spyOn(IframeMessenger.prototype, 'destroy').mockImplementation(destroySpy)
    vi.spyOn(window, 'removeEventListener').mockImplementation(removeListenerSpy)

    const bidi = createBidirectionalMessenger({})
    bidi.destroy()
    expect(destroySpy).toHaveBeenCalledTimes(2) // parent + host channels (subclass inherits)
    void removeListenerSpy
  })
})

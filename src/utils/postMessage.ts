/**
 * PostMessage utilities for iframe communication
 */
import type { PostMessageData, PostMessageType } from '@/types/events'

export type MessageHandler = (data: unknown) => void

/**
 * Iframe messenger for cross-origin communication
 */
export class IframeMessenger {
  private handlers: Map<string, MessageHandler[]> = new Map()
  private targetWindow: Window | null = null
  private targetOrigin: string = '*'

  constructor(options: {
    allowedOrigins?: string[]
    targetWindow?: Window | null
    targetOrigin?: string
  } = {}) {
    const { targetWindow = null, targetOrigin = '*' } = options

    this.targetWindow = targetWindow
    this.targetOrigin = targetOrigin

    // Listen for messages
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    // Check origin if allowedOrigins is specified
    if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
      return
    }

    const data = event.data as PostMessageData

    // Validate message format
    if (!data || typeof data !== 'object') {
      return
    }

    if (data.source !== 'ai-chatbot' && data.source !== 'host-page') {
      return
    }

    // Call registered handlers
    const handlers = this.handlers.get(data.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data.data)
        } catch (error) {
          console.error('Error in message handler:', error)
        }
      })
    }
  }

  /**
   * Send a message to the other window
   */
  send(type: PostMessageType, data?: unknown): void {
    const message: PostMessageData = {
      source: 'ai-chatbot',
      type,
      data,
    }

    const target = this.targetWindow || window.parent
    target.postMessage(message, this.targetOrigin)
  }

  /**
   * Register a handler for a specific message type
   */
  on(type: PostMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }

    this.handlers.get(type)!.push(handler)

    // Return unregister function
    return () => {
      const handlers = this.handlers.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  /**
   * Unregister all handlers for a type
   */
  off(type: PostMessageType): void {
    this.handlers.delete(type)
  }

  /**
   * Unregister all handlers
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this))
    this.handlers.clear()
  }

  /**
   * Set target window
   */
  setTargetWindow(window: Window | null): void {
    this.targetWindow = window
  }

  /**
   * Set target origin
   */
  setTargetOrigin(origin: string): void {
    this.targetOrigin = origin
  }
}

/**
 * Host page messenger (for parent window communicating with iframe)
 */
export class HostMessenger extends IframeMessenger {
  private iframe: HTMLIFrameElement | null = null

  constructor(options: {
    iframeSelector?: string
    iframe?: HTMLIFrameElement | null
    allowedOrigins?: string[]
  } = {}) {
    super({
      allowedOrigins: options.allowedOrigins,
      targetWindow: null,
      targetOrigin: '*',
    })

    if (options.iframe) {
      this.iframe = options.iframe
      this.setTargetWindow(options.iframe.contentWindow)
    } else if (options.iframeSelector) {
      const iframe = document.querySelector(options.iframeSelector) as HTMLIFrameElement
      if (iframe) {
        this.iframe = iframe
        this.setTargetWindow(iframe.contentWindow)
      }
    }
  }

  /**
   * Set the iframe element
   */
  setIframe(iframe: HTMLIFrameElement | null): void {
    this.iframe = iframe
    this.setTargetWindow(iframe?.contentWindow ?? null)
  }

  /**
   * Send message to the iframe
   */
  sendToIframe(type: PostMessageType, data?: unknown): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.warn('Iframe not found or not loaded')
      return
    }

    const message: PostMessageData = {
      source: 'host-page',
      type,
      data,
    }

    this.iframe.contentWindow.postMessage(
      message,
      this.iframe.src ? new URL(this.iframe.src).origin : '*'
    )
  }
}

/**
 * Utility to wait for iframe to be ready
 */
export function waitForIframeReady(
  iframe: HTMLIFrameElement,
  timeout = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!iframe.contentWindow) {
      reject(new Error('Iframe has no contentWindow'))
      return
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Iframe ready timeout'))
    }, timeout)

    const onReady = (event: MessageEvent): void => {
      const data = event.data as PostMessageData
      if (data.source === 'ai-chatbot' && data.type === 'chatbot:ready') {
        cleanup()
        resolve()
      }
    }

    const cleanup = (): void => {
      clearTimeout(timer)
      window.removeEventListener('message', onReady)
    }

    window.addEventListener('message', onReady)

    // Send ping to check if ready
    const messenger = new HostMessenger({ iframe })
    messenger.sendToIframe('host:getState')
  })
}

/**
 * Create a bidirectional messenger
 */
export function createBidirectionalMessenger(options: {
  allowedOrigins?: string[]
}): {
  sendToParent: (type: PostMessageType, data?: unknown) => void
  sendToIframe: (type: PostMessageType, data?: unknown) => void
  onFromParent: (type: PostMessageType, handler: MessageHandler) => () => void
  onFromIframe: (type: PostMessageType, handler: MessageHandler) => () => void
  destroy: () => void
} {
  const messenger = new IframeMessenger(options)
  const iframeMessenger = new HostMessenger(options)

  return {
    sendToParent: (type, data) => messenger.send(type, data),
    sendToIframe: (type, data) => iframeMessenger.sendToIframe(type, data),
    onFromParent: (type, handler) => messenger.on(type, handler),
    onFromIframe: (type, handler) => iframeMessenger.on(type, handler),
    destroy: () => {
      messenger.destroy()
      iframeMessenger.destroy()
    },
  }
}

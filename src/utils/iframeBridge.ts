/**
 * Host-message bridge for the iframe entry.
 *
 * Pure protocol mapping, extracted from iframe-entry so it can be unit tested:
 * - forwardEvent maps AIChatbot component events to chatbot:* postMessage types
 * - handleHostMessage maps host:* commands to AIChatbot expose calls
 */
import type { Attachment, IframeStateSnapshot, PostMessageType } from '@/types'

/** Minimal shape of the AIChatbot expose surface the bridge needs */
export interface BridgeChatbotExpose {
  togglePanel: (open?: boolean) => void
  sendMessage: (data: { content: string; attachments?: Attachment[]; extraInfo?: string }) => Promise<void>
  getState: () => IframeStateSnapshot
}

/** Component event → postMessage type. Unlisted events are not forwarded. */
const EVENT_MAP: Record<string, PostMessageType> = {
  'ui:panel-toggle': 'chatbot:toggle',
  'message:sent': 'chatbot:sendMessage',
  'message:error': 'chatbot:messageError',
  'topic:switched': 'chatbot:topicChange',
  'message:deleted': 'chatbot:messageDeleted',
  'message:edited': 'chatbot:messageEdited',
  'message:regenerated': 'chatbot:messageRegenerated',
  'message:stream-start': 'chatbot:messageStreamStart',
  'message:stream-end': 'chatbot:messageStreamEnd',
  'messages:cleared': 'chatbot:messagesCleared',
  'topic:created': 'chatbot:topicCreated',
  'topic:deleted': 'chatbot:topicDeleted',
  'topic:title-updated': 'chatbot:topicTitleUpdated',
  'ui:theme-changed': 'chatbot:themeChanged',
  'ui:stop-generating': 'chatbot:stopGenerating',
  'chatbot:error': 'chatbot:error',
}

/** Serialize an Error into a structured-clone-safe plain object */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { message: String(error) }
}

export interface IframeBridgeDeps {
  send: (type: PostMessageType, data?: unknown) => void
  getChatbot: () => BridgeChatbotExpose
}

export interface IframeBridge {
  /** Map a component event to its chatbot:* postMessage message */
  forwardEvent: (event: string, data?: unknown) => void
  /** Dispatch a host:* command received from the parent window */
  handleHostMessage: (raw: { type?: string; data?: unknown }) => void
}

/** Deep-clone via JSON so reactive proxies and functions never reach postMessage */
export function sanitizeForPostMessage<T>(data: T): T {
  if (data === undefined) return data
  return JSON.parse(JSON.stringify(data)) as T
}

export function createIframeBridge(deps: IframeBridgeDeps): IframeBridge {
  // Every outbound payload is sanitized centrally: reactive proxies and
  // functions throw DataCloneError inside postMessage's structured clone
  const send: IframeBridgeDeps['send'] = (type, data) => deps.send(type, sanitizeForPostMessage(data))

  const forwardEvent = (event: string, data?: unknown) => {
    const type = EVENT_MAP[event]
    if (!type) return
    if (event === 'message:error' && data && typeof data === 'object') {
      const { error, ...rest } = data as { error?: unknown }
      send(type, { ...rest, error: serializeError(error) })
      return
    }
    if (event === 'chatbot:error' && data && typeof data === 'object') {
      const { error, ...rest } = data as { error?: unknown }
      send(type, { ...rest, error: serializeError(error) })
      return
    }
    send(type, data)
  }

  const handleHostMessage = (raw: { type?: string; data?: unknown }) => {
    let chatbot: BridgeChatbotExpose
    try {
      chatbot = deps.getChatbot()
    } catch {
      // Not mounted yet (e.g. waitForIframeReady ping racing the mount tick):
      // the async postMessage path has no caller to throw to — ignore.
      return
    }
    switch (raw?.type) {
      case 'host:toggle':
        chatbot.togglePanel((raw.data as { isOpen?: boolean } | undefined)?.isOpen)
        break
      case 'host:sendMessage': {
        const payload = raw.data as { content?: unknown } | undefined
        if (typeof payload?.content !== 'string' || !payload.content.trim()) break
        const result = chatbot.sendMessage(payload as { content: string })
        // Errors surface to the host via chatbot:messageError/chatbot:error events
        result.catch(() => undefined)
        break
      }
      case 'host:getState':
        send('chatbot:state', chatbot.getState())
        break
      default:
        // host:setConfig is handled by the entry (reactive config store); unknown types ignored
        break
    }
  }

  return { forwardEvent, handleHostMessage }
}

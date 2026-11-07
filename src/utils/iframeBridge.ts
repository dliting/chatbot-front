/**
 * Host-message bridge for the iframe entry.
 *
 * Pure protocol mapping, extracted from iframe-entry so it can be unit tested:
 * - forwardEvent maps AIChatbot component events to chatbot:* postMessage types
 * - handleHostMessage maps host:* commands to AIChatbot expose calls
 */
import type { IframeStateSnapshot, PostMessageType } from '@/types'

/** Minimal shape of the AIChatbot expose surface the bridge needs */
export interface BridgeChatbotExpose {
  togglePanel: (open?: boolean) => void
  sendMessage: (data: { content: string; attachments?: unknown[]; extraInfo?: string }) => Promise<void>
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

export function createIframeBridge(deps: IframeBridgeDeps): IframeBridge {
  const { send, getChatbot } = deps

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
    const chatbot = getChatbot()
    switch (raw?.type) {
      case 'host:toggle':
        chatbot.togglePanel((raw.data as { isOpen?: boolean } | undefined)?.isOpen)
        break
      case 'host:sendMessage': {
        const result = chatbot.sendMessage(raw.data as { content: string })
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

/**
 * Event types for AI Chatbot
 */

// PostMessage types for iframe communication
export interface PostMessageData {
  source: 'ai-chatbot' | 'host-page'
  type: string
  data?: unknown
}

export type PostMessageType =
  | 'chatbot:ready'
  | 'chatbot:toggle'
  | 'chatbot:sendMessage'
  | 'chatbot:messageError'
  | 'chatbot:topicChange'
  | 'host:toggle'
  | 'host:sendMessage'
  | 'host:setConfig'
  | 'host:getState'

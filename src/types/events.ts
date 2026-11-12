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
  | 'chatbot:messageDeleted'
  | 'chatbot:messageEdited'
  | 'chatbot:messageRegenerated'
  | 'chatbot:messageFeedback'
  | 'chatbot:messageStreamStart'
  | 'chatbot:messageStreamEnd'
  | 'chatbot:messagesCleared'
  | 'chatbot:topicCreated'
  | 'chatbot:topicDeleted'
  | 'chatbot:topicTitleUpdated'
  | 'chatbot:themeChanged'
  | 'chatbot:stopGenerating'
  | 'chatbot:error'
  | 'chatbot:state'
  | 'host:toggle'
  | 'host:sendMessage'
  | 'host:setConfig'
  | 'host:getState'

/** Full UI snapshot returned by AIChatbot.getState() and host:getState responses */
export interface IframeStateSnapshot {
  config: import('./config').ChatbotConfig
  isOpen: boolean
  currentTopicId: string
  topics: import('./index').Topic[]
  messages: import('./index').Message[]
}

/**
 * Event types for AI Chatbot
 */
import type { SendMessageData, MessageSuccessData, Message } from './index'

export interface ChatbotEmits {
  // Message events
  sendMessage: (data: SendMessageData) => void
  messageSuccess: (data: MessageSuccessData) => void
  messageError: (error: Error, message: Message) => void

  // Panel events
  panelResize: (width: number) => void

  // UI events
  themeChange: (theme: 'light' | 'dark') => void
  openChange: (isOpen: boolean) => void
}

export type ChatbotEventName = keyof ChatbotEmits

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
  | 'chatbot:messageReceived'
  | 'chatbot:topicChange'
  | 'host:toggle'
  | 'host:sendMessage'
  | 'host:setConfig'
  | 'host:getState'

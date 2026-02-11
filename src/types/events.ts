/**
 * Event types for AI Chatbot
 */
import type { SendMessageData, MessageSuccessData, PanelToggleData, Message } from './index'

export interface ChatbotEmits {
  // Message events
  sendMessage: (data: SendMessageData) => void
  messageSuccess: (data: MessageSuccessData) => void
  messageError: (error: Error, message: Message) => void

  // Panel events
  panelToggle: (data: PanelToggleData) => void
  panelResize: (width: number) => void

  // Session events
  sessionChange: (sessionId: string) => void
  sessionCreate: (sessionId: string) => void
  sessionDelete: (sessionId: string) => void

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
  | 'host:toggle'
  | 'host:sendMessage'
  | 'host:setConfig'
  | 'host:getState'

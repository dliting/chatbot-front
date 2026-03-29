/**
 * AI Chatbot - Library Entry Point
 */
import AIChatbot from './components/AIChatbot.vue'
import type { ChatbotConfig } from './types/config'

// Export components
export { default as AIChatbot } from './components/AIChatbot.vue'
export { default as SuspendedBall } from './components/SuspendedBall.vue'
export { default as ChatPanel } from './components/ChatPanel.vue'
export { default as DraggableWindow } from './components/DraggableWindow.vue'
export { default as MessageList } from './components/MessageList.vue'
export { default as MessageItem } from './components/MessageItem.vue'
export { default as InputArea } from './components/InputArea.vue'
export { default as TopicManager } from './components/TopicManager.vue'

// Export types
export type * from './types'
export type { ChatbotConfig } from './types/config'

// Export composables
export { useChatbotState } from './composables/useChatbotState'
export { useResponsive } from './composables/useResponsive'
export { useStream } from './composables/useStream'
export { useMessages } from './composables/useMessages'
export { useTopics } from './composables/useTopics'

// Export utilities
export { generateId, throttle, debounce, copyToClipboard } from './utils/helpers'
export { makeDraggable, getInitialPosition } from './utils/drag'
export { StreamClient, fetchStream } from './utils/stream'
export { IframeMessenger, HostMessenger } from './utils/postMessage'
export { createMockUploadEndpoint } from './utils/upload'

// Default export
export default AIChatbot

// Vue plugin
export const ChatbotPlugin = {
  install: (app: { component: (name: string, component: unknown) => void }, _options?: ChatbotConfig) => {
    app.component('AIChatbot', AIChatbot)
  },
}

// Auto-install when used via CDN
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(ChatbotPlugin)
}

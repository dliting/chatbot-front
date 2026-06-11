/**
 * AI Chatbot - Library Entry Point
 */
import './styles/chatbot.scss'
import AIChatbot from './components/AIChatbot.vue'
import type { ChatbotConfig } from './types/config'

// Export components
export { default as AIChatbot } from './components/AIChatbot.vue'
export { default as SuspendedBall } from './components/SuspendedBall.vue'
export { default as ChatPanel } from './components/ChatPanel.vue'
export { default as DraggableWindow } from './components/DraggableWindow.vue'
export { default as MessageList } from './components/MessageList.vue'
export { default as MessageItem } from './components/MessageItem.vue'

// Export types
export type * from './types'
export type { ChatbotConfig, ChatbotCallbacks, SendMessageParams } from './types/config'
export type { QuickAction, PromptVariableResolver, PromptVariableConfig } from './types/config'

// Export injection keys (for advanced usage with provide/inject)
export { chatStateKey, chatActionsKey, topicActionsKey, uiActionsKey, promptVarResolverKey } from './symbols'

// Export composables
export { useChatbotState } from './composables/useChatbotState'
export { useResponsive } from './composables/useResponsive'
export { useStream } from './composables/useStream'
export { usePromptVariables } from './composables/usePromptVariables'

// Export utilities
export { generateId, throttle, debounce, copyToClipboard } from './utils/helpers'
export { makeDraggable, getInitialPosition } from './utils/drag'
export { StreamClient, fetchStream } from './utils/stream'
export { IframeMessenger, HostMessenger } from './utils/postMessage'
export { createMockUploadEndpoint } from './utils/upload'
export { deriveMessageType, getAttachmentsByType } from './utils/message'
export { LocalStorageAdapter, TOPICS_SCHEMA_VERSION, loadVersioned, saveVersioned } from './utils/storage'
export type { StorageAdapter, VersionedData } from './utils/storage'
export { ChatbotError, toChatbotError } from './utils/errors'
export type { ErrorCategory } from './utils/errors'
export { resolveQuickActionIcon, isBuiltinIconName } from './utils/icons'
export type { ResolvedIcon, BuiltinIconName } from './utils/icons'

// Constants
export { getDefaultQuickActions, defaultQuickActions } from './constants/quickActions'

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

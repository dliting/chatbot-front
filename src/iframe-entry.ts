/**
 * Iframe entry point
 */
import { createApp, ref, onMounted } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { IframeMessenger } from './utils/postMessage'
import { createIframeConfigStore } from './utils/iframeConfigStore'
import { createIframeBridge, registerHostHandlers } from './utils/iframeBridge'
import type { ChatbotConfig } from './types/config'
import type { PostMessageType } from './types'
import './styles/chatbot.scss'

// Get config from URL params or use defaults
const urlParams = new URLSearchParams(window.location.search)
const configFromUrl = urlParams.get('config')

let initialConfig: ChatbotConfig = {}

try {
  if (configFromUrl) {
    initialConfig = JSON.parse(atob(configFromUrl))
  }
} catch (error) {
  console.warn('Failed to parse config from URL:', error)
}

// Reactive config store: host:setConfig patches reach the component instantly
const configStore = createIframeConfigStore(initialConfig)

// Captured once the mounted AIChatbot instance is available
let chatbotInstance: InstanceType<typeof AIChatbot> | null = null

const getChatbot = (): InstanceType<typeof AIChatbot> => {
  if (!chatbotInstance) {
    throw new Error('AIChatbot instance not ready')
  }
  return chatbotInstance
}

// Create app
const app = createApp({
  components: {
    AIChatbot,
  },
  setup() {
    const chatbotRef = ref<InstanceType<typeof AIChatbot>>()

    // Setup postMessage messenger
    const messenger = new IframeMessenger({
      allowedOrigins: initialConfig.allowedOrigins || [],
    })

    // Protocol bridge: event mapping + host command dispatch (unit-tested)
    const bridge = createIframeBridge({
      send: (type: PostMessageType, data?: unknown) => messenger.send(type, data),
      getChatbot: () => getChatbot(),
    })

    const handleEvent = (event: string, data?: unknown) => bridge.forwardEvent(event, data)

    // Notify parent that chatbot is ready
    onMounted(() => {
      chatbotInstance = chatbotRef.value ?? null
      messenger.send('chatbot:ready', { config: configStore.mergedConfig.value })
    })

    // Listen for messages from parent
    registerHostHandlers(messenger, bridge)
    messenger.on('host:setConfig', (raw: unknown) => {
      const data = raw as ChatbotConfig | undefined
      if (data) {
        configStore.patch(data)
      }
    })

    return {
      chatbotRef,
      mergedConfig: configStore.mergedConfig,
      handleEvent,
    }
  },
  template: `
    <AIChatbot
      ref="chatbotRef"
      :config="mergedConfig"
      @ui:panel-toggle="handleEvent('ui:panel-toggle', $event)"
      @message:sent="handleEvent('message:sent', $event)"
      @message:error="handleEvent('message:error', $event)"
      @message:deleted="handleEvent('message:deleted', $event)"
      @message:edited="handleEvent('message:edited', $event)"
      @message:regenerated="handleEvent('message:regenerated', $event)"
      @message:stream-start="handleEvent('message:stream-start', $event)"
      @message:stream-end="handleEvent('message:stream-end', $event)"
      @messages:cleared="handleEvent('messages:cleared', $event)"
      @topic:switched="handleEvent('topic:switched', $event)"
      @topic:created="handleEvent('topic:created', $event)"
      @topic:deleted="handleEvent('topic:deleted', $event)"
      @topic:title-updated="handleEvent('topic:title-updated', $event)"
      @ui:theme-changed="handleEvent('ui:theme-changed', $event)"
      @ui:stop-generating="handleEvent('ui:stop-generating')"
      @chatbot:error="handleEvent('chatbot:error', $event)"
    />
  `,
})

app.use(ElementPlus)
app.mount('#app')

// Make chatbot methods available globally for parent page.
// Methods delegate to the mounted instance and throw when it is not ready —
// a silent no-op here hides real integration errors from the host page.
window.AIChatbot = {
  toggle: (open?: boolean) => {
    getChatbot().togglePanel(open)
  },
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    getChatbot().setTheme(theme)
  },
  sendMessage: (data: {
    content: string
    attachments?: import('./types').Attachment[]
    extraInfo?: string
  }) => {
    return getChatbot().sendMessage(data)
  },
  getState: () => {
    return getChatbot().getState()
  },
}

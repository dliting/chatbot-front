/**
 * Iframe entry point
 */
import { createApp, ref, onMounted } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { IframeMessenger } from './utils/postMessage'
import { createIframeConfigStore } from './utils/iframeConfigStore'
import type { ChatbotConfig } from './types/config'
import type { Message, PanelToggleData } from './types'
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

    // Notify parent that chatbot is ready
    onMounted(() => {
      chatbotInstance = chatbotRef.value ?? null
      messenger.send('chatbot:ready', { config: configStore.mergedConfig.value })
    })

    // Handle events from chatbot
    const handleToggle = (data: { isOpen: boolean; mode: string }) => {
      messenger.send('chatbot:toggle', data)
    }

    const handleSendMessage = (data: { message: Message }) => {
      messenger.send('chatbot:sendMessage', data)
    }

    const handleMessageError = (data: { message: Message; error: Error }) => {
      messenger.send('chatbot:messageError', data)
    }

    const handleTopicSwitched = (data: { topicId: string }) => {
      messenger.send('chatbot:topicChange', data)
    }

    // Listen for messages from parent
    messenger.on('host:toggle', (raw: unknown) => {
      const data = raw as PanelToggleData | undefined
      chatbotRef.value?.togglePanel(data?.isOpen)
    })

    messenger.on('host:setConfig', (raw: unknown) => {
      const data = raw as ChatbotConfig | undefined
      if (data) {
        configStore.patch(data)
      }
    })

    return {
      chatbotRef,
      mergedConfig: configStore.mergedConfig,
      handleToggle,
      handleSendMessage,
      handleMessageError,
      handleTopicSwitched,
    }
  },
  template: `
    <AIChatbot
      ref="chatbotRef"
      :config="mergedConfig"
      @ui:panel-toggle="handleToggle"
      @message:sent="handleSendMessage"
      @message:error="handleMessageError"
      @topic:switched="handleTopicSwitched"
    />
  `,
})

app.use(ElementPlus)
app.mount('#app')

// Make chatbot methods available globally for parent page.
// Methods delegate to the mounted instance and throw when it is not ready —
// a silent no-op here hides real integration errors from the host page.
const getChatbot = (): InstanceType<typeof AIChatbot> => {
  if (!chatbotInstance) {
    throw new Error('AIChatbot instance not ready')
  }
  return chatbotInstance
}

window.AIChatbot = {
  toggle: (open?: boolean) => {
    getChatbot().togglePanel(open)
  },
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    getChatbot().setTheme(theme)
  },
}

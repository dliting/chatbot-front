/**
 * Iframe entry point
 */
import { createApp, ref, computed, onMounted } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { IframeMessenger } from './utils/postMessage'
import type { ChatbotConfig } from './types/config'
import './styles/chatbot.scss'

// Get config from URL params or use defaults
const urlParams = new URLSearchParams(window.location.search)
const configFromUrl = urlParams.get('config')

let chatbotConfig: ChatbotConfig = {}

try {
  if (configFromUrl) {
    chatbotConfig = JSON.parse(atob(configFromUrl))
  }
} catch (error) {
  console.warn('Failed to parse config from URL:', error)
}

// Create app
const app = createApp({
  components: {
    AIChatbot,
  },
  setup() {
    const chatbotRef = ref<InstanceType<typeof AIChatbot>>()

    // Merge default config with URL config
    const mergedConfig = computed(() => ({
      position: 'bottom-right',
      panelWidth: 400,
      theme: 'light',
      enableImageUpload: true,
      enableSessionManager: true,
      iframeMode: true,
      ...chatbotConfig,
    }))

    // Setup postMessage messenger
    const messenger = new IframeMessenger({
      allowedOrigins: chatbotConfig.allowedOrigins || [],
    })

    // Notify parent that chatbot is ready
    onMounted(() => {
      messenger.send('chatbot:ready', { config: mergedConfig.value })
    })

    // Handle events from chatbot
    const handleToggle = (data: any) => {
      messenger.send('chatbot:toggle', data)
    }

    const handleSendMessage = (data: any) => {
      messenger.send('chatbot:sendMessage', data)
    }

    const handleMessageSuccess = (data: any) => {
      messenger.send('chatbot:messageReceived', data)
    }

    const handleSessionChange = (sessionId: string) => {
      messenger.send('chatbot:sessionChange', { sessionId })
    }

    // Listen for messages from parent
    messenger.on('host:toggle', (data: any) => {
      chatbotRef.value?.togglePanel(data?.isOpen)
    })

    messenger.on('host:setConfig', (data: any) => {
      Object.assign(chatbotConfig, data)
    })

    return {
      chatbotRef,
      mergedConfig,
      handleToggle,
      handleSendMessage,
      handleMessageSuccess,
      handleSessionChange,
    }
  },
  template: `
    <AIChatbot
      ref="chatbotRef"
      :config="mergedConfig"
      @panel-toggle="handleToggle"
      @send-message="handleSendMessage"
      @message-success="handleMessageSuccess"
      @session-change="handleSessionChange"
    />
  `,
})

app.use(ElementPlus)
app.mount('#app')

// Make chatbot methods available globally for parent page
;(window as any).AIChatbot = {
  toggle: (_open?: boolean) => {
    // This will be called by parent page
  },
  setTheme: (_theme: 'light' | 'dark') => {
    // This will be called by parent page
  },
}

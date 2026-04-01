/**
 * Iframe entry point
 */
import { createApp, ref, computed, onMounted } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { IframeMessenger } from './utils/postMessage'
import type { ChatbotConfig } from './types/config'
import type { PanelToggleData, SendMessageData, MessageSuccessData } from './types'
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
      enableTopicManager: true,
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
    const handleToggle = (data: PanelToggleData) => {
      messenger.send('chatbot:toggle', data)
    }

    const handleSendMessage = (data: SendMessageData) => {
      messenger.send('chatbot:sendMessage', data)
    }

    const handleMessageSuccess = (data: MessageSuccessData) => {
      messenger.send('chatbot:messageReceived', data)
    }

    const handleTopicChange = (topicId: string) => {
      messenger.send('chatbot:topicChange', { topicId })
    }

    // Listen for messages from parent
    messenger.on('host:toggle', (data?: PanelToggleData) => {
      chatbotRef.value?.togglePanel(data?.isOpen)
    })

    messenger.on('host:setConfig', (data?: ChatbotConfig) => {
      if (data) {
        Object.assign(chatbotConfig, data)
      }
    })

    return {
      chatbotRef,
      mergedConfig,
      handleToggle,
      handleSendMessage,
      handleMessageSuccess,
      handleTopicChange,
    }
  },
  template: `
    <AIChatbot
      ref="chatbotRef"
      :config="mergedConfig"
      @panel-toggle="handleToggle"
      @send-message="handleSendMessage"
      @message-success="handleMessageSuccess"
      @topic-change="handleTopicChange"
    />
  `,
})

app.use(ElementPlus)
app.mount('#app')

// Make chatbot methods available globally for parent page
window.AIChatbot = {
  toggle: (_open?: boolean) => {
    // This will be called by parent page
  },
  setTheme: (_theme: 'light' | 'dark' | 'system') => {
    // This will be called by parent page
  },
}

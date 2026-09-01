/**
 * Iframe entry point
 */
import { createApp, ref, computed, onMounted } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { IframeMessenger } from './utils/postMessage'
import type { ChatbotConfig } from './types/config'
import type { Message, PanelToggleData } from './types'
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
        Object.assign(chatbotConfig, data)
      }
    })

    return {
      chatbotRef,
      mergedConfig,
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

// Make chatbot methods available globally for parent page
window.AIChatbot = {
  toggle: (_open?: boolean) => {
    // This will be called by parent page
  },
  setTheme: (_theme: 'light' | 'dark' | 'system') => {
    // This will be called by parent page
  },
}

/**
 * Fullscreen mode entry
 * 全屏模式 - 全屏聊天界面
 */
import { createApp } from 'vue'
import AIChat from '../components/AIChat.vue'
import '@/styles/chatbot.scss'

// Local Fonts - Noto Sans SC (for offline deployment)
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = '/fonts/noto-sans-sc.css'
document.head.appendChild(fontLink)

const app = createApp(AIChat, {
  config: {
    chatMode: 'fullscreen',
    enableImageUpload: true,
    maxImageCount: 3,
    // Set apiBaseUrl to connect to real backend (e.g., http://localhost:3000 for ChatApp backend)
    // apiBaseUrl: 'http://localhost:3000',
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
      newChat: '新建对话',
      history: '历史对话',
    },
  },
})

app.mount('#app')

/**
 * Sidebar mode entry
 * 边栏模式 - 固定侧边栏显示
 */
import { createApp } from 'vue'
import AIChat from '../components/AIChat.vue'
import '@/styles/chatbot.scss'

// Local Fonts - Noto Sans SC (for offline deployment)
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = '/fonts/noto-sans-sc.css'
document.head.appendChild(fontLink)

// Sidebar mode uses compact mode with specific configuration
const app = createApp(AIChat, {
  config: {
    chatMode: 'compact',
    enableImageUpload: true,
    maxImageCount: 3,
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
      newChat: '新建对话',
      history: '历史对话',
    },
  },
})

app.mount('#app')

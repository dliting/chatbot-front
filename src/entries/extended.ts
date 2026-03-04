/**
 * Extended mode entry
 * 扩展模式 - 桌面端聊天界面（左侧会话列表 + 右侧聊天区）
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
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
      newChat: '新建对话',
    },
    enableImageUpload: true,
    maxImageCount: 3,
  },
})

app.mount('#app')

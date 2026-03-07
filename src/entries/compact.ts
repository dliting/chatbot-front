/**
 * Compact mode entry
 * 紧凑模式 - 桌面边栏或手机全屏界面
 */
import { createApp } from 'vue'
import AIChatbot from '../components/AIChatbot.vue'
import '@/styles/chatbot.scss'

// Local Fonts - Noto Sans SC (for offline deployment)
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = '/fonts/noto-sans-sc.css'
document.head.appendChild(fontLink)

const app = createApp(AIChatbot, {
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

/**
 * Main entry for development/demo
 * 使用通用 AI 聊天组件（独立模式）
 */
import { createApp } from 'vue'
import AIChat from './components/AIChat.vue'

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
    },
    enableImageUpload: true,
    maxImageCount: 3,
  },
})

app.mount('#app')

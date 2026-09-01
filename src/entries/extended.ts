/**
 * Extended mode entry
 * 扩展模式 - 桌面端聊天界面（左侧会话列表 + 右侧聊天区）
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
    mode: 'extended',
    enableImageUpload: true,
    maxImageCount: 3,
    locale: 'zh-CN',
  },
})

app.mount('#app')

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
    mode: 'sidebar',
    enableImageUpload: true,
    maxImageCount: 3,
    locale: 'zh-CN',
  },
})

app.mount('#app')

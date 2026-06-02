/**
 * Floating mode entry
 * 悬浮窗模式 - 显示悬浮球，点击打开对话框
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
    mode: 'floating',
    position: 'bottom-right',
    panelWidth: 400,
    panelHeight: 600,
    defaultExpanded: false,
    enableImageUpload: true,
    maxImageCount: 3,
    draggable: true,
    resizable: true,
    rememberPosition: true,
    locale: 'zh-CN',
  },
})

app.mount('#app')

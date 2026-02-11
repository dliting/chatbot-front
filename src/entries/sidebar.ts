/**
 * Sidebar mode entry
 * 边栏模式 - 固定侧边栏显示
 */
import { createApp } from 'vue'
import AIChatbot from '../components/AIChatbot.vue'

// Google Fonts - Noto Sans SC
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600&display=swap'
document.head.appendChild(fontLink)

// Force panel mode to sidebar and auto-expand
const app = createApp(AIChatbot, {
  config: {
    position: 'right',
    panelWidth: 380,
    defaultExpanded: true,
    enableImageUpload: true,
    enableSessionManager: true,
    maxImageCount: 3,
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
    },
  },
})

app.mount('#app')

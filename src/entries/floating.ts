/**
 * Floating mode entry
 * 悬浮窗模式 - 显示悬浮球，点击打开对话框
 */
import { createApp } from 'vue'
import AIChatbot from '../components/AIChatbot.vue'

// Google Fonts - Noto Sans SC
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600&display=swap'
document.head.appendChild(fontLink)

const app = createApp(AIChatbot, {
  config: {
    position: 'bottom-right',
    panelWidth: 400,
    defaultExpanded: false,
    enableImageUpload: true,
    enableSessionManager: false,
    maxImageCount: 3,
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
    },
  },
})

app.mount('#app')

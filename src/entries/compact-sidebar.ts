/**
 * Compact Sidebar mode entry
 * 紧凑侧边栏模式 - 桌面边栏或手机全屏界面
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
    position: 'right',
    theme: 'light',
    primaryColor: '#667eea',
    panelMode: 'sidebar',
    panelWidth: 400,
    defaultExpanded: true,
    enableSessionManager: true,
    labels: {
      title: '智能助手',
      newChat: '新建对话',
      placeholder: '输入消息...',
    },
    enableImageUpload: true,
    maxImageCount: 3,
  },
})

app.mount('#ai-chat-sidebar')

/**
 * Floating to Extended mode entry
 * 悬浮模式（→扩展）- 悬浮球，点击打开扩展模式（完整桌面聊天）
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
    panelMode: 'dialog', // Always use dialog mode for floating
    enableImageUpload: true,
    enableSessionManager: true,
    maxImageCount: 3,
    labels: {
      title: '智能助手',
      placeholder: '输入消息...',
      newChat: '新建对话',
    },
  },
})

app.mount('#app')

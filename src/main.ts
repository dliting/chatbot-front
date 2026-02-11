/**
 * Main entry for development/demo
 * 使用豆包风格全屏聊天界面
 */
import { createApp } from 'vue'
import DoubaoChat from './components/DoubaoChat.vue'

// Google Fonts - Noto Sans SC
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600&display=swap'
document.head.appendChild(fontLink)

const app = createApp(DoubaoChat, {
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

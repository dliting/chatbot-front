/**
 * Development entry point
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatbot from './components/AIChatbot.vue'
import { getDefaultLabels } from './types/config'
import './styles/chatbot.scss'

const labels = getDefaultLabels('zh-CN')

const app = createApp(AIChatbot, {
  config: {
    mode: 'floating',
    labels,
    enableImageUpload: true,
    maxImageCount: 3,
  },
})

app.use(ElementPlus)
app.mount('#app')

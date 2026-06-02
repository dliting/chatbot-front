/**
 * Development entry point
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AIChatPanel from './components/AIChatPanel.vue'
import { getDefaultLabels } from './types/config'
import './styles/chatbot.scss'

const labels = getDefaultLabels('zh-CN')

const app = createApp(AIChatPanel, {
  config: {
    labels,
    enableImageUpload: true,
    maxImageCount: 3,
  },
})

app.use(ElementPlus)
app.mount('#app')

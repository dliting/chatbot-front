<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isLoaded = ref(false)
const logEntries = ref<string[]>(['初始化聊天bot...'])

// 配置
const config = {
  position: 'bottom-right',
  panelWidth: 400,
  theme: 'light',
  enableImageUpload: true,
  enableSessionManager: true,
  maxImageCount: 3,
  iframeMode: true,
}

// URL编码配置
const encodedConfig = btoa(JSON.stringify(config))
const iframeSrc = `/dist-iframe/index.html?config=${encodedConfig}`

function addLog(message: string) {
  const entry = `[${new Date().toLocaleTimeString()}] ${message}`
  logEntries.value.push(entry)
}

function toggleChatbot() {
  iframeRef.value?.contentWindow?.postMessage({
    source: 'host-page',
    type: 'host:toggle',
    data: {},
  }, '*')
  addLog('发送: toggle')
}

function toggleTheme() {
  config.theme = config.theme === 'light' ? 'dark' : 'light'
  iframeRef.value?.contentWindow?.postMessage({
    source: 'host-page',
    type: 'host:setConfig',
    data: { theme: config.theme },
  }, '*')
  addLog(`发送: setConfig theme=${config.theme}`)
}

function changePosition() {
  const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
  const currentIndex = positions.indexOf(config.position as string)
  config.position = positions[(currentIndex + 1) % positions.length] as any
  iframeRef.value?.contentWindow?.postMessage({
    source: 'host-page',
    type: 'host:setConfig',
    data: { position: config.position },
  }, '*')
  addLog(`发送: setConfig position=${config.position}`)
}

function clearLog() {
  logEntries.value = ['日志已清除']
}

function goHome() {
  router.push('/')
}

// PostMessage监听
function handleMessage(event: MessageEvent) {
  const data = event.data
  if (data.source !== 'ai-chatbot') return

  addLog(`接收: ${data.type} ${JSON.stringify(data.data || '')}`)

  if (data.type === 'chatbot:ready') {
    isLoaded.value = true
    addLog('聊天bot已就绪!')
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="iframe-demo">
    <a href="/" class="back-link" @click.prevent="goHome">← 返回首页</a>
    <div class="demo-container">
      <h1>AI Chatbot - Iframe 嵌入演示</h1>
      <p class="subtitle">使用iframe将聊天bot嵌入任何网站</p>

      <div class="controls">
        <button class="primary" @click="toggleChatbot">切换聊天bot</button>
        <button @click="toggleTheme">切换主题</button>
        <button @click="changePosition">改变位置</button>
        <button @click="clearLog">清除日志</button>
      </div>

      <div class="iframe-container">
        <iframe
          v-if="!isLoaded"
          :src="iframeSrc"
          frameborder="0"
          style="width: 100%; height: 600px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
        ></iframe>
        <p v-else class="success-message">✓ 聊天bot已加载</p>
      </div>

      <div class="log">
        <div v-for="(entry, index) in logEntries" :key="index" class="log-entry">
          {{ entry }}
        </div>
      </div>

      <div class="features">
        <div class="feature">
          <h3>简单嵌入</h3>
          <p>只需在网站添加iframe标签</p>
        </div>
        <div class="feature">
          <h3>跨域支持</h3>
          <p>支持postMessage通信</p>
        </div>
        <div class="feature">
          <h3>完全可定制</h3>
          <p>配置位置、主题和功能</p>
        </div>
        <div class="feature">
          <h3>隔离环境</h3>
          <p>与宿主页面无CSS/JS冲突</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.iframe-demo {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: white;
  text-decoration: none;
  font-size: 14px;
  opacity: 0.9;
}

.back-link:hover {
  text-decoration: underline;
}

.demo-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  margin-bottom: 24px;
}

.controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

button {
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  border-color: #409eff;
  color: #409eff;
}

button.primary {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

button.primary:hover {
  background: #337ecc;
}

.iframe-container {
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.success-message {
  font-size: 16px;
  color: #67c23a;
  font-weight: 500;
}

.log {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}

.log-entry {
  padding: 4px 0;
  border-bottom: 1px solid #e4e7ed;
}

.log-entry:last-child {
  border-bottom: none;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.feature {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.feature h3 {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
}

.feature p {
  font-size: 13px;
  color: #666;
  margin: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AIChatbot } from 'chatbot'

const router = useRouter()

const config = computed(() => ({
  chatMode: 'floating',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  streamEnabled: true,
  position: 'bottom-right',
  panelWidth: 400,
  panelHeight: 600,
  defaultExpanded: false,
  enableImageUpload: true,
  maxImageCount: 3,
  draggable: true,
  resizable: true,
  rememberPosition: true,
  enableSessionManager: true,
  labels: {
    title: '智能助手',
    placeholder: '输入消息...',
    newChat: '新建对话',
    history: '历史对话',
  },
}))

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="floating-demo">
    <a href="/" class="back-link" @click.prevent="goHome">← 返回首页</a>
    <div class="demo-container">
      <h1>悬浮窗模式</h1>
      <p class="subtitle">Floating Window Mode</p>
      <p class="description">
        此模式在页面右下角显示一个悬浮球按钮，点击后打开聊天对话框。
        适用于需要节省空间、不影响主内容的场景。
      </p>

      <div class="features">
        <div class="feature">
          <h3>悬浮球按钮</h3>
          <p>页面右下角显示悬浮球，可拖动调整位置</p>
        </div>
        <div class="feature">
          <h3>弹窗对话框</h3>
          <p>点击悬浮球打开对话框，不影响页面布局</p>
        </div>
        <div class="feature">
          <h3>会话管理</h3>
          <p>支持多会话切换和管理</p>
        </div>
        <div class="feature">
          <h3>主题切换</h3>
          <p>支持浅色/深色主题切换</p>
        </div>
        <div class="feature">
          <h3>图片上传</h3>
          <p>支持发送图片消息</p>
        </div>
        <div class="feature">
          <h3>响应式设计</h3>
          <p>自动适配移动端和桌面端</p>
        </div>
      </div>

      <div class="usage">
        <h3>使用说明</h3>
        <ol>
          <li>点击页面右下角的悬浮球按钮</li>
          <li>聊天对话框将从右下角弹出</li>
          <li>点击对话框外的区域可关闭对话框</li>
          <li>悬浮球可以拖动到页面任意位置</li>
        </ol>
      </div>
    </div>

    <!-- AI Chatbot 组件 -->
    <AIChatbot :config="config" />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.floating-demo {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.demo-container h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 28px;
}

.demo-container .subtitle {
  color: #666;
  font-size: 16px;
  margin-bottom: 24px;
}

.demo-container .description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
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

.usage {
  margin-top: 32px;
  padding: 20px;
  background: #e8f4ff;
  border-left: 4px solid #409eff;
  border-radius: 8px;
}

.usage h3 {
  color: #409eff;
  font-size: 16px;
  margin-bottom: 12px;
}

.usage ol {
  margin-left: 20px;
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}
</style>

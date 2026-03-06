<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AIChatbot } from 'chatbot'

const router = useRouter()

const config = computed(() => ({
  chatMode: 'compact',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  streamEnabled: true,
  enableImageUpload: true,
  maxImageCount: 3,
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
  <div class="compact-demo">
    <!-- 返回首页链接 -->
    <a href="/" class="back-link" @click.prevent="goHome">← 返回首页</a>

    <!-- 主内容区域 -->
    <main class="main-content">
      <h1>紧凑模式 & 边栏模式</h1>
      <p class="subtitle">Compact & Sidebar Mode</p>
      <p class="description">
        此模式展示两种紧凑布局方式：桌面端显示为右侧边栏，与主内容并列展示；
        移动端自动切换为全屏模式，提供完整的聊天体验。
      </p>

      <div class="card">
        <h2>功能特点</h2>
        <ul>
          <li>侧边栏固定显示，不影响主内容浏览</li>
          <li>支持会话管理，可创建多个对话</li>
          <li>实时流式响应，体验流畅</li>
          <li>支持图片上传、语音输入</li>
        </ul>
      </div>

      <div class="card">
        <h2>紧凑模式说明</h2>
        <p>在桌面端，聊天组件显示为右侧边栏，与主内容并列展示。在移动端，组件自动切换为全屏模式，提供完整的聊天体验。</p>
      </div>

      <div class="card">
        <h2>边栏模式说明</h2>
        <p>边栏模式是紧凑模式的变体，聊天面板固定显示在页面右侧，适用于需要常驻聊天功能、方便用户随时咨询的场景。</p>
      </div>

      <div class="card">
        <h2>响应式设计</h2>
        <p>当屏幕宽度小于 768px 时，主内容自动隐藏，聊天组件占满整个屏幕，为移动用户提供优化的体验。</p>
      </div>

      <div class="features">
        <div class="feature">
          <h3>固定侧边栏</h3>
          <p>页面右侧固定显示聊天面板</p>
        </div>
        <div class="feature">
          <h3>会话管理</h3>
          <p>支持多会话管理和切换</p>
        </div>
        <div class="feature">
          <h3>不遮挡内容</h3>
          <p>侧边栏不影响主内容浏览</p>
        </div>
        <div class="feature">
          <h3>快速访问</h3>
          <p>无需点击，直接开始对话</p>
        </div>
      </div>
    </main>

    <!-- AI 聊天侧边栏 -->
    <aside class="chat-sidebar">
      <AIChatbot :config="config" />
    </aside>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.compact-demo {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.back-link {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.back-link:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 80px 40px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  overflow-y: auto;
}

.main-content h1 {
  font-size: 48px;
  margin-bottom: 8px;
}

.main-content .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 24px;
}

.main-content .description {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.85;
  margin-bottom: 32px;
  max-width: 600px;
}

.main-content .card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.main-content .card h2 {
  font-size: 20px;
  margin-bottom: 16px;
}

.main-content .card p {
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.9;
}

.main-content .card ul {
  padding-left: 20px;
}

.main-content .card li {
  margin-bottom: 8px;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.feature {
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}

.feature h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #409eff;
}

.feature p {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
}

/* AI 聊天侧边栏容器 */
.chat-sidebar {
  width: 400px;
  min-height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .compact-demo {
    flex-direction: column;
  }

  .main-content {
    display: none;
  }

  .chat-sidebar {
    width: 100vw;
    min-height: 100vh;
  }

  .back-link {
    top: 10px;
    left: 10px;
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>

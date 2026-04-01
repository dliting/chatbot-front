<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const { settings } = useSettings()

// 导航到指定模式的演示页面
function goToDemo(mode: 'extended' | 'sidebar' | 'floating') {
  router.push(`/${mode}`)
}

function goToSettings() {
  router.push('/settings')
}
</script>

<template>
  <div class="landing-page">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <button class="settings-btn" title="设置" @click="goToSettings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <h1>AI Chatbot</h1>
        <p class="tagline">Vue 3 + TypeScript 通用聊天组件</p>
        <div class="header-badges">
          <span class="version">v1.0.0</span>
          <span class="mode-badge" :class="settings.backendMode">
            {{ settings.backendMode === 'mock' ? 'Mock 模式' : 'Real 模式' }}
          </span>
        </div>
      </div>

      <!-- Mode Cards -->
      <div class="mode-section">
        <h2 class="mode-section-title">选择交互模式</h2>
        <div class="mode-cards">
          <button class="mode-card primary" @click="goToDemo('extended')">
            <div class="mode-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
              </svg>
            </div>
            <h2>扩展模式</h2>
            <p class="subtitle">Extended Mode</p>
            <p class="description">全屏页面，内部使用平铺布局（会话列表 + 聊天区）</p>
          </button>

          <button class="mode-card primary" @click="goToDemo('sidebar')">
            <div class="mode-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
                <path d="M15 9l3 3-3 3"/>
              </svg>
            </div>
            <h2>边栏模式</h2>
            <p class="subtitle">Sidebar Mode</p>
            <p class="description">边栏形式，内部使用紧凑布局（Tab切换会话/聊天）</p>
          </button>

          <button class="mode-card primary" @click="goToDemo('floating')">
            <div class="mode-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h2>悬浮模式</h2>
            <p class="subtitle">Floating Mode</p>
            <p class="description">悬浮球 + 悬浮窗口，内部使用紧凑布局</p>
          </button>
        </div>
      </div>

      <!-- Features Section -->
      <div class="section">
        <h2>核心功能</h2>
        <div class="feature-list">
          <div class="feature-item">
            <div class="icon">💬</div>
            <span>流式对话响应</span>
          </div>
          <div class="feature-item">
            <div class="icon">🖼️</div>
            <span>图片上传支持</span>
          </div>
          <div class="feature-item">
            <div class="icon">🎨</div>
            <span>主题切换</span>
          </div>
          <div class="feature-item">
            <div class="icon">📱</div>
            <span>响应式设计</span>
          </div>
          <div class="feature-item">
            <div class="icon">📁</div>
            <span>会话管理</span>
          </div>
          <div class="feature-item">
            <div class="icon">🌐</div>
            <span>Iframe 嵌入</span>
          </div>
          <div class="feature-item">
            <div class="icon">⚡</div>
            <span>TypeScript</span>
          </div>
          <div class="feature-item">
            <div class="icon">🎯</div>
            <span>单元测试</span>
          </div>
        </div>
      </div>

      <!-- Quick Start Section -->
      <div class="section">
        <h2>快速开始</h2>

        <h3>安装</h3>
        <pre>npm install ai-chatbot</pre>

        <h3>基础使用</h3>
        <pre>import { createApp } from 'vue'
import AIChatbot from 'ai-chatbot'

const app = createApp(AIChatbot, {
  config: {
    mode: 'floating',
    apiBaseUrl: '/api',
    enableImageUpload: true,
  }
})
app.mount('#app')</pre>
      </div>

      <!-- Footer -->
      <footer>
        <p>AI Chatbot Component &copy; 2024</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}

/* Landing Page Styles */
.landing-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 40px 20px;
  color: #333;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  position: relative;
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInDown 0.8s ease;
}

.header h1 {
  font-size: 48px;
  color: white;
  margin-bottom: 12px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.header .tagline {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.header .version {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  color: white;
  backdrop-filter: blur(10px);
}

.header-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
  flex-wrap: wrap;
}

.settings-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  backdrop-filter: blur(10px);
  padding: 0;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.settings-btn svg {
  width: 20px;
  height: 20px;
}

.mode-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.mode-badge.mock {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.mode-badge.real {
  background: rgba(255, 200, 50, 0.3);
  color: #fff8e1;
}

.mode-section {
  margin-bottom: 32px;
}

.mode-section-title {
  color: white;
  font-size: 20px;
  margin-bottom: 16px;
  font-weight: 500;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.mode-card {
  background: var(--bg-base, white);
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: var(--shadow-lg, 0 10px 40px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
  cursor: pointer;
  animation: fadeInUp 0.8s ease backwards;
  border: none;
  text-align: left;
  display: block;
}

.mode-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mode-card.primary .mode-icon {
  background: rgba(255, 255, 255, 0.2);
}

.mode-card.primary h2,
.mode-card.primary .subtitle,
.mode-card.primary .description {
  color: white;
}

.mode-card:nth-child(1) { animation-delay: 0.1s; }
.mode-card:nth-child(2) { animation-delay: 0.2s; }
.mode-card:nth-child(3) { animation-delay: 0.3s; }

.mode-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.15));
}

.mode-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon svg {
  width: 32px;
  height: 32px;
  stroke: white;
}

.mode-card h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-primary, #333);
}

.mode-card .subtitle {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin-bottom: 16px;
}

.mode-card .description {
  font-size: 13px;
  color: var(--text-tertiary, #888);
  line-height: 1.6;
}

.section {
  background: var(--bg-base, white);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-lg, 0 10px 40px rgba(0, 0, 0, 0.1));
  animation: fadeInUp 0.8s ease backwards;
  animation-delay: 0.4s;
}

.section h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--text-primary, #333);
}

.section h3 {
  font-size: 18px;
  margin: 24px 0 12px;
  color: var(--theme-primary, #409eff);
}

.section p {
  font-size: 15px;
  color: var(--text-secondary, #666);
  line-height: 1.8;
  margin-bottom: 12px;
}

.section code {
  background: var(--bg-secondary, #f5f7fa);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: var(--color-warning, #e6a23c);
}

.section pre {
  background: #1a1a2e;
  color: #e5e5e5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  font-size: 13px;
  line-height: 1.6;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary, #f5f7fa);
  border-radius: 8px;
}

.feature-item .icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.feature-item span {
  font-size: 14px;
  color: var(--text-secondary, #666);
}

footer {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header h1 {
    font-size: 36px;
  }

  .mode-cards {
    grid-template-columns: 1fr;
  }

  .back-button {
    top: 8px;
    left: 8px;
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>

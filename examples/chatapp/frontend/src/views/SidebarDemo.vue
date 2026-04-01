<script setup lang="ts">
import { computed } from 'vue'
import { AIChatbot } from 'chatbot'
import { useSettings } from '../composables/useSettings'

const { getApiBaseUrl, settings } = useSettings()

const config = computed(() => ({
  mode: 'sidebar', // 边栏模式，内部使用单栏布局（Tab切换会话/聊天）
  panelWidth: 400,
  defaultExpanded: true,
  apiBaseUrl: getApiBaseUrl(),
  streamEnabled: true,
  streamTimeout: settings.apiTimeout,
  enableImageUpload: true,
  maxImageCount: 3,
  enableTopicManager: true,
  enableThinking: true,
  theme: settings.theme,
  labels: {
    title: '智能助手',
    placeholder: '输入消息...',
    newChat: '新话题',
    history: '历史话题',
  },
}))
</script>

<template>
  <div class="sidebar-demo">
    <div class="main-content">
      <h1>主内容区域</h1>
      <p>这是页面的主内容区域。</p>
      <p>聊天边栏在右侧显示。</p>
    </div>
    <AIChatbot :config="config" />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.sidebar-demo {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  display: flex;
}

.main-content {
  flex: 1;
  padding: 40px;
  background: var(--bg-secondary, #f5f7fa);
  transition: background var(--transition-base);
}

.main-content h1 {
  margin-bottom: 16px;
  color: var(--text-primary, #303133);
}

.main-content p {
  color: var(--text-secondary, #606266);
  line-height: 1.6;
}

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10000;
  padding: 10px 20px;
  background: var(--bg-base, white);
  color: var(--text-primary, #303133);
  border: 1px solid var(--border-light, #ddd);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.back-button:hover {
  background: var(--bg-secondary, #f5f5f5);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
}

@media (max-width: 768px) {
  .back-button {
    top: 8px;
    left: 8px;
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>

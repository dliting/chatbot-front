<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AIChatbot } from 'chatbot'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const { getApiBaseUrl, settings } = useSettings()

const config = computed(() => ({
  mode: 'extended', // 使用新的交互模式参数
  layout: 'dual',  // 明确指定双栏布局
  defaultExpanded: true, // 默认展开聊天面板
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

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="extended-demo">
    <button class="back-button" @click="goHome">← 返回首页</button>
    <AIChatbot :config="config" />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.extended-demo {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10000;
  padding: 10px 20px;
  background: var(--bg-base, #ffffff);
  color: var(--text-primary, #303133);
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.back-button:hover {
  background: var(--bg-secondary, #f5f7fa);
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

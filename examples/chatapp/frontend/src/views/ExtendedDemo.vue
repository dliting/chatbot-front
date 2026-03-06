<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AIChatbot } from 'chatbot'

const router = useRouter()

const config = computed(() => ({
  mode: 'extended', // 使用新的交互模式参数
  layout: 'split',  // 明确指定平铺布局
  defaultExpanded: true, // 默认展开聊天面板
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10000;
  padding: 10px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.back-button:hover {
  background: #f5f5f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

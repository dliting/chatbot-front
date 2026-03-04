<script setup lang="ts">
import { AIChatbot } from 'chatbot'

const config = {
  chatMode: 'fullscreen' as const,
  apiBaseUrl: 'http://localhost:3000',
  streamEnabled: true,
  enableImageUpload: true,
  enableSessionManager: true,
  enableClearAll: true,
  labels: {
    title: 'ChatApp',
    placeholder: '输入消息...',
    send: '发送',
    newChat: '新对话',
    history: '历史记录',
    clearAll: '清空对话',
    delete: '删除',
    copy: '复制',
    resend: '重发',
    uploading: '上传中...',
    uploadFailed: '上传失败',
    retry: '重试',
    close: '关闭',
    expand: '展开',
    collapse: '收起'
  }
}
</script>

<template>
  <AIChatbot :config="config" />
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

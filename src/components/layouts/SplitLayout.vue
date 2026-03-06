<template>
  <div class="chatbot-split-layout">
    <!-- 左侧会话列表 -->
    <aside class="chatbot-split-layout__sidebar">
      <slot name="sidebar">
        <SessionListView />
      </slot>
    </aside>

    <!-- 右侧聊天区域 -->
    <main class="chatbot-split-layout__main">
      <slot name="main">
        <ChatArea />
      </slot>
    </main>
  </div>
</template>

<script setup lang="ts">
// SplitLayout: 平铺布局，会话列表始终显示在左侧
import SessionListView from '@/components/SessionListView.vue'
import ChatArea from '@/components/ChatArea.vue'
</script>

<style scoped lang="scss">
.chatbot-split-layout {
  display: flex;
  width: 100%;
  height: 100%;

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--chatbot-border-color, #e4e7ed);
    overflow: hidden;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>

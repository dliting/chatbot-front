<template>
  <div class="chatbot-dual-layout">
    <!-- 左侧话题列表 -->
    <aside class="chatbot-dual-layout__sidebar">
      <slot name="sidebar">
        <TopicListView />
      </slot>
    </aside>

    <!-- 右侧聊天区域 -->
    <main class="chatbot-dual-layout__main">
      <slot name="main">
        <ChatArea />
      </slot>
    </main>
  </div>
</template>

<script setup lang="ts">
// DualLayout: 双栏布局，话题列表始终显示在左侧
import TopicListView from '@/components/TopicListView.vue'
import ChatArea from '@/components/ChatArea.vue'
</script>

<style scoped lang="scss">
.chatbot-dual-layout {
  display: flex;
  width: 100%;
  height: 100%;

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--chatbot-border-color, #e4e7ed);
    overflow: hidden;

    // Mobile: collapse sidebar (full-width single column on mobile)
    @media (max-width: 768px) {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    // On mobile, main content takes full width
    @media (max-width: 768px) {
      width: 100%;
    }
  }
}
</style>

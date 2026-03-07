<template>
  <div class="chatbot-single-layout">
    <!-- Tab 导航 -->
    <div class="chatbot-single-layout__tabs">
      <button
        :class="['tab-btn', { active: currentView === 'sessions' }]"
        @click="handleViewChange('sessions')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
        会话
      </button>
      <button
        :class="['tab-btn', { active: currentView === 'chat' }]"
        @click="handleViewChange('chat')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        聊天
      </button>
    </div>

    <!-- 视图内容 -->
    <div class="chatbot-single-layout__content">
      <Transition name="fade" mode="out-in">
        <SessionListView v-if="currentView === 'sessions'" key="sessions" />
        <ChatArea v-else key="chat" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatbotState } from '@/composables/useChatbotState'
import SessionListView from '@/components/SessionListView.vue'
import ChatArea from '@/components/ChatContent.vue'

type ViewType = 'sessions' | 'chat'

const { state, setCurrentView } = useChatbotState({} as any)

const currentView = computed(() => state.ui.currentView)

const handleViewChange = (view: ViewType) => {
  setCurrentView(view)
}
</script>

<style scoped lang="scss">
.chatbot-single-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &__tabs {
    display: flex;
    border-bottom: 1px solid var(--chatbot-border-color, #e4e7ed);
    background: var(--chatbot-bg-color, #ffffff);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--chatbot-subtext-color, #909399);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--chatbot-border-color, #e4e7ed);
    }

    &.active {
      color: var(--chatbot-primary-color, #409eff);
      border-bottom: 2px solid var(--chatbot-primary-color, #409eff);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__content {
    flex: 1;
    overflow: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

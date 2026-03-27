<template>
  <div class="voice-overlay" @click.self="$emit('cancel')">
    <div class="voice-overlay__animation">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5">
        <path d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 10v2a7 7 0 01-14 0v-2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="19" x2="12" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="8" y1="23" x2="16" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="voice-overlay__text">正在录音...</div>
    <div class="voice-overlay__cancel" @click="$emit('cancel')">取消</div>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'cancel'): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
.voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;

  &__animation {
    width: 120px;
    height: 120px;
    background: var(--chatbot-primary-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: voice-pulse 1.5s infinite;

    svg {
      width: 50px;
      height: 50px;
      stroke: white;
    }
  }

  &__text {
    color: white;
    font-size: 16px;
    margin-top: 24px;
    font-weight: 500;
  }

  &__cancel {
    margin-top: 40px;
    padding: 12px 32px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 24px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

@keyframes voice-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 30px rgba(102, 126, 234, 0);
  }
}
</style>

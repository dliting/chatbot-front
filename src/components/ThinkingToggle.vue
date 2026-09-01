<template>
  <button
    :class="['thinking-toggle', { 'thinking-toggle--active': enabled }]"
    :disabled="disabled"
    :title="tooltip"
    @click="handleClick"
  >
    <svg
      class="thinking-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- Lightbulb shape -->
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
interface Props {
  enabled?: boolean
  disabled?: boolean
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  disabled: false,
  tooltip: '',
})

const emit = defineEmits<{
  (e: 'update:enabled', value: boolean): void
}>()

const handleClick = () => {
  if (props.disabled) return
  emit('update:enabled', !props.enabled)
}
</script>

<style scoped lang="scss">
.thinking-toggle {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    var(--chat-assistant-bg, #f0f0f3) 0%,
    var(--border-light, #e8e8ec) 100%
  );

  &__icon {
    width: 20px;
    height: 20px;
    stroke: var(--text-tertiary, #909399);
    transition: stroke 0.3s ease;
  }

  &:hover {
    transform: scale(1.05);
  }

  &--active {
    background: linear-gradient(135deg, #fff7e6 0%, #ffe4b5 100%);

    .thinking-toggle__icon {
      stroke: #e6a23c;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }
}
</style>

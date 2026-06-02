<template>
  <div :class="['thinking-block', { 'thinking-block--thinking': isThinking }]">
    <!-- Header -->
    <div class="thinking-block__header" @click="toggleExpanded">
      <div class="thinking-block__left">
        <svg
          :class="['thinking-block__icon', { 'thinking-block__icon--active': isThinking }]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </svg>
        <span class="thinking-block__label">
          <template v-if="isThinking">{{ mergedLabels.thinking }}</template>
          <template v-else>{{ formattedLabel }}</template>
        </span>
      </div>
      <svg
        :class="['thinking-block__arrow', { 'thinking-block__arrow--expanded': expanded }]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>

    <!-- Body (collapsible) -->
    <div v-if="expanded" class="thinking-block__body">
      <button
        class="thinking-block__copy"
        :title="mergedLabels.showThinking"
        @click.stop="handleCopy"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <div class="thinking-block__content markdown-content" v-html="renderedContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ChatbotLabels } from '@/types/config'
import { formatMarkdownContent } from '@/utils/helpers'

interface Props {
  content: string
  thinkingTime: number
  isThinking?: boolean
  autoCollapse?: boolean
  labels?: ChatbotLabels['thinking']
}

const props = withDefaults(defineProps<Props>(), {
  isThinking: false,
  autoCollapse: true,
  labels: () => ({}),
})

const emit = defineEmits<{
  (e: 'copy', content: string): void
}>()

const expanded = ref(false)

// Merged labels with defaults
const mergedLabels = computed(() => ({
  thinking: 'Thinking...',
  deeplyThought: 'Thought deeply for {seconds}s',
  showThinking: 'Show thinking process',
  hideThinking: 'Hide thinking process',
  ...props.labels,
}))

// Format thinking time to seconds with one decimal
const formattedTime = computed(() => {
  const seconds = props.thinkingTime / 1000
  return seconds.toFixed(1)
})

// Format label text with time placeholder
const formattedLabel = computed(() => {
  return mergedLabels.value.deeplyThought.replace('{seconds}', formattedTime.value)
})

// Render content via markdown
const renderedContent = computed(() => {
  return formatMarkdownContent(props.content)
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const handleCopy = () => {
  emit('copy', props.content)
}

// Auto-collapse when thinking finishes
watch(() => props.isThinking, (newVal, oldVal) => {
  if (oldVal === true && newVal === false && props.autoCollapse) {
    expanded.value = false
  }
})
</script>

<style scoped lang="scss">
.thinking-block {
  border-radius: 12px;
  background: var(--chat-assistant-bg, rgba(245, 247, 250, 0.8));
  border: 1px solid var(--border-light, rgba(0, 0, 0, 0.08));
  overflow: hidden;
  transition: border-color 0.3s ease;

  &--thinking {
    border-color: rgba(230, 162, 60, 0.4);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--border-light, rgba(0, 0, 0, 0.04));
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    width: 16px;
    height: 16px;
    stroke: var(--text-tertiary, #909399);
    flex-shrink: 0;

    &--active {
      stroke: var(--color-warning, #e6a23c);
      animation: thinking-pulse 1.5s infinite ease-in-out;
    }
  }

  &__label {
    font-size: 13px;
    color: var(--text-tertiary, #909399);
    line-height: 1;
  }

  &__arrow {
    width: 14px;
    height: 14px;
    stroke: var(--text-tertiary, #909399);
    flex-shrink: 0;
    transition: transform 0.3s ease;

    &--expanded {
      transform: rotate(180deg);
    }
  }

  &__body {
    position: relative;
    border-top: 1px solid var(--border-light, rgba(0, 0, 0, 0.08));
    max-height: 400px;
    overflow-y: auto;
    padding: 12px 14px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.3);
      border-radius: 2px;
    }
  }

  &__copy {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary, #909399);
    transition: all 0.2s ease;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      color: var(--text-primary, #303133);
      background-color: var(--border-light, rgba(0, 0, 0, 0.08));
    }
  }

  &__content {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-tertiary, #909399);
  }
}

@keyframes thinking-pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>

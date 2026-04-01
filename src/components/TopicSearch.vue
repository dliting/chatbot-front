<template>
  <div class="topic-search">
    <div class="topic-search__wrapper">
      <svg class="topic-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21l-4.35-4.35" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        class="topic-search__input"
        :placeholder="placeholder"
        @input="handleInput"
      />
      <button
        v-if="searchQuery"
        class="topic-search__clear"
        @click="handleClear"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search topics...',
  debounceMs: 300,
})

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const handleInput = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('search', searchQuery.value)
  }, props.debounceMs)
}

const handleClear = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('search', '')
  inputRef.value?.focus()
}

const focus = () => {
  inputRef.value?.focus()
}

// Sync with v-model
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

// Expose focus method
defineExpose({
  focus,
})
</script>

<style scoped lang="scss">
.topic-search {
  padding: 12px 16px;

  &__wrapper {
    display: flex;
    align-items: center;
    position: relative;
    background: var(--chatbot-input-bg, #f5f7fa);
    border: 1px solid var(--chatbot-input-border, #dcdfe6);
    border-radius: 8px;
    transition: all 0.2s;

    &:focus-within {
      border-color: var(--chatbot-primary-color, #409eff);
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }

  &__icon {
    position: absolute;
    left: 12px;
    width: 16px;
    height: 16px;
    color: var(--chatbot-subtext-color, #909399);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: 8px 36px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--chatbot-text-color, #303133);
    outline: none;

    &::placeholder {
      color: var(--chatbot-placeholder-color, #a8abb2);
    }
  }

  &__clear {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: var(--chatbot-subtext-color, #909399);
    border-radius: 50%;
    cursor: pointer;
    color: white;
    opacity: 0.8;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    svg {
      width: 12px;
      height: 12px;
    }
  }
}
</style>

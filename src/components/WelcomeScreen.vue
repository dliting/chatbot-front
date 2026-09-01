<template>
  <div class="welcome-screen">
    <h2 class="welcome-screen__title">{{ mergedLabels.welcomeTitle }}</h2>
    <p class="welcome-screen__subtitle">{{ mergedLabels.welcomeSubtitle }}</p>

    <!-- Quick Actions -->
    <div v-if="quickActions.length > 0" class="welcome-screen__quick-actions">
      <div
        v-for="action in quickActions"
        :key="action.id"
        class="welcome-screen__quick-action"
        @click="$emit('quick-action', action)"
      >
        <div class="welcome-screen__quick-action-icon">
          <component
            :is="builtinIconComponents[action.icon!]"
            v-if="resolvedIcons[action.id]?.type === 'builtin'"
            class="welcome-screen__icon-svg"
          />
          <img
            v-else-if="resolvedIcons[action.id]?.type === 'path'"
            :src="resolvedIcons[action.id]!.value"
            class="welcome-screen__icon-img"
          />
          <span v-else class="welcome-screen__quick-action-letter">
            {{ action.title.charAt(0) }}
          </span>
        </div>
        <div class="welcome-screen__quick-action-title">{{ action.title }}</div>
        <div v-if="action.description" class="welcome-screen__quick-action-desc">
          {{ action.description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatbotLabels, QuickAction } from '@/types/config'
import { getDefaultLabels } from '@/types/config'
import { resolveQuickActionIcon } from '@/utils/icons'
import { builtinIconComponents } from '@/utils/builtinIcons'

interface Props {
  quickActions: QuickAction[]
  iconBase?: string
  labels?: Partial<ChatbotLabels>
}

const props = withDefaults(defineProps<Props>(), {
  quickActions: () => [],
})

interface Emits {
  (e: 'quick-action', action: QuickAction): void
}

defineEmits<Emits>()

const mergedLabels = computed(() => ({
  ...getDefaultLabels(),
  ...props.labels,
}))

const resolvedIcons = computed(() => {
  const map: Record<string, ReturnType<typeof resolveQuickActionIcon>> = {}
  for (const action of props.quickActions) {
    map[action.id] = resolveQuickActionIcon(action.icon, props.iconBase)
  }
  return map
})
</script>

<style scoped lang="scss">
.welcome-screen {
  text-align: center;
  padding: 40px 20px;

  &__title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary, #1a1a2e);
  }

  &__subtitle {
    font-size: 14px;
    color: var(--text-tertiary, #6b7280);
    font-weight: 300;
    margin-bottom: 24px;
  }

  &__quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__quick-action {
    background: var(--quick-action-bg, rgba(255, 255, 255, 0.7));
    backdrop-filter: blur(10px);
    border: 1px solid var(--quick-action-border, rgba(255, 255, 255, 0.5));
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
    }
  }

  &__quick-action-icon {
    width: 36px;
    height: 36px;
    background: var(--theme-primary-gradient);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  &__icon-svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &__icon-img {
    width: 20px;
    height: 20px;
  }

  &__quick-action-letter {
    font-size: 16px;
    font-weight: 600;
    color: white;
    line-height: 1;
  }

  &__quick-action-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #1a1a2e);
    margin-bottom: 4px;
  }

  &__quick-action-desc {
    font-size: 12px;
    color: var(--text-tertiary, #6b7280);
  }
}
</style>

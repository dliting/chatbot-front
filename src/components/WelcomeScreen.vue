<template>
  <div class="welcome-screen">
    <h2 class="welcome-screen__title">{{ labels.welcomeTitle }}</h2>
    <p class="welcome-screen__subtitle">{{ labels.welcomeSubtitle }}</p>

    <!-- Quick Actions -->
    <div v-if="showQuickActions" class="welcome-screen__quick-actions">
      <div
        v-for="action in quickActions"
        :key="action.id"
        class="welcome-screen__quick-action"
        @click="$emit('quick-action', action.text)"
      >
        <div class="welcome-screen__quick-action-icon">
          <component :is="action.icon" />
        </div>
        <div class="welcome-screen__quick-action-title">{{ action.title }}</div>
        <div class="welcome-screen__quick-action-desc">{{ action.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import type { ChatbotLabels } from '@/types/config'
import { getDefaultLabels } from '@/types/config'

interface Props {
  labels?: Partial<ChatbotLabels>
  showQuickActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showQuickActions: true,
})

interface Emits {
  (e: 'quick-action', text: string): void
}

defineEmits<Emits>()

const mergedLabels = computed(() => ({
  ...getDefaultLabels(),
  ...props.labels,
}))

const WriteIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' }),
  h('path', { d: 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' })
])

const DocIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }),
  h('path', { d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8' })
])

const GlobeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('path', { d: 'M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' })
])

const CubeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' }),
  h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  h('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })
])

const quickActions = computed(() => [
  { id: 1, title: mergedLabels.value.quickAction1Title, desc: mergedLabels.value.quickAction1Desc, text: mergedLabels.value.quickAction1Text, icon: WriteIcon },
  { id: 2, title: mergedLabels.value.quickAction2Title, desc: mergedLabels.value.quickAction2Desc, text: mergedLabels.value.quickAction2Text, icon: DocIcon },
  { id: 3, title: mergedLabels.value.quickAction3Title, desc: mergedLabels.value.quickAction3Desc, text: mergedLabels.value.quickAction3Text, icon: GlobeIcon },
  { id: 4, title: mergedLabels.value.quickAction4Title, desc: mergedLabels.value.quickAction4Desc, text: mergedLabels.value.quickAction4Text, icon: CubeIcon },
])
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

    svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }
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

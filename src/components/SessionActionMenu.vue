<template>
  <div
    class="session-action-menu"
    @contextmenu.prevent="handleContextMenu"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <slot />

    <Teleport to="body">
      <Transition name="menu-popover">
        <div
          v-if="visible"
          class="session-action-menu__popover"
          :style="popoverStyle"
          @click.stop
        >
          <div class="session-action-menu__list">
            <button
              class="session-action-menu__item"
              @click="handleAction('edit')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ editLabel }}</span>
            </button>
            <button
              class="session-action-menu__item session-action-menu__item--danger"
              @click="handleAction('delete')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ deleteLabel }}</span>
            </button>
          </div>
        </div>
      </Transition>
      <div
        v-if="visible"
        class="session-action-menu__backdrop"
        @click="closeMenu"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface Props {
  editLabel?: string
  deleteLabel?: string
  longPressDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  editLabel: 'Rename',
  deleteLabel: 'Delete',
  longPressDelay: 500,
})

interface Emits {
  (e: 'edit'): void
  (e: 'delete'): void
}

const emit = defineEmits<Emits>()

const visible = ref(false)
const position = ref({ x: 0, y: 0 })
let touchTimer: ReturnType<typeof setTimeout> | null = null
let touchStartPos = { x: 0, y: 0 }

const popoverStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}))

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  showMenu(e.clientX, e.clientY)
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartPos = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  }
  touchTimer = setTimeout(() => {
    showMenu(touchStartPos.x, touchStartPos.y)
  }, props.longPressDelay)
}

const handleTouchEnd = () => {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

const showMenu = (x: number, y: number) => {
  // Calculate position to keep menu within viewport
  const menuWidth = 180
  const menuHeight = 100
  const padding = 10

  let posX = x + padding
  let posY = y + padding

  if (posX + menuWidth > window.innerWidth) {
    posX = x - menuWidth - padding
  }

  if (posY + menuHeight > window.innerHeight) {
    posY = y - menuHeight - padding
  }

  position.value = { x: posX, y: posY }
  visible.value = true
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('scroll', handleScroll, true)
}

const closeMenu = () => {
  visible.value = false
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('scroll', handleScroll, true)
}

const handleAction = (action: 'edit' | 'delete') => {
  emit(action)
  closeMenu()
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.session-action-menu__popover')) {
    closeMenu()
  }
}

const handleScroll = () => {
  closeMenu()
}

onUnmounted(() => {
  closeMenu()
  if (touchTimer) {
    clearTimeout(touchTimer)
  }
})
</script>

<style scoped lang="scss">
.session-action-menu {
  position: relative;
}

.session-action-menu__popover {
  position: fixed;
  z-index: 10000;
  background: var(--chatbot-bg-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  overflow: hidden;
}

.session-action-menu__list {
  padding: 4px;
}

.session-action-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--chatbot-text-color, #303133);
  transition: background-color 0.2s;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--chatbot-primary-color-light, #ecf5ff);
  }

  &--danger {
    color: var(--chatbot-danger-color, #f56c6c);

    &:hover {
      background: var(--chatbot-danger-color-light, #fef0f0);
    }
  }
}

.session-action-menu__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

// Transitions
.menu-popover-enter-active,
.menu-popover-leave-active {
  transition: all 0.2s ease;
}

.menu-popover-enter-from,
.menu-popover-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.menu-popover-enter-to,
.menu-popover-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

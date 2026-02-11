<template>
  <Transition name="chatbot-ball-fade">
    <div
      v-if="visible"
      ref="ballRef"
      :class="classes"
      :style="ballStyle"
      @mousedown="handleMouseDown"
      @click="handleClick"
    >
      <!-- Icon slot or default icon -->
      <slot name="icon">
        <svg class="chatbot-ball__icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </slot>

      <!-- Badge (optional) -->
      <span v-if="badge !== null" :class="badgeClasses">
        {{ typeof badge === 'number' && badge > 99 ? '99+' : badge }}
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Position } from '@/types'
import { makeDraggable, getInitialPosition } from '@/utils/drag'

interface Props {
  position?: Position
  size?: number
  iconColor?: string
  backgroundColor?: string
  badge?: number | null
  visible?: boolean
  draggable?: boolean
  clickToOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  size: 56,
  iconColor: '#ffffff',
  backgroundColor: '#409eff',
  badge: null,
  visible: true,
  draggable: true,
  clickToOpen: true,
})

interface Emits {
  (e: 'click'): void
  (e: 'dragStart', position: { x: number; y: number }): void
  (e: 'dragMove', position: { x: number; y: number }): void
  (e: 'dragEnd', position: { x: number; y: number }): void
}

const emit = defineEmits<Emits>()

const ballRef = ref<HTMLElement>()
const currentPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const hasMoved = ref(false)

// Classes
const classes = computed(() => [
  'chatbot-ball',
  `chatbot-ball--${props.position}`,
  {
    'chatbot-ball--dragging': isDragging.value,
  },
])

const badgeClasses = computed(() => [
  'chatbot-ball__badge',
  {
    'chatbot-ball__badge--dot': typeof props.badge === 'number' && props.badge > 99,
  },
])

// Style
const ballStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: props.backgroundColor,
  color: props.iconColor,
  left: `${currentPosition.value.x}px`,
  top: `${currentPosition.value.y}px`,
}))

// Initialize position
const initPosition = () => {
  if (!ballRef.value) return

  const size = { width: props.size, height: props.size }
  const pos = getInitialPosition(props.position, size)
  currentPosition.value = pos
}

// Handle mouse down (start drag)
const handleMouseDown = (event: MouseEvent) => {
  if (!props.draggable) return
  if (event.button !== 0) return // Only left click

  hasMoved.value = false
  isDragging.value = false
}

// Handle mouse click
const handleClick = (event: MouseEvent) => {
  // Don't emit click if dragging occurred
  if (hasMoved.value) return

  if (props.clickToOpen) {
    emit('click')
  }
}

// Setup drag
let cleanupDrag: (() => void) | null = null

const setupDrag = () => {
  if (!ballRef.value || !props.draggable) return

  cleanupDrag = makeDraggable(ballRef.value, {
    throttleMs: 16,
    onDragStart: (pos) => {
      isDragging.value = true
      hasMoved.value = true
      currentPosition.value = pos
      emit('dragStart', pos)
    },
    onDragMove: (pos) => {
      currentPosition.value = pos
      emit('dragMove', pos)
    },
    onDragEnd: (pos) => {
      isDragging.value = false
      currentPosition.value = pos
      emit('dragEnd', pos)
    },
  })
}

// Watch position prop changes
watch(() => props.position, () => {
  if (!isDragging.value) {
    initPosition()
  }
})

// Lifecycle
onMounted(() => {
  initPosition()
  setupDrag()
})

onUnmounted(() => {
  cleanupDrag?.()
})
</script>

<style scoped lang="scss">
.chatbot-ball {
  position: fixed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }

  &--dragging {
    cursor: grabbing;
    transition: none;
  }

  &__icon {
    width: 50%;
    height: 50%;
    fill: currentColor;
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background-color: var(--chatbot-danger-color, #f56c6c);
    color: #fff;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    font-weight: 500;

    &--dot::after {
      content: '+';
    }
  }
}

// Transitions
.chatbot-ball-fade-enter-active,
.chatbot-ball-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.chatbot-ball-fade-enter-from,
.chatbot-ball-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
